from django.db import IntegrityError, transaction
from django.contrib.auth import get_user_model
from django.utils.html import strip_tags

from .content_utils import render_safe_markdown

from .models import (
    Story, 
    Follow,
    ReadingList, 
    Comment,
    Clap,
    )


def add_to_reading_list(user, story_id):
    try:
        story = Story.objects.get(
            id=story_id,
            status='published'
        )
    except Story.DoesNotExist:
        return {
            'success': False,
            'error': 'Published story not found.',
            'status': 404,
        }

    try:
        reading_item, created = ReadingList.objects.get_or_create(
            user=user,
            story=story
        )
    except IntegrityError:
        return {
            'success': False,
            'error': 'Story is already in your reading list.',
            'status': 400,
        }

    if not created:
        return {
            'success': False,
            'error': 'Story is already in your reading list.',
            'status': 400,
        }

    return {
        'success': True,
        'reading_item': reading_item,
        'status': 201,
    }


def remove_from_reading_list(user, story_id):
    deleted_count, _ = ReadingList.objects.filter(
        user=user,
        story_id=story_id
    ).delete()

    if deleted_count == 0:
        return {
            'success': False,
            'error': 'Story is not in your reading list.',
            'status': 404,
        }

    return {
        'success': True,
        'status': 204,
    }



def create_follow(follower, following_id):
    User = get_user_model()

    if str(following_id) == str(follower.id):
        return {
            'success': False,
            'error': 'You cannot follow yourself.',
            'status': 400,
        }

    try:
        following_user = User.objects.get(
            id=following_id
        )
    except User.DoesNotExist:
        return {
            'success': False,
            'error': 'User not found.',
            'status': 404,
        }

    follow, created = Follow.objects.get_or_create(
        follower=follower,
        following=following_user
    )

    if not created:
        return {
            'success': False,
            'error': 'You are already following this user.',
            'status': 400,
        }

    return {
        'success': True,
        'follow': follow,
        'status': 201,
    }


def remove_follow(follower, following_id):
    deleted_count, _ = Follow.objects.filter(
        follower=follower,
        following_id=following_id
    ).delete()

    if deleted_count == 0:
        return {
            'success': False,
            'error': 'You are not following this user.',
            'status': 404,
        }

    return {
        'success': True,
        'status': 204,
    }

def create_comment(user, story, validated_data):
    return Comment.objects.create(
        story=story,
        user=user,
        **validated_data
    )

def create_clap(user, story):
    return Clap.objects.create(
        story=story,
        user=user
    )

@transaction.atomic
def create_story(author, validated_data):
    tags = validated_data.pop('tags', [])
    topics = validated_data.pop('topics', [])

    story = Story.objects.create(
        author=author,
        **validated_data
    )

    story.tags.set(tags)
    story.topics.set(topics)

    return story

@transaction.atomic
def update_story(story, validated_data):
    tags = validated_data.pop('tags', None)
    topics = validated_data.pop('topics', None)

    for field, value in validated_data.items():
        setattr(story, field, value)

    story.save()

    if tags is not None:
        story.tags.set(tags)

    if topics is not None:
        story.topics.set(topics)

    return story


def get_story_read_data(story, user):
    """
    Returns the appropriate story response data based on
    publication visibility and the user's premium status.
    """

    if story.visibility == 'free':
        return {
            'access': 'full',
            'story': story,
        }

    profile = getattr(user, 'profile', None)

    has_premium = (
        user.is_authenticated
        and profile is not None
        and profile.has_active_premium
    )

    if has_premium:
        return {
            'access': 'full',
            'story': story,
        }

    rendered_preview = render_safe_markdown(story.content)
    preview_text = strip_tags(rendered_preview)

    preview_words = preview_text.split()
    preview = ' '.join(preview_words[:50])

    if len(preview_words) > 50:
        preview += '...'

    return {
        'access': 'preview',
        'story': story,
        'preview': preview,
    }