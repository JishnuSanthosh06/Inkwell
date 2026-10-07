from rest_framework import status, serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import viewsets

from drf_spectacular.utils import extend_schema, inline_serializer

from users.permissions import (
    IsAuthenticatedMember,
    IsStoryAuthor,
)

from .services import (
    add_to_reading_list,
    remove_from_reading_list,
    create_follow,
    remove_follow,
    create_comment,
    create_clap,
    create_story,
    update_story,
    get_story_read_data,
)

from .models import (
    Story,
    Tag,
    Topic,
    Comment,
    Clap,
    Follow,
    ReadingList,
)

from .serializers import (
    StorySerializer,
    StoryReaderSerializer,
    FeedStorySerializer,
    TagSerializer,
    TopicSerializer,
    PublicStorySerializer,
    CommentSerializer,
    ClapSerializer,
    FollowSerializer,
    ReadingListSerializer,
    FollowCreateSerializer,
    ReadingListCreateSerializer,
)


class StoryListCreateView(APIView):
    permission_classes = [IsAuthenticatedMember]

    @extend_schema(
        operation_id='stories_list',
        responses=StorySerializer(many=True),
    )
    def get(self, request):
        stories = Story.objects.filter(author=request.user)

        serializer = StorySerializer(
            stories,
            many=True
        )

        return Response(serializer.data)

    @extend_schema(
        operation_id='stories_create',
        request=StorySerializer,
        responses={
            201: StorySerializer,
            400: StorySerializer,
        },
    )
    def post(self, request):
        serializer = StorySerializer(
            data=request.data
        )

        if serializer.is_valid():
            story = create_story(
                request.user,
                serializer.validated_data
            )

            response_serializer = StorySerializer(story)

            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class StoryDetailView(APIView):
    permission_classes = [IsAuthenticatedMember]

    def get_object(self, pk):
        try:
            return Story.objects.get(pk=pk)
        except Story.DoesNotExist:
            return None

    def check_author_permission(self, request, story):
        permission = IsStoryAuthor()

        if not permission.has_object_permission(
            request,
            self,
            story
        ):
            self.permission_denied(
                request,
                message=permission.message
            )

    @extend_schema(
        operation_id='stories_detail',
        responses={
            200: StorySerializer,
            404: inline_serializer(
                name='StoryNotFoundResponse',
                fields={
                    'detail': serializers.CharField(),
                },
            ),
        },
    )
    def get(self, request, pk):
        story = self.get_object(pk)

        if not story:
            return Response(
                {'detail': 'Story not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        self.check_author_permission(
            request,
            story
        )

        serializer = StorySerializer(story)

        return Response(serializer.data)

    @extend_schema(
        operation_id='stories_update',
        request=StorySerializer,
        responses={
            200: StorySerializer,
            400: StorySerializer,
            404: inline_serializer(
                name='StoryUpdateNotFoundResponse',
                fields={
                    'detail': serializers.CharField(),
                },
            ),
        },
    )
    def patch(self, request, pk):
        story = self.get_object(pk)

        if not story:
            return Response(
                {'detail': 'Story not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        self.check_author_permission(
            request,
            story
        )

        serializer = StorySerializer(
            story,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            story = update_story(
                story,
                serializer.validated_data
            )

            response_serializer = StorySerializer(story)

            return Response(
                response_serializer.data
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    @extend_schema(
        operation_id='stories_delete',
        responses={
            204: None,
            404: inline_serializer(
                name='StoryDeleteNotFoundResponse',
                fields={
                    'detail': serializers.CharField(),
                },
            ),
        },
    )
    def delete(self, request, pk):
        story = self.get_object(pk)

        if not story:
            return Response(
                {'detail': 'Story not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        self.check_author_permission(
            request,
            story
        )

        story.delete()

        return Response(
            {'detail': 'Story deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )


class StoryReaderView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id='stories_read',
        responses={
            200: inline_serializer(
                name='StoryReaderResponse',
                fields={
                    'id': serializers.IntegerField(),
                    'author': serializers.IntegerField(),
                    'author_username': serializers.CharField(),
                    'title': serializers.CharField(),
                    'slug': serializers.CharField(),
                    'content': serializers.CharField(
                        required=False
                    ),
                    'rendered_content': serializers.CharField(
                        required=False
                    ),
                    'preview': serializers.CharField(
                        required=False
                    ),
                    'cover_image': serializers.URLField(
                        required=False,
                        allow_null=True
                    ),
                    'visibility': serializers.CharField(),
                    'status': serializers.CharField(
                        required=False
                    ),
                    'tags': serializers.ListField(
                        child=serializers.IntegerField(),
                        required=False
                    ),
                    'topics': serializers.ListField(
                        child=serializers.IntegerField(),
                        required=False
                    ),
                    'read_time': serializers.IntegerField(),
                    'read_time_display': serializers.CharField(),
                    'premium_required': serializers.BooleanField(
                        required=False
                    ),
                    'upgrade_message': serializers.CharField(
                        required=False
                    ),
                    'published_at': serializers.DateTimeField(
                        required=False,
                        allow_null=True
                    ),
                },
            ),
            404: inline_serializer(
                name='PublishedStoryNotFoundResponse',
                fields={
                    'detail': serializers.CharField(),
                },
            ),
        },
    )
    def get(self, request, pk):
        try:
            story = Story.objects.get(
                pk=pk,
                status='published'
            )
        except Story.DoesNotExist:
            return Response(
                {'detail': 'Published story not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        result = get_story_read_data(
            story,
            request.user
        )

        if result['access'] == 'full':
            serializer = StoryReaderSerializer(story)

            return Response(serializer.data)

        return Response(
            {
                'id': story.id,
                'author': story.author.id,
                'author_username': story.author.username,
                'title': story.title,
                'slug': story.slug,
                'preview': result['preview'],
                'visibility': story.visibility,
                'status': story.status,
                'tags': [
                    tag.id
                    for tag in story.tags.all()
                ],
                'topics': [
                    topic.id
                    for topic in story.topics.all()
                ],
                'read_time': story.read_time,
                'read_time_display': (
                    f'{story.read_time} min read'
                ),
                'premium_required': True,
                'upgrade_message': (
                    'Subscribe to Premium to read the full story.'
                ),
                'published_at': story.published_at,
            }
        )


class PersonalizedFeedView(APIView):
    permission_classes = [IsAuthenticatedMember]

    @extend_schema(
        operation_id='stories_feed',
        responses=FeedStorySerializer(many=True),
    )
    def get(self, request):
        followed_user_ids = Follow.objects.filter(
            follower=request.user
        ).values_list(
            'following_id',
            flat=True
        )

        stories = (
            Story.objects
            .filter(
                author_id__in=followed_user_ids,
                status='published'
            )
            .select_related('author')
            .order_by('-published_at')
        )

        serializer = FeedStorySerializer(
            stories,
            many=True
        )

        return Response(serializer.data)


class PublicStoryListView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id='stories_discover',
        responses=PublicStorySerializer(many=True),
    )
    def get(self, request):
        stories = (
            Story.objects
            .filter(status='published')
            .select_related('author')
            .order_by('-published_at')
        )

        serializer = PublicStorySerializer(
            stories,
            many=True
        )

        return Response(serializer.data)


class TagListCreateView(APIView):
    permission_classes = [IsAuthenticatedMember]

    @extend_schema(
        operation_id='stories_tags_list',
        responses=TagSerializer(many=True),
    )
    def get(self, request):
        tags = Tag.objects.all()

        serializer = TagSerializer(
            tags,
            many=True
        )

        return Response(serializer.data)

    @extend_schema(
        operation_id='stories_tags_create',
        request=TagSerializer,
        responses={
            201: TagSerializer,
            400: TagSerializer,
        },
    )
    def post(self, request):
        serializer = TagSerializer(
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class TopicViewSet(viewsets.ModelViewSet):
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    permission_classes = [IsAuthenticatedMember]


class CommentListCreateView(APIView):
    permission_classes = [IsAuthenticatedMember]

    @extend_schema(
        operation_id='stories_comments_list',
        responses={
            200: CommentSerializer(many=True),
            404: inline_serializer(
                name='CommentStoryNotFoundResponse',
                fields={
                    'detail': serializers.CharField(),
                },
            ),
        },
    )
    def get(self, request, pk):
        try:
            story = Story.objects.get(
                pk=pk,
                status='published'
            )
        except Story.DoesNotExist:
            return Response(
                {'detail': 'Published story not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        comments = (
            Comment.objects
            .filter(story=story)
            .select_related('user')
            .order_by('created_at')
        )

        serializer = CommentSerializer(
            comments,
            many=True
        )

        return Response(serializer.data)

    @extend_schema(
        operation_id='stories_comments_create',
        request=CommentSerializer,
        responses={
            201: CommentSerializer,
            400: CommentSerializer,
            404: inline_serializer(
                name='CommentCreateStoryNotFoundResponse',
                fields={
                    'detail': serializers.CharField(),
                },
            ),
        },
    )
    def post(self, request, pk):
        try:
            story = Story.objects.get(
                pk=pk,
                status='published'
            )
        except Story.DoesNotExist:
            return Response(
                {'detail': 'Published story not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = CommentSerializer(
            data=request.data,
            context={'story': story}
        )

        if serializer.is_valid():
            comment = create_comment(
                request.user,
                story,
                serializer.validated_data
            )

            response_serializer = CommentSerializer(
                comment
            )

            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class CommentDetailView(APIView):
    permission_classes = [IsAuthenticatedMember]

    def get_object(self, request, pk):
        try:
            return Comment.objects.get(
                pk=pk,
                user=request.user
            )
        except Comment.DoesNotExist:
            return None

    @extend_schema(
        operation_id='stories_comments_update',
        request=CommentSerializer,
        responses={
            200: CommentSerializer,
            400: CommentSerializer,
            404: inline_serializer(
                name='CommentNotFoundResponse',
                fields={
                    'detail': serializers.CharField(),
                },
            ),
        },
    )
    def patch(self, request, pk):
        comment = self.get_object(
            request,
            pk
        )

        if not comment:
            return Response(
                {'detail': 'Comment not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = CommentSerializer(
            comment,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                serializer.data
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    @extend_schema(
        operation_id='stories_comments_delete',
        responses={
            204: None,
            404: inline_serializer(
                name='CommentDeleteNotFoundResponse',
                fields={
                    'detail': serializers.CharField(),
                },
            ),
        },
    )
    def delete(self, request, pk):
        comment = self.get_object(
            request,
            pk
        )

        if not comment:
            return Response(
                {'detail': 'Comment not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        comment.delete()

        return Response(
            {'detail': 'Comment deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )


class ClapCreateView(APIView):
    permission_classes = [IsAuthenticatedMember]

    @extend_schema(
        operation_id='stories_clap_create',
        request=None,
        responses={
            201: ClapSerializer,
            404: inline_serializer(
                name='ClapStoryNotFoundResponse',
                fields={
                    'detail': serializers.CharField(),
                },
            ),
        },
    )
    def post(self, request, pk):
        try:
            story = Story.objects.get(
                pk=pk,
                status='published'
            )
        except Story.DoesNotExist:
            return Response(
                {'detail': 'Published story not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        clap = create_clap(
            request.user,
            story
        )

        serializer = ClapSerializer(clap)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )


class FollowCreateView(APIView):
    permission_classes = [IsAuthenticatedMember]

    @extend_schema(
        operation_id='stories_follow_create',
        request=FollowCreateSerializer,
        responses={
            201: FollowSerializer,
            400: FollowCreateSerializer,
            404: inline_serializer(
                name='FollowUserNotFoundResponse',
                fields={
                    'detail': serializers.CharField(),
                },
            ),
        },
    )
    def post(self, request):
        input_serializer = FollowCreateSerializer(
            data=request.data
        )

        if not input_serializer.is_valid():
            return Response(
                input_serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        following_id = (
            input_serializer.validated_data['following']
        )

        result = create_follow(
            request.user,
            following_id
        )

        if not result['success']:
            return Response(
                {'detail': result['error']},
                status=result['status']
            )

        serializer = FollowSerializer(
            result['follow']
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )


class FollowRemoveView(APIView):
    permission_classes = [IsAuthenticatedMember]

    @extend_schema(
        operation_id='stories_follow_remove',
        responses={
            204: None,
            400: inline_serializer(
                name='FollowRemoveErrorResponse',
                fields={
                    'detail': serializers.CharField(),
                },
            ),
            404: inline_serializer(
                name='FollowRemoveNotFoundResponse',
                fields={
                    'detail': serializers.CharField(),
                },
            ),
        },
    )
    def delete(self, request, user_id):
        result = remove_follow(
            request.user,
            user_id
        )

        if not result['success']:
            return Response(
                {'detail': result['error']},
                status=result['status']
            )

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


class ReadingListView(APIView):
    permission_classes = [IsAuthenticatedMember]

    @extend_schema(
        operation_id='stories_reading_list',
        responses=ReadingListSerializer(many=True),
    )
    def get(self, request):
        reading_list = (
            ReadingList.objects
            .filter(user=request.user)
            .select_related(
                'story',
                'story__author'
            )
            .order_by('-created_at')
        )

        serializer = ReadingListSerializer(
            reading_list,
            many=True
        )

        return Response(serializer.data)

    @extend_schema(
        operation_id='stories_reading_list_add',
        request=ReadingListCreateSerializer,
        responses={
            201: ReadingListSerializer,
            400: ReadingListCreateSerializer,
            404: inline_serializer(
                name='ReadingListStoryNotFoundResponse',
                fields={
                    'detail': serializers.CharField(),
                },
            ),
        },
    )
    def post(self, request):
        input_serializer = ReadingListCreateSerializer(
            data=request.data
        )

        if not input_serializer.is_valid():
            return Response(
                input_serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        story_id = (
            input_serializer.validated_data['story']
        )

        result = add_to_reading_list(
            request.user,
            story_id
        )

        if not result['success']:
            return Response(
                {'detail': result['error']},
                status=result['status']
            )

        serializer = ReadingListSerializer(
            result['reading_item']
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )


class ReadingListRemoveView(APIView):
    permission_classes = [IsAuthenticatedMember]

    @extend_schema(
        operation_id='stories_reading_list_remove',
        responses={
            204: None,
            404: inline_serializer(
                name='ReadingListRemoveNotFoundResponse',
                fields={
                    'detail': serializers.CharField(),
                },
            ),
        },
    )
    def delete(self, request, story_id):
        result = remove_from_reading_list(
            request.user,
            story_id
        )

        if not result['success']:
            return Response(
                {'detail': result['error']},
                status=result['status']
            )

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )