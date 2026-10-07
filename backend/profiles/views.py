import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from rest_framework import status, serializers
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema, inline_serializer

from .models import UserProfile, SubscriptionPlan, Subscription
from .razorpay_client import client
from .serializers import (
    UserProfileSerializer,
    SubscriptionPlanSerializer,
    CreateSubscriptionOrderSerializer,
    VerifySubscriptionPaymentSerializer,
    SubscriptionSerializer,
    PublicWriterProfileSerializer,
)

from .services import (
    create_subscription_order,
    verify_subscription_payment,
    process_razorpay_webhook,
)


logger = logging.getLogger(__name__)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses=UserProfileSerializer
    )
    def get(self, request):
        profile, created = UserProfile.objects.get_or_create(
            user=request.user
        )

        serializer = UserProfileSerializer(profile)

        return Response(serializer.data)

    @extend_schema(
        request=UserProfileSerializer,
        responses={
            200: UserProfileSerializer,
            400: UserProfileSerializer,
        },
    )
    def patch(self, request):
        profile, created = UserProfile.objects.get_or_create(
            user=request.user
        )

        serializer = UserProfileSerializer(
            profile,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class SubscriptionPlanListView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        responses=SubscriptionPlanSerializer(many=True)
    )
    def get(self, request):
        plans = SubscriptionPlan.objects.filter(
            is_active=True,
        ).order_by('price')

        serializer = SubscriptionPlanSerializer(
            plans,
            many=True
        )

        return Response(serializer.data)


class CreateSubscriptionOrderView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=CreateSubscriptionOrderSerializer,
        responses={
            201: inline_serializer(
                name='CreateSubscriptionOrderResponse',
                fields={
                    'subscription_id': serializers.IntegerField(),
                    'plan_id': serializers.IntegerField(),
                    'plan_name': serializers.CharField(),
                    'amount': serializers.DecimalField(
                        max_digits=10,
                        decimal_places=2,
                    ),
                    'currency': serializers.CharField(),
                    'razorpay_order_id': serializers.CharField(),
                    'razorpay_key_id': serializers.CharField(),
                },
            ),
            404: inline_serializer(
                name='SubscriptionPlanNotFoundResponse',
                fields={
                    'detail': serializers.CharField(),
                },
            ),
        },
    )
    @transaction.atomic
    def post(self, request):
        serializer = CreateSubscriptionOrderSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        plan_id = serializer.validated_data['plan_id']

        try:
            plan = SubscriptionPlan.objects.get(
                id=plan_id,
                is_active=True
            )
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {'detail': 'Subscription plan not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        subscription, razorpay_order = create_subscription_order(
            request.user,
            plan,
            client,
        )

        return Response(
            {
                'subscription_id': subscription.id,
                'plan_id': plan.id,
                'plan_name': plan.name,
                'amount': plan.price,
                'currency': 'INR',
                'razorpay_order_id': razorpay_order['id'],
                'razorpay_key_id': settings.RAZORPAY_KEY_ID,
            },
            status=status.HTTP_201_CREATED
        )


class VerifySubscriptionPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=VerifySubscriptionPaymentSerializer,
        responses={
            200: inline_serializer(
                name='VerifySubscriptionPaymentResponse',
                fields={
                    'detail': serializers.CharField(),
                    'subscription_id': serializers.IntegerField(),
                    'status': serializers.CharField(),
                    'start_date': serializers.DateTimeField(),
                    'end_date': serializers.DateTimeField(),
                    'payment_id': serializers.CharField(),
                    'is_premium': serializers.BooleanField(),
                },
            ),
            400: inline_serializer(
                name='VerifySubscriptionPaymentErrorResponse',
                fields={
                    'detail': serializers.CharField(),
                },
            ),
            404: inline_serializer(
                name='VerifySubscriptionPaymentNotFoundResponse',
                fields={
                    'detail': serializers.CharField(),
                },
            ),
        },
    )
    def post(self, request):
        serializer = VerifySubscriptionPaymentSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        subscription_id = serializer.validated_data['subscription_id']
        razorpay_order_id = serializer.validated_data['razorpay_order_id']
        razorpay_payment_id = serializer.validated_data['razorpay_payment_id']
        razorpay_signature = serializer.validated_data['razorpay_signature']

        result = verify_subscription_payment(
            user=request.user,
            subscription_id=subscription_id,
            razorpay_order_id=razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id,
            razorpay_signature=razorpay_signature,
            razorpay_client=client,
        )

        if not result['success']:
            return Response(
                {'detail': result['error']},
                status=result['status']
            )

        subscription = result['subscription']
        profile = request.user.profile

        return Response(
            {
                'detail': 'Payment verified successfully.',
                'subscription_id': subscription.id,
                'status': subscription.status,
                'start_date': subscription.start_date,
                'end_date': subscription.end_date,
                'payment_id': subscription.payment_id,
                'is_premium': profile.is_premium,
            },
            status=status.HTTP_200_OK
        )


class SubscriptionListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses=SubscriptionSerializer(many=True)
    )
    def get(self, request):
        subscriptions = (
            Subscription.objects
            .filter(user=request.user)
            .select_related('plan')
            .order_by('-created_at')
        )

        serializer = SubscriptionSerializer(
            subscriptions,
            many=True
        )

        return Response(serializer.data)


class ActiveSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={
            200: SubscriptionSerializer,
            404: inline_serializer(
                name='ActiveSubscriptionNotFoundResponse',
                fields={
                    'detail': serializers.CharField(),
                },
            ),
        },
    )
    def get(self, request):
        subscription = (
            Subscription.objects
            .filter(
                user=request.user,
                status='active',
                end_date__gt=timezone.now()
            )
            .select_related('plan')
            .order_by('-end_date')
            .first()
        )

        if not subscription:
            return Response(
                {'detail': 'No active subscription found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = SubscriptionSerializer(subscription)

        return Response(serializer.data)


class RazorpayWebhookView(APIView):
    permission_classes = []

    @extend_schema(
        request=None,
        auth=[],
        responses={
            200: inline_serializer(
                name='RazorpayWebhookSuccessResponse',
                fields={
                    'detail': serializers.CharField(),
                    'subscription_id': serializers.IntegerField(
                        required=False
                    ),
                    'status': serializers.CharField(
                        required=False
                    ),
                    'payment_id': serializers.CharField(
                        required=False
                    ),
                },
            ),
            400: inline_serializer(
                name='RazorpayWebhookErrorResponse',
                fields={
                    'detail': serializers.CharField(),
                },
            ),
        },
    )
    def post(self, request):
        payload = request.body.decode('utf-8')

        webhook_signature = request.headers.get(
            'X-Razorpay-Signature'
        )

        if not webhook_signature:
            return Response(
                {
                    'detail': 'Webhook signature is missing.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        result = process_razorpay_webhook(
            payload=payload,
            webhook_signature=webhook_signature,
            webhook_secret=settings.RAZORPAY_WEBHOOK_SECRET,
            razorpay_client=client,
        )

        if not result['success']:
            return Response(
                {'detail': result['error']},
                status=result['status']
            )

        if result.get('ignored'):
            return Response(
                {'detail': result['message']},
                status=result['status']
            )

        if result.get('already_processed'):
            return Response(
                {'detail': result['message']},
                status=result['status']
            )

        subscription = result['subscription']

        logger.info(
            "Subscription %s activated through Razorpay webhook.",
            subscription.id
        )

        return Response(
            {
                'detail': result['message'],
                'subscription_id': subscription.id,
                'status': subscription.status,
                'payment_id': subscription.payment_id,
            },
            status=result['status']
        )


class PublicWriterProfileView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        responses={
            200: PublicWriterProfileSerializer,
            404: inline_serializer(
                name='PublicWriterNotFoundResponse',
                fields={
                    'detail': serializers.CharField(),
                },
            ),
        },
    )
    def get(self, request, username):
        User = get_user_model()

        try:
            user = User.objects.get(
                username=username,
                is_active=True
            )

        except User.DoesNotExist:
            return Response(
                {'detail': 'Writer not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        profile, created = UserProfile.objects.get_or_create(
            user=user
        )

        serializer = PublicWriterProfileSerializer(profile,context={'request': request},)

        return Response(serializer.data)