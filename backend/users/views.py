from rest_framework import status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, inline_serializer

from .serializers import RegisterSerializer


class RegisterView(APIView):

    @extend_schema(
        request=RegisterSerializer,
        responses={
            201: inline_serializer(
                name='RegisterResponse',
                fields={
                    'message': serializers.CharField(),
                    'user': inline_serializer(
                        name='RegisteredUser',
                        fields={
                            'id': serializers.IntegerField(),
                            'username': serializers.CharField(),
                            'email': serializers.EmailField(),
                            'first_name': serializers.CharField(),
                            'last_name': serializers.CharField(),
                        },
                    ),
                },
            ),
            400: RegisterSerializer,
        },
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            return Response(
                {
                    "message": "User registered successfully",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses=inline_serializer(
            name='MeResponse',
            fields={
                'id': serializers.IntegerField(),
                'username': serializers.CharField(),
                'email': serializers.EmailField(),
                'first_name': serializers.CharField(),
                'last_name': serializers.CharField(),
            },
        )
    )
    def get(self, request):
        user = request.user

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
            }
        )