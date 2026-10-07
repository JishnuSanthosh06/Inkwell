import { Link } from "react-router-dom"
import {
    ArrowRight,
    CalendarClock,
    CheckCircle2,
    Clock3,
    FileText,
    Pencil,
    Plus,
} from "lucide-react"
import { useMyStories } from "@/hooks/useMyStories"

function WriterStoriesPage() {
    const { data, isLoading, isError } = useMyStories()

    const getStatusStyles = (status) => {
        switch (status?.toLowerCase()) {
            case "published":
                return {
                    icon: CheckCircle2,
                    className:
                        "border-emerald-200 bg-emerald-50 text-emerald-700",
                }

            case "scheduled":
                return {
                    icon: CalendarClock,
                    className:
                        "border-amber-200 bg-amber-50 text-amber-700",
                }

            case "draft":
                return {
                    icon: FileText,
                    className:
                        "border-border bg-secondary text-muted-foreground",
                }

            default:
                return {
                    icon: FileText,
                    className:
                        "border-border bg-secondary text-muted-foreground",
                }
        }
    }

    const formatScheduledDate = (date) => {
        if (!date) {
            return null
        }

        const parsedDate = new Date(date)

        if (Number.isNaN(parsedDate.getTime())) {
            return null
        }

        return parsedDate.toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        })
    }

    if (isLoading) {
        return (
            <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
                <div className="animate-pulse">
                    <div className="h-3 w-28 rounded bg-muted" />

                    <div className="mt-3 h-10 w-48 rounded bg-muted" />

                    <div className="mt-3 h-4 w-80 max-w-full rounded bg-muted" />

                    <div className="mt-8 space-y-4">
                        <div className="h-32 rounded-xl bg-muted" />
                        <div className="h-32 rounded-xl bg-muted" />
                    </div>
                </div>
            </main>
        )
    }

    if (isError) {
        return (
            <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
                    <p className="text-sm font-medium text-destructive">
                        Unable to load your stories.
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Please try again later.
                    </p>
                </div>
            </main>
        )
    }

    return (
        <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
            {/* Header */}
            <div className="mb-8 flex flex-col gap-5 border-b pb-8 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                        Writer Dashboard
                    </p>

                    <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                        My Stories
                    </h1>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                        Manage your published, draft, and scheduled stories.
                    </p>
                </div>

                <Link
                    to="/dashboard/stories/new"
                    className="inline-flex w-fit shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90"
                >
                    <Plus className="h-4 w-4" />
                    Create New Story
                </Link>
            </div>

            {/* Empty state */}
            {data?.length === 0 ? (
                <div className="rounded-xl border bg-card p-10 text-center sm:p-14">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border bg-secondary">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>

                    <h2 className="mt-5 text-xl font-semibold tracking-tight">
                        No stories yet
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                        Start your first story and publish your ideas on
                        Inkwell.
                    </p>

                    <Link
                        to="/dashboard/stories/new"
                        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    >
                        Write your first story
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {data?.map((story) => {
                        const status =
                            getStatusStyles(story.status)

                        const StatusIcon = status.icon

                        const scheduledDate =
                            story.status?.toLowerCase() ===
                            "scheduled"
                                ? formatScheduledDate(
                                      story.scheduled_at
                                  )
                                : null

                        return (
                            <article
                                key={story.id}
                                className="group rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6"
                            >
                                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                    {/* Story information */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${status.className}`}
                                            >
                                                <StatusIcon className="h-3.5 w-3.5" />
                                                {story.status}
                                            </span>

                                            {story.visibility && (
                                                <span className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">
                                                    {story.visibility.replace(
                                                        "_",
                                                        " "
                                                    )}
                                                </span>
                                            )}
                                        </div>

                                        <h2 className="mt-3 text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-accent sm:text-xl">
                                            {story.title ||
                                                "Untitled Story"}
                                        </h2>

                                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                            {story.read_time_display && (
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Clock3 className="h-3.5 w-3.5" />
                                                    {
                                                        story.read_time_display
                                                    }
                                                </span>
                                            )}

                                            {scheduledDate && (
                                                <span className="inline-flex items-center gap-1.5">
                                                    <CalendarClock className="h-3.5 w-3.5" />
                                                    {scheduledDate}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Edit action */}
                                    <Link
                                        to={`/dashboard/stories/${story.id}/edit`}
                                        className="inline-flex w-fit shrink-0 items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                        Edit
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            </article>
                        )
                    })}
                </div>
            )}
        </main>
    )
}

export default WriterStoriesPage
