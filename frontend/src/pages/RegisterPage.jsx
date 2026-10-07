import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, UserPlus } from "lucide-react"
import { registerUser } from "@/api/auth"

function RegisterPage() {
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        first_name: "",
        last_name: "",
    })

    const [error, setError] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleChange = (event) => {
        const { name, value } = event.target

        setFormData((current) => ({
            ...current,
            [name]: value,
        }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError("")
        setIsSubmitting(true)

        try {
            await registerUser(formData)
            navigate("/login")
        } catch (error) {
            setError(
                error.data
                    ? JSON.stringify(error.data)
                    : "Registration failed."
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <main className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl items-center justify-center px-4 py-12 sm:py-16">
            <section className="w-full max-w-lg">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border bg-card shadow-sm">
                        <UserPlus className="h-5 w-5" />
                    </div>

                    <p className="mb-2 text-sm font-medium text-muted-foreground">
                        Join Inkwell
                    </p>

                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        Create your account
                    </h1>

                    <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                        Create an account to read, write, and become part
                        of the Inkwell community.
                    </p>
                </div>

                {/* Form Card */}
                <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name */}
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label
                                    htmlFor="first_name"
                                    className="text-sm font-medium"
                                >
                                    First name
                                </label>

                                <input
                                    id="first_name"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    autoComplete="given-name"
                                    placeholder="First name"
                                    className="h-11 w-full rounded-lg border bg-background px-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="last_name"
                                    className="text-sm font-medium"
                                >
                                    Last name
                                </label>

                                <input
                                    id="last_name"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    autoComplete="family-name"
                                    placeholder="Last name"
                                    className="h-11 w-full rounded-lg border bg-background px-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                                />
                            </div>
                        </div>

                        {/* Username */}
                        <div className="space-y-2">
                            <label
                                htmlFor="username"
                                className="text-sm font-medium"
                            >
                                Username
                            </label>

                            <input
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                autoComplete="username"
                                placeholder="Choose a username"
                                className="h-11 w-full rounded-lg border bg-background px-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />

                            <p className="text-xs text-muted-foreground">
                                This will be your public username on
                                Inkwell.
                            </p>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label
                                htmlFor="email"
                                className="text-sm font-medium"
                            >
                                Email
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                autoComplete="email"
                                placeholder="you@example.com"
                                className="h-11 w-full rounded-lg border bg-background px-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label
                                htmlFor="password"
                                className="text-sm font-medium"
                            >
                                Password
                            </label>

                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                autoComplete="new-password"
                                placeholder="Create a password"
                                className="h-11 w-full rounded-lg border bg-background px-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div
                                role="alert"
                                className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm leading-5 text-destructive"
                            >
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSubmitting
                                ? "Creating account..."
                                : "Create account"}

                            {!isSubmitting && (
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            )}
                        </button>
                    </form>

                    {/* Login */}
                    <div className="mt-7 border-t pt-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link
                                to="/login"
                                className="font-medium text-foreground underline-offset-4 hover:underline"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
                    Your account lets you read, publish, comment, follow
                    writers, and save stories to your reading list.
                </p>
            </section>
        </main>
    )
}

export default RegisterPage
