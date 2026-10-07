import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
    getReadingList,
    removeFromReadingList,
} from "@/api/stories"
import { Link } from "react-router-dom"
import {
    ArrowRight,
    BookOpen,
    Bookmark,
    Clock3,
    Trash2,
} from "lucide-react"

function ReadingListPage() {
    const accessToken = localStorage.getItem("access_token")
    const queryClient = useQueryClient()

    const {
        data: readingList = [],
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["reading-list"],
        queryFn: () => getReadingList(accessToken),
        enabled: Boolean(accessToken),
    })

    const removeMutation = useMutation({
        mutationFn: (storyId) =>
            removeFromReadingList(storyId, accessToken),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["reading-list"],
            })
        },
    })

    if (!accessToken) {
        return (
            <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
                <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center shadow-sm sm:p-10">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border bg-secondary">
                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>

                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                        Your Library
                    </p>

                    <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                        Your Reading List
                    </h1>

                    <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                        Save stories you want to read later and keep them
                        organized in one place.
                    </p>

                    <Link
                        to="/login"
                        className="mt-7 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90"
                    >
                        Login to continue
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </main>
        )
    }

    if (isLoading) {
        return (
            <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
                <div className="animate-pulse">
                    <div className="h-3 w-24 rounded bg-muted" />
                    <div className="mt-3 h-10 w-56 rounded bg-muted" />
                    <div className="mt-3 h-4 w-80 max-w-full rounded bg-muted" />

                    <div className="mt-8 space-y-4">
                        <div className="h-28 rounded-xl bg-muted" />
                        <div className="h-28 rounded-xl bg-muted" />
                        <div className="h-28 rounded-xl bg-muted" />
                    </div>
                </div>
            </main>
        )
    }

    if (isError) {
        return (
            <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
                <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-6">
                    <p className="text-sm font-semibold text-destructive">
                        Unable to load your reading list
                    </p>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Something went wrong while loading your saved stories.
                        Please try again later.
                    </p>
                </div>
            </main>
        )
    }

    return (
        <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
            {/* Page Header */}
            <div className="mb-8 border-b pb-8">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    <Bookmark className="h-3.5 w-3.5" />
                    Your Library
                </div>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Reading List
                        </h1>

                        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                            Stories you saved to read later.
                        </p>
                    </div>

                    {readingList.length > 0 && (
                        <span className="w-fit rounded-full border bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground">
                            {readingList.length}{" "}
                            {readingList.length === 1
                                ? "story"
                                : "stories"}
                        </span>
                    )}
                </div>
            </div>

            {readingList.length === 0 ? (
                <section className="rounded-2xl border bg-card p-10 text-center shadow-sm sm:p-14">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border bg-secondary">
                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>

                    <h2 className="mt-5 text-xl font-semibold tracking-tight">
                        Your reading list is empty
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                        Save interesting stories while browsing Inkwell and
                        they will appear here for you to read later.
                    </p>

                    <Link
                        to="/"
                        className="mt-7 inline-flex items-center gap-2 rounded-lg border bg-background px-5 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 hover:bg-secondary"
                    >
                        Explore Stories
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </section>
            ) : (
                <section className="space-y-4">
                    {readingList.map((item) => (
                        <article
                            key={item.id}
                            className="group rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6"
                        >
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                {/* Story Information */}
                                <div className="min-w-0 flex-1">
                                    <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                                        <Bookmark className="h-3.5 w-3.5" />
                                        Saved story
                                    </div>

                                    <h2 className="text-lg font-semibold leading-snug tracking-tight sm:text-xl">
                                        <Link
                                            to={`/stories/${item.story}`}
                                            className="transition-colors group-hover:text-accent"
                                        >
                                            {item.story_title}
                                        </Link>
                                    </h2>

                                    <p className="mt-2 text-sm text-muted-foreground">
                                        By{" "}
                                        <span className="font-medium text-foreground/80">
                                            {item.story_author}
                                        </span>
                                    </p>

                                    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Clock3 className="h-3.5 w-3.5" />
                                        Saved for later reading
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                    <Link
                                        to={`/stories/${item.story}`}
                                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90"
                                    >
                                        Read
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeMutation.mutate(item.story)
                                        }
                                        disabled={removeMutation.isPending}
                                        className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />

                                        {removeMutation.isPending
                                            ? "Removing..."
                                            : "Remove"}
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </section>
            )}
        </main>
    )
}

export default ReadingListPage
