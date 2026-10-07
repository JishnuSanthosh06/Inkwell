from django.urls import path
from .views import (
    ProfileView,
    SubscriptionPlanListView, 
    CreateSubscriptionOrderView,
    VerifySubscriptionPaymentView,
    SubscriptionListView,
    ActiveSubscriptionView,
    RazorpayWebhookView,
    PublicWriterProfileView,)

urlpatterns = [
    path('',
         ProfileView.as_view(), 
         name='profile'),

    path('plans/', 
         SubscriptionPlanListView.as_view(), 
         name='subscription-plan-list'),

    path('subscriptions/create-order/', 
         CreateSubscriptionOrderView.as_view(), 
         name='create-subscription-order'),

    path('subscriptions/verify-payment/',
         VerifySubscriptionPaymentView.as_view(), 
         name='verify-subscription-payment'),

    path('subscriptions/', 
         SubscriptionListView.as_view(), 
         name='subscription-list'),

    path('subscriptions/active/', 
         ActiveSubscriptionView.as_view(), 
         name='active-subscription'),

    path('subscriptions/webhook/', 
         RazorpayWebhookView.as_view(), 
         name='razorpay-webhook'), 

    path('writers/<str:username>/',
        PublicWriterProfileView.as_view(),
        name='public-writer-profile'),
] 

