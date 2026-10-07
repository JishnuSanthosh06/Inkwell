from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase


User = get_user_model()


class ProfileTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="profiletest",
            email="profiletest@example.com",
            password="TestPass123!",
        )

    def test_authenticated_user_can_get_own_profile(self):
        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.get(
            "/api/profile/"
        )

        self.assertEqual(
            response.status_code,
            200
        )

        self.assertEqual(
            response.data["username"],
            "profiletest"
        )

        self.assertEqual(
            response.data["email"],
            "profiletest@example.com"
        )

    def test_user_can_update_own_profile_but_not_protected_fields(self):
        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.patch(
            "/api/profile/",
            {
                "bio": "Updated Python Django Developer",
                "is_premium": True,
                "premium_expires_at": "2030-01-01T00:00:00Z",
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            200
        )

        self.assertEqual(
            response.data["bio"],
            "Updated Python Django Developer"
        )

        self.assertFalse(
            response.data["is_premium"]
        )

        self.assertIsNone(
            response.data["premium_expires_at"]
        )

    def test_user_cannot_change_username_or_email(self):
        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.patch(
            "/api/profile/",
            {
                "username": "hackername",
                "email": "hacker@example.com",
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            200
        )

        self.user.refresh_from_db()

        self.assertEqual(
            self.user.username,
            "profiletest"
        )

        self.assertEqual(
            self.user.email,
            "profiletest@example.com"
        )

    def test_guest_can_view_active_subscription_plans(self):
        from profiles.models import SubscriptionPlan

        SubscriptionPlan.objects.create(
            name="Monthly Membership",
            plan_type="monthly",
            price=199,
            duration_days=30,
            is_active=True,
        )

        self.client.force_authenticate(
            user=None
        )

        response = self.client.get(
            "/api/profile/plans/"
        )

        self.assertEqual(
            response.status_code,
            200
        )

        self.assertEqual(
            len(response.data),
            1
        )

        self.assertEqual(
            response.data[0]["name"],
            "Monthly Membership"
        )

    def test_guest_cannot_see_inactive_subscription_plans(self):
        from profiles.models import SubscriptionPlan

        SubscriptionPlan.objects.create(
            name="Active Monthly",
            plan_type="monthly",
            price=199,
            duration_days=30,
            is_active=True,
        )

        # plan_type is unique, so use annual for the inactive plan.
        SubscriptionPlan.objects.create(
            name="Inactive Annual",
            plan_type="annual",
            price=1999,
            duration_days=365,
            is_active=False,
        )

        self.client.force_authenticate(
            user=None
        )

        response = self.client.get(
            "/api/profile/plans/"
        )

        self.assertEqual(
            response.status_code,
            200
        )

        self.assertEqual(
            len(response.data),
            1
        )

        self.assertEqual(
            response.data[0]["name"],
            "Active Monthly"
        )

    def test_guest_cannot_create_subscription_order(self):
        self.client.force_authenticate(
            user=None
        )

        response = self.client.post(
            "/api/profile/subscriptions/create-order/",
            {
                "plan_id": 1,
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            401
        )

    def test_authenticated_user_can_create_subscription_order(self):
        from decimal import Decimal
        from profiles.models import Subscription, SubscriptionPlan
        from unittest.mock import patch

        plan = SubscriptionPlan.objects.create(
            name="Monthly Membership",
            plan_type="monthly",
            price=199,
            duration_days=30,
            is_active=True,
        )

        self.client.force_authenticate(
            user=self.user
        )

        mock_order = {
            "id": "order_test_123"
        }

        with patch(
            "profiles.views.client.order.create",
            return_value=mock_order
        ):
            response = self.client.post(
                "/api/profile/subscriptions/create-order/",
                {
                    "plan_id": plan.id,
                },
                format="json"
            )

        self.assertEqual(
            response.status_code,
            201
        )

        subscription = Subscription.objects.get(
            razorpay_order_id="order_test_123"
        )

        self.assertEqual(
            response.data["subscription_id"],
            subscription.id
        )

        self.assertEqual(
            response.data["plan_name"],
            "Monthly Membership"
        )

        self.assertEqual(
            response.data["amount"],
            Decimal("199.00")
        )

        self.assertEqual(
            response.data["razorpay_order_id"],
            "order_test_123"
        )

    def test_authenticated_user_cannot_create_order_for_invalid_plan(self):
        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.post(
            "/api/profile/subscriptions/create-order/",
            {
                "plan_id": 9999,
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            404
        )

        self.assertEqual(
            response.data["detail"],
            "Subscription plan not found."
        )

    def test_authenticated_user_cannot_create_order_for_inactive_plan(self):
        from profiles.models import SubscriptionPlan

        plan = SubscriptionPlan.objects.create(
            name="Inactive Monthly",
            plan_type="monthly",
            price=199,
            duration_days=30,
            is_active=False,
        )

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.post(
            "/api/profile/subscriptions/create-order/",
            {
                "plan_id": plan.id,
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            404
        )

        self.assertEqual(
            response.data["detail"],
            "Subscription plan not found."
        )

    def test_user_can_only_see_own_subscriptions(self):
        from profiles.models import Subscription, SubscriptionPlan

        other_user = User.objects.create_user(
            username="otheruser",
            email="other@example.com",
            password="TestPass123!",
        )

        plan = SubscriptionPlan.objects.create(
            name="Monthly Membership",
            plan_type="monthly",
            price=199,
            duration_days=30,
            is_active=True,
        )

        Subscription.objects.create(
            user=self.user,
            plan=plan,
            status="pending",
        )

        Subscription.objects.create(
            user=other_user,
            plan=plan,
            status="pending",
        )

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.get(
            "/api/profile/subscriptions/"
        )

        self.assertEqual(
            response.status_code,
            200
        )

        self.assertEqual(
            len(response.data),
            1
        )

        self.assertEqual(
            response.data[0]["plan_name"],
            "Monthly Membership"
        )

    def test_user_cannot_verify_another_users_subscription(self):
        from profiles.models import Subscription, SubscriptionPlan

        other_user = User.objects.create_user(
            username="paymentuser",
            email="paymentuser@example.com",
            password="TestPass123!",
        )

        plan = SubscriptionPlan.objects.create(
            name="Monthly Membership",
            plan_type="monthly",
            price=199,
            duration_days=30,
            is_active=True,
        )

        subscription = Subscription.objects.create(
            user=other_user,
            plan=plan,
            status="pending",
            razorpay_order_id="order_other_user",
        )

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.post(
            "/api/profile/subscriptions/verify-payment/",
            {
                "subscription_id": subscription.id,
                "razorpay_order_id": "order_other_user",
                "razorpay_payment_id": "pay_test_123",
                "razorpay_signature": "fake_signature",
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            404
        )

        self.assertEqual(
            response.data["detail"],
            "Subscription not found."
        )

    def test_invalid_razorpay_signature_is_rejected(self):
        from profiles.models import Subscription, SubscriptionPlan
        from unittest.mock import patch

        plan = SubscriptionPlan.objects.create(
            name="Monthly Membership",
            plan_type="monthly",
            price=199,
            duration_days=30,
            is_active=True,
        )

        subscription = Subscription.objects.create(
            user=self.user,
            plan=plan,
            status="pending",
            razorpay_order_id="order_test_123",
        )

        self.client.force_authenticate(
            user=self.user
        )

        with patch(
            "profiles.views.client.utility.verify_payment_signature",
            side_effect=Exception("Invalid signature"),
        ):
            response = self.client.post(
                "/api/profile/subscriptions/verify-payment/",
                {
                    "subscription_id": subscription.id,
                    "razorpay_order_id": "order_test_123",
                    "razorpay_payment_id": "pay_test_123",
                    "razorpay_signature": "invalid_signature",
                },
                format="json"
            )

        self.assertEqual(
            response.status_code,
            400
        )

        self.assertEqual(
            response.data["detail"],
            "Payment verification failed."
        )

        subscription.refresh_from_db()

        self.assertEqual(
            subscription.status,
            "pending"
        )

        self.assertIsNone(
            subscription.payment_id
        )

    def test_valid_razorpay_payment_activates_subscription(self):
        from profiles.models import (
            Subscription,
            SubscriptionPlan,
        )
        from unittest.mock import patch

        plan = SubscriptionPlan.objects.create(
            name="Monthly Membership",
            plan_type="monthly",
            price=199,
            duration_days=30,
            is_active=True,
        )

        # UserProfile is automatically created by the User post_save signal.

        subscription = Subscription.objects.create(
            user=self.user,
            plan=plan,
            status="pending",
            razorpay_order_id="order_test_123",
        )

        self.client.force_authenticate(
            user=self.user
        )

        with patch(
            "profiles.views.client.utility.verify_payment_signature"
        ):
            response = self.client.post(
                "/api/profile/subscriptions/verify-payment/",
                {
                    "subscription_id": subscription.id,
                    "razorpay_order_id": "order_test_123",
                    "razorpay_payment_id": "pay_test_123",
                    "razorpay_signature": "valid_signature",
                },
                format="json"
            )

        self.assertEqual(
            response.status_code,
            200
        )

        subscription.refresh_from_db()

        self.assertEqual(
            subscription.status,
            "active"
        )

        self.assertEqual(
            subscription.payment_id,
            "pay_test_123"
        )

        self.assertIsNotNone(
            subscription.start_date
        )

        self.assertIsNotNone(
            subscription.end_date
        )

        self.user.profile.refresh_from_db()

        self.assertTrue(
            self.user.profile.is_premium
        )

        self.assertTrue(
            self.user.profile.has_active_premium
        )

    def test_active_subscription_cannot_be_verified_again(self):
        from profiles.models import (
            Subscription,
            SubscriptionPlan,
        )

        plan = SubscriptionPlan.objects.create(
            name="Monthly Membership",
            plan_type="monthly",
            price=199,
            duration_days=30,
            is_active=True,
        )

        # UserProfile is automatically created by the User post_save signal.

        subscription = Subscription.objects.create(
            user=self.user,
            plan=plan,
            status="active",
            razorpay_order_id="order_test_123",
            payment_id="pay_existing_123",
        )

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.post(
            "/api/profile/subscriptions/verify-payment/",
            {
                "subscription_id": subscription.id,
                "razorpay_order_id": "order_test_123",
                "razorpay_payment_id": "pay_new_123",
                "razorpay_signature": "some_signature",
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            400
        )

        self.assertEqual(
            response.data["detail"],
            "Subscription is already active."
        )

    def test_expire_subscription_removes_premium_access(self):
        from datetime import timedelta

        from django.utils import timezone

        from profiles.models import (
            Subscription,
            SubscriptionPlan,
        )
        from profiles.services import expire_subscription

        plan = SubscriptionPlan.objects.create(
            name="Monthly Membership",
            plan_type="monthly",
            price=199,
            duration_days=30,
            is_active=True,
        )

        # UserProfile is automatically created by the signal.
        profile = self.user.profile
        profile.is_premium = True
        profile.premium_expires_at = (
            timezone.now() - timedelta(days=1)
        )
        profile.save()

        subscription = Subscription.objects.create(
            user=self.user,
            plan=plan,
            status="active",
            start_date=timezone.now() - timedelta(days=31),
            end_date=timezone.now() - timedelta(days=1),
        )

        expire_subscription(subscription)

        subscription.refresh_from_db()
        self.user.profile.refresh_from_db()

        self.assertEqual(
            subscription.status,
            "expired"
        )

        self.assertFalse(
            self.user.profile.is_premium
        )

        self.assertIsNone(
            self.user.profile.premium_expires_at
        )

        self.assertFalse(
            self.user.profile.has_active_premium
        )

    def test_expire_one_subscription_keeps_premium_if_another_is_active(self):
        from datetime import timedelta

        from django.utils import timezone

        from profiles.models import (
            Subscription,
            SubscriptionPlan,
        )
        from profiles.services import expire_subscription

        monthly_plan = SubscriptionPlan.objects.create(
            name="Monthly Membership",
            plan_type="monthly",
            price=199,
            duration_days=30,
            is_active=True,
        )

        annual_plan = SubscriptionPlan.objects.create(
            name="Annual Membership",
            plan_type="annual",
            price=1999,
            duration_days=365,
            is_active=True,
        )

        now = timezone.now()

        expired_subscription = Subscription.objects.create(
            user=self.user,
            plan=monthly_plan,
            status="active",
            start_date=now - timedelta(days=31),
            end_date=now - timedelta(days=1),
        )

        active_subscription = Subscription.objects.create(
            user=self.user,
            plan=annual_plan,
            status="active",
            start_date=now - timedelta(days=1),
            end_date=now + timedelta(days=364),
        )

        # Synchronize before expiration.
        from profiles.services import sync_premium_profile

        sync_premium_profile(self.user)

        self.user.profile.refresh_from_db()

        self.assertTrue(
            self.user.profile.is_premium
        )

        self.assertEqual(
            self.user.profile.premium_expires_at,
            active_subscription.end_date
        )

        # Expire only the older subscription.
        expire_subscription(expired_subscription)

        self.user.profile.refresh_from_db()

        self.assertEqual(
            expired_subscription.status,
            "expired"
        )

        self.assertEqual(
            active_subscription.status,
            "active"
        )

        self.assertTrue(
            self.user.profile.is_premium
        )

        self.assertEqual(
            self.user.profile.premium_expires_at,
            active_subscription.end_date
        )

        self.assertTrue(
            self.user.profile.has_active_premium
        )

    def test_user_can_get_active_subscription(self):
        from datetime import timedelta

        from django.utils import timezone

        from profiles.models import (
            Subscription,
            SubscriptionPlan,
        )

        plan = SubscriptionPlan.objects.create(
            name="Monthly Membership",
            plan_type="monthly",
            price=199,
            duration_days=30,
            is_active=True,
        )

        # UserProfile is automatically created by the User post_save signal.

        subscription = Subscription.objects.create(
            user=self.user,
            plan=plan,
            status="active",
            start_date=timezone.now() - timedelta(days=1),
            end_date=timezone.now() + timedelta(days=29),
        )

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.get(
            "/api/profile/subscriptions/active/"
        )

        self.assertEqual(
            response.status_code,
            200
        )

        self.assertEqual(
            response.data["plan_name"],
            "Monthly Membership"
        )

        self.assertEqual(
            response.data["status"],
            "active"
        )

        self.assertEqual(
            response.data["id"],
            subscription.id
        )

    def test_guest_cannot_get_active_subscription(self):
        self.client.force_authenticate(
            user=None
        )

        response = self.client.get(
            "/api/profile/subscriptions/active/"
        )

        self.assertEqual(
            response.status_code,
            401
        )

    def test_user_get_active_subscription_when_none_exists(self):
        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.get(
            "/api/profile/subscriptions/active/"
        )

        self.assertEqual(
            response.status_code,
            404
        )

        self.assertEqual(
            response.data["detail"],
            "No active subscription found."
        )

    def test_expired_subscription_is_not_returned_as_active(self):
        from datetime import timedelta

        from django.utils import timezone

        from profiles.models import (
            Subscription,
            SubscriptionPlan,
        )

        plan = SubscriptionPlan.objects.create(
            name="Monthly Membership",
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

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.get(
            "/api/profile/subscriptions/active/"
        )

        self.assertEqual(
            response.status_code,
            404
        )

        self.assertEqual(
            response.data["detail"],
            "No active subscription found."
        )

    def test_invalid_webhook_signature_is_rejected(self):
        self.client.force_authenticate(
            user=None
        )

        response = self.client.post(
            "/api/profile/subscriptions/webhook/",
            {
                "event": "payment.captured",
                "payload": {},
            },
            format="json",
            HTTP_X_RAZORPAY_SIGNATURE="invalid-test-signature",
        )

        self.assertEqual(
            response.status_code,
            400
        )

        self.assertEqual(
            response.data["detail"],
            "Invalid webhook signature."
        )

    def test_valid_webhook_activates_subscription(self):
        from profiles.models import (
            Subscription,
            SubscriptionPlan,
        )
        from unittest.mock import patch
        import json

        plan = SubscriptionPlan.objects.create(
            name="Monthly Membership",
            plan_type="monthly",
            price=199,
            duration_days=30,
            is_active=True,
        )

        # UserProfile is automatically created by the User post_save signal.

        subscription = Subscription.objects.create(
            user=self.user,
            plan=plan,
            status="pending",
            razorpay_order_id="order_webhook_test",
        )

        payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_webhook_test",
                        "order_id": "order_webhook_test",
                        "status": "captured",
                    }
                }
            }
        }

        with patch(
            "profiles.views.client.utility.verify_webhook_signature"
        ):
            response = self.client.post(
                "/api/profile/subscriptions/webhook/",
                data=json.dumps(payload),
                content_type="application/json",
                HTTP_X_RAZORPAY_SIGNATURE="valid-webhook-signature",
            )

        self.assertEqual(
            response.status_code,
            200
        )

        subscription.refresh_from_db()

        self.assertEqual(
            subscription.status,
            "active"
        )

        self.assertEqual(
            subscription.payment_id,
            "pay_webhook_test"
        )

        self.assertIsNotNone(
            subscription.start_date
        )

        self.assertIsNotNone(
            subscription.end_date
        )

        self.user.profile.refresh_from_db()

        self.assertTrue(
            self.user.profile.is_premium
        )

        self.assertTrue(
            self.user.profile.has_active_premium
        )

    def test_duplicate_webhook_is_idempotent(self):
        from profiles.models import (
            Subscription,
            SubscriptionPlan,
        )
        from unittest.mock import patch
        import json

        plan = SubscriptionPlan.objects.create(
            name="Monthly Membership",
            plan_type="monthly",
            price=199,
            duration_days=30,
            is_active=True,
        )

        # UserProfile is automatically created by the User post_save signal.

        Subscription.objects.create(
            user=self.user,
            plan=plan,
            status="pending",
            razorpay_order_id="order_duplicate_test",
        )

        payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_duplicate_test",
                        "order_id": "order_duplicate_test",
                        "status": "captured",
                    }
                }
            }
        }

        with patch(
            "profiles.views.client.utility.verify_webhook_signature"
        ):
            first_response = self.client.post(
                "/api/profile/subscriptions/webhook/",
                data=json.dumps(payload),
                content_type="application/json",
                HTTP_X_RAZORPAY_SIGNATURE="valid-webhook-signature",
            )

            second_response = self.client.post(
                "/api/profile/subscriptions/webhook/",
                data=json.dumps(payload),
                content_type="application/json",
                HTTP_X_RAZORPAY_SIGNATURE="valid-webhook-signature",
            )

        self.assertEqual(
            first_response.status_code,
            200
        )

        self.assertEqual(
            second_response.status_code,
            200
        )

        self.assertEqual(
            second_response.data["detail"],
            "Webhook already processed."
        )

        subscription = Subscription.objects.get(
            razorpay_order_id="order_duplicate_test"
        )

        self.assertEqual(
            subscription.status,
            "active"
        )

        self.assertEqual(
            subscription.payment_id,
            "pay_duplicate_test"
        )