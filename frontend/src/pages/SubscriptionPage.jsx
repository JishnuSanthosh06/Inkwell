import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, Crown, CreditCard, Sparkles } from "lucide-react"
import {
    createSubscriptionOrder,
    getSubscriptionPlans,
    verifySubscriptionPayment,
} from "@/api/subscriptions"

function SubscriptionPage() {
    const accessToken = localStorage.getItem("access_token")
    const queryClient = useQueryClient()

    const {
        data: plans = [],
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["subscription-plans"],
        queryFn: getSubscriptionPlans,
    })

    const createOrderMutation = useMutation({
        mutationFn: (planId) =>
            createSubscriptionOrder(planId, accessToken),

        onSuccess: (order) => {
            const options = {
                key: order.razorpay_key_id,
                amount: order.amount * 100,
                currency: order.currency,
                name: "Inkwell",
                description: order.plan_name,
                order_id: order.razorpay_order_id,

                handler: async (response) => {
                    try {
                        await verifySubscriptionPayment(
                            order.subscription_id,
                            response.razorpay_order_id,
                            response.razorpay_payment_id,
                            response.razorpay_signature,
                            accessToken
                        )

                        await queryClient.invalidateQueries({
                            queryKey: ["active-subscription"],
                        })

                        await queryClient.invalidateQueries({
                            queryKey: ["subscriptions"],
                        })

                        alert(
                            "Payment successful. Premium membership activated."
                        )
                    } catch (error) {
                        console.error(
                            "Payment verification failed:",
                            error
                        )

                        alert(
                            "Payment was completed, but verification failed."
                        )
                    }
                },

                modal: {
                    ondismiss: () => {
                        console.log("Razorpay checkout closed.")
                    },
                },
            }

            const razorpay = new window.Razorpay(options)

            razorpay.open()
        },
    })

    const handleSubscribe = (planId) => {
        if (!accessToken) {
            alert("Please login to subscribe.")
            return
        }

        createOrderMutation.mutate(planId)
    }

    if (isLoading) {
        return (
            <main className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
                <div className="mx-auto max-w-3xl text-center">
                    <div className="mx-auto h-4 w-36 animate-pulse rounded bg-muted" />
                    <div className="mx-auto mt-4 h-10 w-full max-w-xl animate-pulse rounded bg-muted" />
                    <div className="mx-auto mt-4 h-5 w-full max-w-2xl animate-pulse rounded bg-muted" />
                </div>

                <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
                    {[1, 2].map((item) => (
                        <div
                            key={item}
                            className="rounded-2xl border bg-card p-6 sm:p-8"
                        >
                            <div className="flex justify-between">
                                <div className="space-y-3">
                                    <div className="h-6 w-32 animate-pulse rounded bg-muted" />
                                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                                </div>

                                <div className="h-11 w-11 animate-pulse rounded-full bg-muted" />
                            </div>

                            <div className="mt-8 h-10 w-28 animate-pulse rounded bg-muted" />
                            <div className="mt-3 h-4 w-32 animate-pulse rounded bg-muted" />

                            <div className="my-7 border-t" />

                            <div className="space-y-4">
                                {[1, 2, 3].map((feature) => (
                                    <div
                                        key={feature}
                                        className="h-5 w-4/5 animate-pulse rounded bg-muted"
                                    />
                                ))}
                            </div>

                            <div className="mt-8 h-11 animate-pulse rounded-lg bg-muted" />
                        </div>
                    ))}
                </div>
            </main>
        )
    }

    if (isError) {
        return (
            <main className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
                <div className="mx-auto max-w-xl rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
                    <h1 className="text-lg font-semibold text-destructive">
                        Unable to load subscription plans
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        We couldn't load the available membership plans.
                        Please try again later.
                    </p>
                </div>
            </main>
        )
    }

    return (
        <main className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
            {/* Hero */}
            <header className="mx-auto max-w-3xl text-center">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm font-medium shadow-sm">
                    <Crown className="h-4 w-4" />
                    <span>Premium Membership</span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                    Read more. Discover more.
                </h1>

                <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                    Unlock member-only stories and get full access to
                    premium writing from the Inkwell community.
                </p>
            </header>

            {/* Login notice */}
            {!accessToken && (
                <div className="mx-auto mt-8 max-w-2xl rounded-xl border bg-card px-5 py-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        Please{" "}
                        <a
                            href="/login"
                            className="font-medium text-foreground underline underline-offset-4"
                        >
                            log in
                        </a>{" "}
                        to subscribe to a premium plan.
                    </p>
                </div>
            )}

            {/* Plans */}
            {plans.length === 0 ? (
                <section className="mx-auto mt-12 max-w-xl rounded-2xl border bg-card p-8 text-center sm:p-10">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <h2 className="mt-5 text-xl font-semibold">
                        No plans available
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Subscription plans are not currently available.
                        Please check again later.
                    </p>
                </section>
            ) : (
                <section className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
                    {plans.map((plan, index) => (
                        <article
                            key={plan.id}
                            className={`relative flex flex-col overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-8 ${
                                index === 1
                                    ? "border-foreground/20 shadow-sm"
                                    : ""
                            }`}
                        >
                            {index === 1 && (
                                <div className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                                    <Sparkles className="h-3 w-3" />
                                    Popular
                                </div>
                            )}

                            <div className="flex items-start justify-between gap-4">
                                <div className="pr-20">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {plan.plan_type === "monthly"
                                            ? "Monthly membership"
                                            : plan.plan_type === "annual"
                                              ? "Annual membership"
                                              : "Premium membership"}
                                    </p>

                                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                                        {plan.name}
                                    </h2>
                                </div>

                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-background">
                                    <Crown className="h-5 w-5" />
                                </div>
                            </div>

                            {/* Price */}
                            <div className="mt-8">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold tracking-tight sm:text-5xl">
                                        ₹{plan.price}
                                    </span>

                                    <span className="text-sm text-muted-foreground">
                                        / plan
                                    </span>
                                </div>

                                <p className="mt-2 text-sm text-muted-foreground">
                                    Valid for {plan.duration_days} days
                                </p>
                            </div>

                            <div className="my-7 border-t" />

                            {/* Features */}
                            <div className="flex-1">
                                <p className="mb-4 text-sm font-medium">
                                    Included with your membership
                                </p>

                                <div className="space-y-3.5">
                                    <div className="flex items-start gap-3 text-sm">
                                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary">
                                            <Check className="h-3.5 w-3.5" />
                                        </span>

                                        <span>
                                            Access member-only stories
                                        </span>
                                    </div>

                                    <div className="flex items-start gap-3 text-sm">
                                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary">
                                            <Check className="h-3.5 w-3.5" />
                                        </span>

                                        <span>
                                            Full premium membership access
                                        </span>
                                    </div>

                                    <div className="flex items-start gap-3 text-sm">
                                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary">
                                            <Check className="h-3.5 w-3.5" />
                                        </span>

                                        <span>
                                            Secure Razorpay payment
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleSubscribe(plan.id)}
                                disabled={
                                    !accessToken ||
                                    createOrderMutation.isPending
                                }
                                className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {createOrderMutation.isPending
                                    ? "Creating order..."
                                    : "Subscribe"}
                            </button>
                        </article>
                    ))}
                </section>
            )}

            {/* Order error */}
            {createOrderMutation.isError && (
                <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-center text-sm text-destructive">
                    Unable to create the subscription order. Please try
                    again.
                </div>
            )}

            {/* Footer note */}
            {plans.length > 0 && (
                <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-5 text-muted-foreground">
                    Payments are securely processed through Razorpay.
                    Your premium access is activated after successful
                    payment verification.
                </p>
            )}
        </main>
    )
}

export default SubscriptionPage
