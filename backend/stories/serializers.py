from django.utils import timezone
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

from .content_utils import render_safe_markdown

from .models import (
    Story,
    Tag,
    Topic,
    Comment,
    Clap,
    Follow,
    ReadingList,
)


class StorySerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(
        source='author.username',
        read_only=True,
    )

    read_time_display = serializers.SerializerMethodField()

    tags = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Tag.objects.all(),
        required=False,
    )

    topics = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Topic.objects.all(),
        required=False,
    )

    @extend_schema_field(serializers.CharField())
    def get_read_time_display(self, obj):
        return f"{obj.read_time} min read"

    def validate(self, attrs):
        status_value = attrs.get(
            'status',
            self.instance.status if self.instance else 'draft'
        )

        scheduled_at = attrs.get(
            'scheduled_at',
            self.instance.scheduled_at if self.instance else None
        )

        if status_value == 'scheduled':
            if not scheduled_at:
                raise serializers.ValidationError({
                    'scheduled_at': (
                        'Scheduled stories require a scheduled '
                        'date and time.'
                    )
                })

            if scheduled_at <= timezone.now():
                raise serializers.ValidationError({
                    'scheduled_at': (
                        'Scheduled time must be in the future.'
                    )
                })

        return attrs

    class Meta:
        model = Story

        fields = [
            'id',
            'author',
            'author_username',
            'title',
            'slug',
            'content',
            'cover_image',
            'status',
            'visibility',
            'tags',
            'topics',
            'scheduled_at',
            'published_at',
            'read_time',
            'read_time_display',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'author',
            'author_username',
            'slug',
            'read_time',
            'read_time_display',
            'created_at',
            'updated_at',
        ]


class StoryReaderSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(
        source='author.username',
        read_only=True,
    )

    read_time_display = serializers.SerializerMethodField()
    rendered_content = serializers.SerializerMethodField()

    class Meta:
        model = Story

        fields = [
            'id',
            'author',
            'author_username',
            'title',
            'slug',
            'content',
            'rendered_content',
            'cover_image',
            'visibility',
            'read_time',
            'read_time_display',
            'published_at',
        ]

        read_only_fields = fields

    @extend_schema_field(serializers.CharField())
    def get_read_time_display(self, obj):
        return f"{obj.read_time} min read"

    def get_rendered_content(self, obj):
        return render_safe_markdown(obj.content)


class TagSerializer(serializers.ModelSerializer):

    class Meta:
        model = Tag

        fields = [
            'id',
            'name',
            'slug',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'slug',
            'created_at',
        ]


class TopicSerializer(serializers.ModelSerializer):

    class Meta:
        model = Topic

        fields = [
            'id',
            'name',
            'slug',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'slug',
            'created_at',
        ]



class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source='user.username',
        read_only=True,
    )

    profile_image = serializers.ImageField(
        source='user.profile.profile_image',
        read_only=True,
    )

    class Meta:
        model = Comment

        fields = [
            'id',
            'story',
            'user',
            'username',
            'profile_image',
            'parent',
            'content',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'story',
            'user',
            'username',
            'profile_image',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):
        parent = attrs.get('parent')

        if parent:
            story = self.context.get('story')

            if story is None:
                raise serializers.ValidationError({
                    'story': 'Story context is required.'
                })

            if parent.story_id != story.id:
                raise serializers.ValidationError({
                    'parent': (
                        'You can only reply to a comment '
                        'on the same story.'
                    )
                })

        return attrs


class ClapSerializer(serializers.ModelSerializer):

    class Meta:
        model = Clap

        fields = [
            'id',
            'story',
            'user',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'story',
            'user',
            'created_at',
        ]


class FollowSerializer(serializers.ModelSerializer):
    follower_username = serializers.CharField(
        source='follower.username',
        read_only=True,
    )

    following_username = serializers.CharField(
        source='following.username',
        read_only=True,
    )

    class Meta:
        model = Follow

        fields = [
            'id',
            'follower',
            'follower_username',
            'following',
            'following_username',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'follower',
            'follower_username',
            'following_username',
            'created_at',
        ]


class ReadingListSerializer(serializers.ModelSerializer):
    story_title = serializers.CharField(
        source='story.title',
        read_only=True,
    )

    story_slug = serializers.CharField(
        source='story.slug',
        read_only=True,
    )

    story_author = serializers.CharField(
        source='story.author.username',
        read_only=True,
    )

    read_time = serializers.IntegerField(
        source='story.read_time',
        read_only=True,
    )

    saved_at = serializers.DateTimeField(
        source='created_at',
        read_only=True,
    )

    class Meta:
        model = ReadingList

        fields = [
            'id',
            'story',
            'story_title',
            'story_slug',
            'story_author',
            'read_time',
            'saved_at',
        ]

        read_only_fields = [
            'id',
            'story_title',
            'story_slug',
            'story_author',
            'read_time',
            'saved_at',
        ]


class FeedStorySerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(
        source='author.username',
        read_only=True,
    )

    read_time_display = serializers.SerializerMethodField()

    class Meta:
        model = Story

        fields = [
            'id',
            'author',
            'author_username',
            'title',
            'slug',
            'cover_image',
            'visibility',
            'read_time',
            'read_time_display',
            'published_at',
        ]

        read_only_fields = fields

    @extend_schema_field(serializers.CharField())
    def get_read_time_display(self, obj):
        return f"{obj.read_time} min read"


class PublicStorySerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(
        source='author.username',
        read_only=True,
    )

    read_time_display = serializers.SerializerMethodField()

    class Meta:
        model = Story

        fields = [
            'id',
            'author',
            'author_username',
            'title',
            'slug',
            'cover_image',
            'visibility',
            'read_time',
            'read_time_display',
            'published_at',
        ]

        read_only_fields = fields

    @extend_schema_field(serializers.CharField())
    def get_read_time_display(self, obj):
        return f"{obj.read_time} min read"


class FollowCreateSerializer(serializers.Serializer):
    following = serializers.IntegerField(
        required=True,
        min_value=1,
    )


class ReadingListCreateSerializer(serializers.Serializer):
    story = serializers.IntegerField(
        required=True,
        min_value=1,
    )