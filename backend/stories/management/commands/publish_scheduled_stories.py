from django.core.management.base import BaseCommand
from django.utils import timezone

from stories.models import Story


class Command(BaseCommand):
    help = "Publish scheduled stories whose scheduled time has arrived."

    def handle(self, *args, **options):
        now = timezone.now()

        stories = Story.objects.filter(
            status="scheduled",
            scheduled_at__isnull=False,
            scheduled_at__lte=now,
        )

        published_count = 0

        for story in stories:
            story.status = "published"
            story.published_at = now
            story.scheduled_at = None
            story.save()

            published_count += 1

            self.stdout.write(
                self.style.SUCCESS(
                    f'Published: "{story.title}" (ID: {story.id})'
                )
            )

        if published_count == 0:
            self.stdout.write(
                self.style.WARNING(
                    "No scheduled stories were ready to be published."
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully published {published_count} scheduled "
                    f"story/stories."
                )
            )