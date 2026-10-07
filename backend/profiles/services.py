from django.db import transaction
from django.utils import timezone
from datetime import timedelta

from .models import Subscription


def sync_premium_profile(user):
    active_subscriptions = user.subscriptions.filter(
        status='active',
        start_date__lte=timezone.now(),
        end_date__gt=timezone.now(),
    )

    latest_subscription = active_subscriptions.order_by(
        '-end_date'
    ).first()

    profile = user.profile

    if latest_subscription:
        profile.is_premium = True
        profile.premium_expires_at = latest_subscription.end_date
    else:
        profile.is_premium = False
        profile.premium_expires_at = None

    profile.save(
        update_fields=[
            'is_premium',
            'premium_expires_at',
            'updated_at',
        ]
    )

    return profile

def create_subscription_order(user, plan, razorpay_client):
    subscription = Subscription.objects.create(
        user=user,
        plan=plan,
        status='pending',
    )

    amount_in_paise = int(plan.price * 100)

    razorpay_order = razorpay_client.order.create({
        'amount': amount_in_paise,
        'currency': 'INR',
        'receipt': f'inkwell_sub_{subscription.id}',
    })

    subscription.razorpay_order_id = razorpay_order['id']

    subscription.save(
        update_fields=[
            'razorpay_order_id',
            'updated_at',
        ]
    )

    return subscription, razorpay_order


@transaction.atomic
def verify_subscription_payment(
    user,
    subscription_id,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    razorpay_client,
):
    try:
        subscription = (
            Subscription.objects
            .select_for_update()
            .get(
                id=subscription_id,
                user=user,
            )
        )
    except Subscription.DoesNotExist:
        return {
            'success': False,
            'error': 'Subscription not found.',
            'status': 404,
        }

    if subscription.razorpay_order_id != razorpay_order_id:
        return {
            'success': False,
            'error': 'Order ID does not match.',
            'status': 400,
        }

    if subscription.status == 'active':
        return {
            'success': False,
            'error': 'Subscription is already active.',
            'status': 400,
        }

    try:
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature,
        })

    except Exception:
        return {
            'success': False,
            'error': 'Payment verification failed.',
            'status': 400,
        }

    subscription = activate_subscription(
        subscription,
        razorpay_payment_id,
    )

    return {
        'success': True,
        'subscription': subscription,
        'status': 200,
    }

@transaction.atomic
def process_razorpay_webhook(
    payload,
    webhook_signature,
    webhook_secret,
    razorpay_client,
):
    try:
        razorpay_client.utility.verify_webhook_signature(
            payload,
            webhook_signature,
            webhook_secret,
        )
    except Exception:
        return {
            'success': False,
            'error': 'Invalid webhook signature.',
            'status': 400,
        }

    import json

    try:
        data = json.loads(payload)
    except (json.JSONDecodeError, TypeError):
        return {
            'success': False,
            'error': 'Invalid webhook payload.',
            'status': 400,
        }

    event = data.get('event')

    if event not in [
        'payment.captured',
        'order.paid',
    ]:
        return {
            'success': True,
            'ignored': True,
            'message': 'Webhook received. Event ignored.',
            'status': 200,
        }

    try:
        payment = data['payload']['payment']['entity']

        payment_id = payment['id']
        order_id = payment['order_id']
        payment_status = payment.get('status')

    except (KeyError, TypeError):
        return {
            'success': False,
            'error': 'Invalid payment payload.',
            'status': 400,
        }

    if payment_status != 'captured':
        return {
            'success': True,
            'ignored': True,
            'message': 'Payment is not captured.',
            'status': 200,
        }

    try:
        subscription = (
            Subscription.objects
            .select_for_update()
            .select_related('plan', 'user')
            .get(
                razorpay_order_id=order_id,
            )
        )
    except Subscription.DoesNotExist:
        return {
            'success': False,
            'error': 'Subscription not found for this order.',
            'status': 404,
        }

    if subscription.status == 'active':
        if subscription.payment_id == payment_id:
            return {
                'success': True,
                'already_processed': True,
                'message': 'Webhook already processed.',
                'status': 200,
            }

        return {
            'success': True,
            'already_processed': True,
            'message': 'Subscription is already active.',
            'status': 200,
        }

    subscription = activate_subscription(
        subscription,
        payment_id,
    )

    return {
        'success': True,
        'subscription': subscription,
        'message': 'Webhook processed successfully.',
        'status': 200,
    }

@transaction.atomic
def activate_subscription(subscription, payment_id):
    start_date = timezone.now()
    end_date = start_date + timedelta(
        days=subscription.plan.duration_days
    )

    subscription.status = 'active'
    subscription.start_date = start_date
    subscription.end_date = end_date
    subscription.payment_id = payment_id

    subscription.save(
        update_fields=[
            'status',
            'start_date',
            'end_date',
            'payment_id',
            'updated_at',
        ]
    )

    sync_premium_profile(subscription.user)

    return subscription


@transaction.atomic
def expire_subscription(subscription):
    subscription.status = 'expired'

    subscription.save(
        update_fields=[
            'status',
            'updated_at',
        ]
    )

    sync_premium_profile(subscription.user)

    return subscription