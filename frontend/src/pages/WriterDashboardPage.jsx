import { Link } from "react-router-dom"
import { BookOpen, PenLine } from "lucide-react"
import { useCurrentUser } from "@/hooks/useCurrentUser"

function WriterDashboardPage() {
    const { data, isLoading, isError } = useCurrentUser()

    if (isLoading) {
        return (
            <main className="mx-auto max-w-5xl px-4 py-10">
                <p className="text-muted-foreground">Loading dashboard...</p>
            </main>
        )
    }

    if (isError) {
        return (
            <main className="mx-auto max-w-5xl px-4 py-10">
                <p className="text-destructive">
                    Unable to load your account.
                </p>
            </main>
        )
    }

    const displayName = data?.first_name || data?.username || "Writer"

    return (
        <main className="mx-auto max-w-5xl px-4 py-10">
            <div className="mb-10">
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                    Writer Dashboard
                </p>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Welcome, {displayName}
                </h1>

                <p className="mt-3 max-w-2xl text-muted-foreground">
                    Manage your stories and publishing activity.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Link
                    to="/dashboard/stories"
                    className="group rounded-xl border bg-card p-6 transition-colors hover:bg-muted/50"
                >
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border bg-background">
                        <BookOpen className="h-5 w-5" />
                    </div>

                    <h2 className="text-xl font-semibold">
                        Manage Stories
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        View, edit, and manage your published, draft, and
                        scheduled stories.
                    </p>

                    <p className="mt-5 text-sm font-medium">
                        View stories →
                    </p>
                </Link>

                <Link
                    to="/dashboard/stories/new"
                    className="group rounded-xl border bg-card p-6 transition-colors hover:bg-muted/50"
                >
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border bg-background">
                        <PenLine className="h-5 w-5" />
                    </div>

                    <h2 className="text-xl font-semibold">
                        Write a New Story
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Start writing a new story using the Inkwell editor.
                    </p>

                    <p className="mt-5 text-sm font-medium">
                        Start writing →
                    </p>
                </Link>
            </div>
        </main>
    )
}

export default WriterDashboardPage