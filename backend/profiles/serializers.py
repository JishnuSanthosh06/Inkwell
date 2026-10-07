from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

from .models import (
    UserProfile,
    SubscriptionPlan,
    Subscription,
)

from stories.models import Story, Follow


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source='user.username',
        read_only=True,
    )

    email = serializers.EmailField(
        source='user.email',
        read_only=True,
    )

    has_active_premium = serializers.BooleanField(
        read_only=True,
    )

    class Meta:
        model = UserProfile

        fields = [
            'id',
            'username',
            'email',
            'bio',
            'profile_image',
            'is_premium',
            'premium_expires_at',
            'has_active_premium',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'username',
            'email',
            'is_premium',
            'premium_expires_at',
            'has_active_premium',
            'created_at',
            'updated_at',
        ]


class SubscriptionPlanSerializer(serializers.ModelSerializer):

    class Meta:
        model = SubscriptionPlan

        fields = [
            'id',
            'name',
            'plan_type',
            'price',
            'duration_days',
            'is_active',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
        ]


class CreateSubscriptionOrderSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()


class VerifySubscriptionPaymentSerializer(serializers.Serializer):
    subscription_id = serializers.IntegerField()
    razorpay_order_id = serializers.CharField()
    razorpay_payment_id = serializers.CharField()
    razorpay_signature = serializers.CharField()


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(
        source='plan.name',
        read_only=True,
    )

    plan_type = serializers.CharField(
        source='plan.plan_type',
        read_only=True,
    )

    amount = serializers.DecimalField(
        source='plan.price',
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = Subscription

        fields = [
            'id',
            'plan_name',
            'plan_type',
            'amount',
            'status',
            'start_date',
            'end_date',
            'payment_id',
            'razorpay_order_id',
            'created_at',
            'updated_at',
        ]

        read_only_fields = fields


class PublicWriterStorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Story

        fields = [
            'id',
            'title',
            'slug',
            'cover_image',
            'visibility',
            'read_time',
            'published_at',
        ]

        read_only_fields = fields


class PublicWriterProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source='user.username',
        read_only=True,
    )

    first_name = serializers.CharField(
        source='user.first_name',
        read_only=True,
    )

    last_name = serializers.CharField(
        source='user.last_name',
        read_only=True,
    )

    stories = serializers.SerializerMethodField()

    is_following = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile

        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'bio',
            'profile_image',
            'created_at',
            'stories',
            'is_following',
        ]

        read_only_fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'bio',
            'profile_image',
            'created_at',
            'stories',
            'is_following',
        ]

    @extend_schema_field(PublicWriterStorySerializer(many=True))
    def get_stories(self, obj):
        stories = Story.objects.filter(
            author=obj.user,
            status='published',
        ).order_by('-published_at')

        return PublicWriterStorySerializer(
            stories,
            many=True,
        ).data

    def get_is_following(self, obj):
        request = self.context.get('request')

        if not request:
            return False

        if not request.user.is_authenticated:
            return False

        return Follow.objects.filter(
            follower=request.user,
            following=obj.user,
        ).exists()

