from django.conf import settings
from django.db import models
from django.utils import timezone

class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL,
                                on_delete=models.CASCADE,
                                related_name='profile',)
    bio = models.TextField(blank=True)
    profile_image = models.ImageField(upload_to='profiles/',
                                      blank=True,
                                      null=True,)
    is_premium = models.BooleanField(default=False)
    premium_expires_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def has_active_premium(self):
        now = timezone.now()

        return self.user.subscriptions.filter(
            status='active',
            start_date__lte=now,
            end_date__gt=now,
        ).exists()

    def __str__(self):
        return self.user.username


class SubscriptionPlan(models.Model):
    PLAN_TYPE_CHOICES = [
        ('monthly', 'Monthly'),
        ('annual', 'Annual'),
    ]

    name = models.CharField(max_length=100)

    plan_type = models.CharField(
        max_length=20,
        choices=PLAN_TYPE_CHOICES,
        unique=True,
    )

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    duration_days = models.PositiveIntegerField()

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - ₹{self.price}"


class Subscription(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='subscriptions',
    )

    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name='subscriptions',
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
    )

    start_date = models.DateTimeField(
        blank=True,
        null=True,
    )

    end_date = models.DateTimeField(
        blank=True,
        null=True,
    )

    payment_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    razorpay_order_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"{self.user.username} - {self.plan.name} - {self.status}"

    