from django.urls import path
from .views import (
    StoryListCreateView,
    StoryDetailView,
    StoryReaderView,
    PersonalizedFeedView,
    PublicStoryListView,
    CommentListCreateView,
    CommentDetailView,
    ClapCreateView,
    TagListCreateView,
    TopicViewSet,
    FollowCreateView,
    FollowRemoveView,
    ReadingListView, 
    ReadingListRemoveView,
)


urlpatterns = [
    path('', 
         StoryListCreateView.as_view(), 
         name='story-list-create'),

    path('feed/',
        PersonalizedFeedView.as_view(),
        name='personalized-feed'),

    path('discover/',
        PublicStoryListView.as_view(),
        name='public-story-discovery'),

    path('tags/', 
         TagListCreateView.as_view(), 
         name='tag-list-create'),

    path(
        'topics/',
        TopicViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='topic-list-create'
    ),

    path(
        'read/<int:pk>/',
        StoryReaderView.as_view(),
        name='story-reader'
    ),

    path(
        '<int:pk>/comments/',
        CommentListCreateView.as_view(),
        name='comment-list-create'
    ),

    path(
        'comments/<int:pk>/',
        CommentDetailView.as_view(),
        name='comment-detail'
    ),

    path(
        '<int:pk>/clap/',
        ClapCreateView.as_view(),
        name='clap-create'
    ),

    # Follow / Unfollow
    path(
        'follow/',
        FollowCreateView.as_view(),
        name='follow'
    ),

    path(
        'follow/<int:user_id>/',
        FollowRemoveView.as_view(),
        name='unfollow'
    ),

    path(
        '<int:pk>/',
        StoryDetailView.as_view(),
        name='story-detail'
    ),

    path(
        'reading-list/',
        ReadingListView.as_view(),
        name='reading-list'
    ),

    path(
        'reading-list/<int:story_id>/',
        ReadingListRemoveView.as_view(),
        name='reading-list-remove'
    ),

]