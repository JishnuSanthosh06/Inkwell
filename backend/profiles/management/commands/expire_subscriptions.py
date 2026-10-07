from django.core.management.base import BaseCommand
from django.utils import timezone

from profiles.models import Subscription
from profiles.services import expire_subscription


class Command(BaseCommand):
    help = "Expire subscriptions whose end date has passed."

    def handle(self, *args, **options):
        now = timezone.now()

        expired_subscriptions = Subscription.objects.filter(
            status="active",
            end_date__lte=now,
        )

        count = expired_subscriptions.count()

        for subscription in expired_subscriptions:
            expire_subscription(subscription)

        self.stdout.write(
            self.style.SUCCESS(
                f"{count} subscription(s) expired."
            )
        )