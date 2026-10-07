import apiClient from "./client"

export const getSubscriptionPlans = () => {
    return apiClient("/profile/plans/")
}

export const createSubscriptionOrder = (planId, accessToken) => {
    return apiClient("/profile/subscriptions/create-order/", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            plan_id: planId,
        }),
    })
}

export const verifySubscriptionPayment = (
    subscriptionId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    accessToken
) => {
    return apiClient("/profile/subscriptions/verify-payment/", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            subscription_id: subscriptionId,
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
        }),
    })
}

export const getSubscriptions = (accessToken) => {
    return apiClient("/profile/subscriptions/", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })
}

export const getActiveSubscription = (accessToken) => {
    return apiClient("/profile/subscriptions/active/", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })
}