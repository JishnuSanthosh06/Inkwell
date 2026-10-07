from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from stories.models import Story


User = get_user_model()


class StoryTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            username="storytester",
            email="storytester@example.com",
            password="TestPassword123!",
        )

        self.client.force_authenticate(user=self.user)

    def test_authenticated_user_can_create_story(self):
        response = self.client.post(
            "/api/stories/",
            {
                "title": "Automated Test Story",
                "content": "This is an automated test story.",
                "status": "draft",
                "visibility": "free",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        story = Story.objects.get(
            title="Automated Test Story"
        )

        self.assertEqual(story.author, self.user)
        self.assertEqual(story.status, "draft")
        self.assertEqual(story.visibility, "free")
        self.assertEqual(story.slug, "automated-test-story")
        self.assertGreaterEqual(story.read_time, 1)

    def test_guest_cannot_create_story(self):
        self.client.force_authenticate(user=None)

        response = self.client.post(
            "/api/stories/",
            {
                "title": "Unauthorized Story",
                "content": "Guest should not be able to create stories.",
                "status": "draft",
                "visibility": "free",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 401)

        self.assertEqual(
            Story.objects.count(),
            0
        )

    def test_only_story_author_can_update_story(self):
        story = Story.objects.create(
            author=self.user,
            title="Ownership Test Story",
            content="Original content",
            status="draft",
            visibility="free",
        )

        another_user = User.objects.create_user(
            username="anotheruser",
            email="another@example.com",
            password="TestPassword123!",
        )

        self.client.force_authenticate(user=another_user)

        response = self.client.patch(
            f"/api/stories/{story.id}/",
            {
                "title": "Unauthorized Update",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)

        story.refresh_from_db()

        self.assertEqual(
            story.title,
            "Ownership Test Story"
        )

    def test_story_lifecycle(self):
        story = Story.objects.create(
            author=self.user,
            title="Lifecycle Test Story",
            content="Testing draft scheduled and published states.",
            status="draft",
            visibility="free",
        )

        self.assertEqual(story.status, "draft")
        self.assertIsNone(story.published_at)
        self.assertIsNone(story.scheduled_at)

        # Draft → Scheduled
        response = self.client.patch(
            f"/api/stories/{story.id}/",
            {
                "status": "scheduled",
                "scheduled_at": "2030-01-01T10:00:00Z",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        story.refresh_from_db()

        self.assertEqual(story.status, "scheduled")
        self.assertIsNotNone(story.scheduled_at)
        self.assertIsNone(story.published_at)

        # Scheduled → Published
        response = self.client.patch(
            f"/api/stories/{story.id}/",
            {
                "status": "published",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        story.refresh_from_db()

        self.assertEqual(story.status, "published")
        self.assertIsNotNone(story.published_at)
        self.assertIsNone(story.scheduled_at)

    def test_story_generates_slug_and_read_time(self):
        story = Story.objects.create(
            author=self.user,
            title="Python Django Backend Development",
            content=(
                "Python Django REST API development is useful "
                "for building modern backend applications."
            ),
            status="draft",
            visibility="free",
        )

        self.assertEqual(
            story.slug,
            "python-django-backend-development"
        )

        self.assertGreaterEqual(
            story.read_time,
            1
        )

        original_read_time = story.read_time

        story.content = (
            "Python Django REST API development is useful for building "
            "modern backend applications. " * 100
        )

        story.save()
        story.refresh_from_db()

        self.assertGreater(
            story.read_time,
            original_read_time
        )

    def test_story_can_have_multiple_tags_and_topics(self):
        from stories.models import Tag, Topic

        tag1 = Tag.objects.create(name="Python")
        tag2 = Tag.objects.create(name="Django")

        topic1 = Topic.objects.create(name="Backend Development")
        topic2 = Topic.objects.create(name="Web Development")

        story = Story.objects.create(
            author=self.user,
            title="Tags and Topics Test",
            content="Testing multiple tags and topics.",
            status="draft",
            visibility="free",
        )

        story.tags.set([tag1, tag2])
        story.topics.set([topic1, topic2])

        self.assertEqual(
            story.tags.count(),
            2
        )

        self.assertEqual(
            story.topics.count(),
            2
        )

        self.assertIn(
            tag1,
            story.tags.all()
        )

        self.assertIn(
            tag2,
            story.tags.all()
        )

        self.assertIn(
            topic1,
            story.topics.all()
        )

        self.assertIn(
            topic2,
            story.topics.all()
        )

    def test_comments_and_nested_replies(self):
        from stories.models import Comment

        story = Story.objects.create(
            author=self.user,
            title="Comment Test Story",
            content="Testing comments.",
            status="published",
            visibility="free",
        )

        # Create root comment
        response = self.client.post(
            f"/api/stories/{story.id}/comments/",
            {
                "content": "This is a root comment.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        root_comment = Comment.objects.get(
            story=story,
            user=self.user,
            content="This is a root comment.",
        )

        # Create nested reply
        response = self.client.post(
            f"/api/stories/{story.id}/comments/",
            {
                "content": "This is a nested reply.",
                "parent": root_comment.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        reply = Comment.objects.get(
            story=story,
            user=self.user,
            content="This is a nested reply.",
        )

        self.assertEqual(
            reply.parent,
            root_comment
        )

        self.assertEqual(
            root_comment.replies.count(),
            1
        )

    def test_guest_cannot_create_comment(self):
        story = Story.objects.create(
            author=self.user,
            title="Guest Comment Restriction",
            content="Testing guest comment access.",
            status="published",
            visibility="free",
        )

        self.client.force_authenticate(user=None)

        response = self.client.post(
            f"/api/stories/{story.id}/comments/",
            {
                "content": "Guest should not be able to comment.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            401
        )

    def test_comment_parent_must_belong_to_same_story(self):
        from stories.models import Comment

        story1 = Story.objects.create(
            author=self.user,
            title="First Comment Story",
            content="First story.",
            status="published",
            visibility="free",
        )

        story2 = Story.objects.create(
            author=self.user,
            title="Second Comment Story",
            content="Second story.",
            status="published",
            visibility="free",
        )

        parent_comment = Comment.objects.create(
            story=story1,
            user=self.user,
            content="Comment on first story.",
        )

        response = self.client.post(
            f"/api/stories/{story2.id}/comments/",
            {
                "content": "Invalid reply to another story.",
                "parent": parent_comment.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400
        )

        self.assertIn(
            "parent",
            response.data
        )

    def test_user_can_clap_multiple_times(self):
        from stories.models import Clap

        story = Story.objects.create(
            author=self.user,
            title="Clap Test Story",
            content="Testing multiple claps.",
            status="published",
            visibility="free",
        )

        response1 = self.client.post(
            f"/api/stories/{story.id}/clap/",
            format="json",
        )

        response2 = self.client.post(
            f"/api/stories/{story.id}/clap/",
            format="json",
        )

        self.assertEqual(response1.status_code, 201)
        self.assertEqual(response2.status_code, 201)

        self.assertEqual(
            Clap.objects.filter(
                story=story,
                user=self.user,
            ).count(),
            2
        )
    def test_guest_cannot_clap(self):
        story = Story.objects.create(
            author=self.user,
            title="Guest Clap Restriction",
            content="Testing guest clap access.",
            status="published",
            visibility="free",
        )

        self.client.force_authenticate(user=None)

        response = self.client.post(
            f"/api/stories/{story.id}/clap/",
            format="json",
        )

        self.assertEqual(
            response.status_code,
            401
        )    
    

    def test_user_can_follow_another_user(self):
        from stories.models import Follow

        another_user = User.objects.create_user(
            username="followuser",
            email="followuser@example.com",
            password="TestPassword123!",
        )

        response = self.client.post(
            "/api/stories/follow/",
            {
                "following": another_user.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        self.assertTrue(
            Follow.objects.filter(
                follower=self.user,
                following=another_user,
            ).exists()
        )

    def test_duplicate_follow_is_rejected(self):
        from stories.models import Follow

        another_user = User.objects.create_user(
            username="duplicatefollow",
            email="duplicatefollow@example.com",
            password="TestPassword123!",
        )

        first_response = self.client.post(
            "/api/stories/follow/",
            {
                "following": another_user.id,
            },
            format="json",
        )

        second_response = self.client.post(
            "/api/stories/follow/",
            {
                "following": another_user.id,
            },
            format="json",
        )

        self.assertEqual(first_response.status_code, 201)
        self.assertEqual(second_response.status_code, 400)

        self.assertEqual(
            Follow.objects.filter(
                follower=self.user,
                following=another_user,
            ).count(),
            1
        )

    def test_user_cannot_follow_themselves(self):
        from stories.models import Follow

        response = self.client.post(
            "/api/stories/follow/",
            {
                "following": self.user.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400
        )

        self.assertFalse(
            Follow.objects.filter(
                follower=self.user,
                following=self.user,
            ).exists()
        )

    def test_user_can_add_published_story_to_reading_list(self):
        from stories.models import ReadingList

        story = Story.objects.create(
            author=self.user,
            title="Reading List Test Story",
            content="Testing private reading list.",
            status="published",
            visibility="free",
        )

        response = self.client.post(
            "/api/stories/reading-list/",
            {
                "story": story.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201
        )

        self.assertTrue(
            ReadingList.objects.filter(
                user=self.user,
                story=story,
            ).exists()
        )

    def test_reading_list_is_private_to_each_user(self):
        from stories.models import ReadingList

        story = Story.objects.create(
            author=self.user,
            title="Private Reading List Story",
            content="Testing reading list privacy.",
            status="published",
            visibility="free",
        )

        another_user = User.objects.create_user(
            username="readinguser",
            email="readinguser@example.com",
            password="TestPassword123!",
        )

        ReadingList.objects.create(
            user=self.user,
            story=story,
        )

        self.client.force_authenticate(user=another_user)

        response = self.client.get(
            "/api/stories/reading-list/"
        )

        self.assertEqual(
            response.status_code,
            200
        )

        self.assertEqual(
            response.data,
            []
        )

    def test_duplicate_reading_list_entry_is_rejected(self):
        from stories.models import ReadingList

        story = Story.objects.create(
            author=self.user,
            title="Duplicate Reading Story",
            content="Testing duplicate reading list entries.",
            status="published",
            visibility="free",
        )

        first_response = self.client.post(
            "/api/stories/reading-list/",
            {
                "story": story.id,
            },
            format="json",
        )

        second_response = self.client.post(
            "/api/stories/reading-list/",
            {
                "story": story.id,
            },
            format="json",
        )

        self.assertEqual(first_response.status_code, 201)
        self.assertEqual(second_response.status_code, 400)

        self.assertEqual(
            ReadingList.objects.filter(
                user=self.user,
                story=story,
            ).count(),
            1
        )

    def test_user_can_remove_story_from_reading_list(self):
        from stories.models import ReadingList

        story = Story.objects.create(
            author=self.user,
            title="Remove Reading Story",
            content="Testing reading list removal.",
            status="published",
            visibility="free",
        )

        ReadingList.objects.create(
            user=self.user,
            story=story,
        )

        response = self.client.delete(
            f"/api/stories/reading-list/{story.id}/"
        )

        self.assertEqual(
            response.status_code,
            204
        )

        self.assertFalse(
            ReadingList.objects.filter(
                user=self.user,
                story=story,
            ).exists()
        )

    def test_non_premium_user_gets_member_only_story_preview(self):
        story = Story.objects.create(
            author=self.user,
            title="Premium Story Test",
            content="This is secret premium content that should not be exposed.",
            status="published",
            visibility="member_only",
        )

        response = self.client.get(
            f"/api/stories/read/{story.id}/"
        )

        self.assertEqual(response.status_code, 200)

        self.assertTrue(
            response.data["premium_required"]
        )

        self.assertIn(
            "upgrade_message",
            response.data
        )

        self.assertNotIn(
            "rendered_content",
            response.data
        )

    def test_premium_user_gets_full_member_only_story(self):
        from datetime import timedelta

        from django.utils import timezone

        from profiles.models import (
            UserProfile,
            Subscription,
            SubscriptionPlan,
        )

        UserProfile.objects.get_or_create(
            user=self.user
        )

        plan = SubscriptionPlan.objects.create(
            name="Test Monthly Plan",
            plan_type="monthly",
            price=199,
            duration_days=30,
            is_active=True,
        )

        Subscription.objects.create(
            user=self.user,
            plan=plan,
            status="active",
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
        )

        story = Story.objects.create(
            author=self.user,
            title="Premium Full Content Test",
            content="This is private premium content.",
            status="published",
            visibility="member_only",
        )

        response = self.client.get(
            f"/api/stories/read/{story.id}/"
        )

        self.assertEqual(
            response.status_code,
            200
        )

        self.assertEqual(
            response.data["content"],
            "This is private premium content."
        )

        self.assertIn(
            "rendered_content",
            response.data
        )

        self.assertNotIn(
            "premium_required",
            response.data
        )

    def test_expired_premium_user_gets_member_only_preview(self):
        from datetime import timedelta

        from django.utils import timezone

        from profiles.models import (
            UserProfile,
            Subscription,
            SubscriptionPlan,
        )

        UserProfile.objects.get_or_create(
            user=self.user
        )

        plan = SubscriptionPlan.objects.create(
            name="Expired Test Plan",
            plan_type="monthly",
            price=199,
            duration_days=30,
            is_active=True,
        )

        Subscription.objects.create(
            user=self.user,
            plan=plan,
            status="active",
            start_date=timezone.now() - timedelta(days=31),
            end_date=timezone.now() - timedelta(days=1),
        )

        story = Story.objects.create(
            author=self.user,
            title="Expired Premium Test",
            content="This content should be protected after expiration.",
            status="published",
            visibility="member_only",
        )

        response = self.client.get(
            f"/api/stories/read/{story.id}/"
        )

        self.assertEqual(
            response.status_code,
            200
        )

        self.assertTrue(
            response.data["premium_required"]
        )

        self.assertNotIn(
            "rendered_content",
            response.data
        )

    def test_public_story_discovery_returns_only_published_stories(self):
        published_story = Story.objects.create(
            author=self.user,
            title="Published Discovery Story",
            content="This story should appear in public discovery.",
            status="published",
            visibility="free",
        )

        Story.objects.create(
            author=self.user,
            title="Draft Hidden Story",
            content="This draft should not appear publicly.",
            status="draft",
            visibility="free",
        )

        self.client.force_authenticate(user=None)

        response = self.client.get(
            "/api/stories/discover/"
        )

        self.assertEqual(
            response.status_code,
            200
        )

        story_ids = [
            story["id"]
            for story in response.data
        ]

        self.assertIn(
            published_story.id,
            story_ids
        )

        self.assertNotIn(
            Story.objects.get(
                title="Draft Hidden Story"
            ).id,
            story_ids
        )

    def test_public_discovery_does_not_expose_member_only_content(self):
        story = Story.objects.create(
            author=self.user,
            title="Public Member Only Story",
            content="This is protected member-only content.",
            status="published",
            visibility="member_only",
        )

        self.client.force_authenticate(user=None)

        response = self.client.get(
            "/api/stories/discover/"
        )

        self.assertEqual(
            response.status_code,
            200
        )

        discovered_story = next(
            item
            for item in response.data
            if item["id"] == story.id
        )

        self.assertEqual(
            discovered_story["visibility"],
            "member_only"
        )

        self.assertNotIn(
            "content",
            discovered_story
        )

        self.assertNotIn(
            "rendered_content",
            discovered_story
        )

    def test_personalized_feed_returns_followed_author_stories(self):
        from stories.models import Follow

        followed_user = User.objects.create_user(
            username="feedauthor",
            email="feedauthor@example.com",
            password="TestPassword123!",
        )

        Follow.objects.create(
            follower=self.user,
            following=followed_user,
        )

        followed_story = Story.objects.create(
            author=followed_user,
            title="Followed Author Story",
            content="This story should appear in the personalized feed.",
            status="published",
            visibility="free",
        )

        response = self.client.get(
            "/api/stories/feed/"
        )

        self.assertEqual(
            response.status_code,
            200
        )

        story_ids = [
            story["id"]
            for story in response.data
        ]

        self.assertIn(
            followed_story.id,
            story_ids
        )

    def test_personalized_feed_excludes_unfollowed_author_stories(self):
        followed_user = User.objects.create_user(
            username="followedauthor",
            email="followedauthor@example.com",
            password="TestPassword123!",
        )

        unfollowed_user = User.objects.create_user(
            username="unfollowedauthor",
            email="unfollowedauthor@example.com",
            password="TestPassword123!",
        )

        followed_story = Story.objects.create(
            author=followed_user,
            title="Followed Story",
            content="This should appear in the feed.",
            status="published",
            visibility="free",
        )

        unfollowed_story = Story.objects.create(
            author=unfollowed_user,
            title="Unfollowed Story",
            content="This should not appear in the feed.",
            status="published",
            visibility="free",
        )

        from stories.models import Follow

        Follow.objects.create(
            follower=self.user,
            following=followed_user,
        )

        response = self.client.get(
            "/api/stories/feed/"
        )

        self.assertEqual(
            response.status_code,
            200
        )

        story_ids = [
            story["id"]
            for story in response.data
        ]

        self.assertIn(
            followed_story.id,
            story_ids
        )

        self.assertNotIn(
            unfollowed_story.id,
            story_ids
        )

    def test_guest_cannot_access_personalized_feed(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(
            "/api/stories/feed/"
        )

        self.assertEqual(
            response.status_code,
            401
        )

    def test_public_writer_profile_is_accessible(self):
        from profiles.models import UserProfile

        # UserProfile is automatically created by the User post_save signal.
        profile = self.user.profile
        profile.bio = "Python Django Developer"
        profile.save()

        Story.objects.create(
            author=self.user,
            title="Public Writer Story",
            content="A published story by the writer.",
            status="published",
            visibility="free",
        )

        self.client.force_authenticate(user=None)

        response = self.client.get(
            f"/api/profile/writers/{self.user.username}/"
        )

        self.assertEqual(
            response.status_code,
            200
        )

        self.assertEqual(
            response.data["username"],
            self.user.username
        )

        self.assertEqual(
            response.data["bio"],
            "Python Django Developer"
        )

        self.assertEqual(
            len(response.data["stories"]),
            1
        )

        self.assertEqual(
            response.data["stories"][0]["title"],
            "Public Writer Story"
        )