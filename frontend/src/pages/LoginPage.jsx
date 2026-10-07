import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, LogIn } from "lucide-react"
import { loginUser } from "@/api/auth"

function LoginPage() {
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        username: "",
        password: "",
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
            const data = await loginUser(formData)

            localStorage.setItem("access_token", data.access)
            localStorage.setItem("refresh_token", data.refresh)

            navigate("/dashboard")
        } catch (error) {
            setError(
                error.data
                    ? JSON.stringify(error.data)
                    : "Login failed."
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <main className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl items-center justify-center px-4 py-12 sm:py-16">
            <section className="w-full max-w-md">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border bg-card shadow-sm">
                        <LogIn className="h-5 w-5" />
                    </div>

                    <p className="mb-2 text-sm font-medium text-muted-foreground">
                        Welcome back
                    </p>

                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        Sign in to Inkwell
                    </h1>

                    <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                        Continue reading, writing, and connecting with
                        the Inkwell community.
                    </p>
                </div>

                {/* Form Card */}
                <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
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
                                placeholder="Enter your username"
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
                                autoComplete="current-password"
                                placeholder="Enter your password"
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
                                ? "Signing in..."
                                : "Sign in"}

                            {!isSubmitting && (
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            )}
                        </button>
                    </form>

                    {/* Register */}
                    <div className="mt-7 border-t pt-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            Don't have an account?{" "}
                            <Link
                                to="/register"
                                className="font-medium text-foreground underline-offset-4 hover:underline"
                            >
                                Create an account
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
                    By signing in, you can access your stories,
                    reading list, profile, and membership features.
                </p>
            </section>
        </main>
    )
}

export default LoginPage
