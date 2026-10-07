import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import {
ArrowRight,
BookOpen,
Clock3,
Rss,
UserRound,
} from "lucide-react"
import { getPersonalizedFeed } from "@/api/stories"

function PersonalizedFeedPage() {
const accessToken = localStorage.getItem("access_token")


const {
    data: stories = [],
    isLoading,
    isError,
} = useQuery({
    queryKey: ["personalized-feed"],
    queryFn: () => getPersonalizedFeed(accessToken),
    enabled: Boolean(accessToken),
})

if (!accessToken) {
    return (
        <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
            <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center shadow-sm sm:p-10">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border bg-secondary">
                    <Rss className="h-6 w-6 text-muted-foreground" />
                </div>

                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    Personalized Reading
                </p>

                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                    Your Personalized Feed
                </h1>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                    Follow writers you enjoy and discover their latest
                    published stories in one place.
                </p>

                <Link
                    to="/login"
                    className="mt-7 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90"
                >
                    Login to view your feed
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
                <div className="h-3 w-32 rounded bg-muted" />
                <div className="mt-3 h-10 w-48 rounded bg-muted" />
                <div className="mt-3 h-4 w-80 max-w-full rounded bg-muted" />

                <div className="mt-8 space-y-4">
                    <div className="h-36 rounded-xl bg-muted" />
                    <div className="h-36 rounded-xl bg-muted" />
                    <div className="h-36 rounded-xl bg-muted" />
                </div>
            </div>
        </main>
    )
}

if (isError) {
    return (
        <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
            <div
                role="alert"
                className="rounded-xl border border-destructive/25 bg-destructive/5 p-6"
            >
                <h1 className="text-sm font-semibold text-destructive">
                    Unable to load your feed
                </h1>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Something went wrong while loading stories from the
                    writers you follow. Please try again later.
                </p>
            </div>
        </main>
    )
}

return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
        {/* Page Header */}
        <div className="mb-8 border-b pb-8">
            <div className="flex items-center gap-2 text-accent">
                <Rss className="h-4 w-4" />

                <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                    Personalized Feed
                </span>
            </div>

            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        Your Feed
                    </h1>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                        Stories from authors you follow, brought together
                        in one place.
                    </p>
                </div>

                {stories.length > 0 && (
                    <span className="w-fit rounded-full border bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground">
                        {stories.length}{" "}
                        {stories.length === 1 ? "story" : "stories"}
                    </span>
                )}
            </div>
        </div>

        {/* Empty State */}
        {stories.length === 0 ? (
            <section className="rounded-2xl border bg-card p-10 text-center shadow-sm sm:p-14">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border bg-secondary">
                    <BookOpen className="h-6 w-6 text-muted-foreground" />
                </div>

                <h2 className="mt-5 text-xl font-semibold tracking-tight">
                    Your feed is empty
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    Follow writers whose work interests you to see their
                    published stories here.
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
            /* Story Feed */
            <section className="space-y-4">
                {stories.map((story) => (
                    <article
                        key={story.id}
                        className="group rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6"
                    >
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0 flex-1">
                                <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <UserRound className="h-3.5 w-3.5" />

                                    <span>
                                        By{" "}
                                        <span className="font-medium text-foreground/80">
                                            {story.author_username}
                                        </span>
                                    </span>
                                </div>

                                <h2 className="text-lg font-semibold leading-snug tracking-tight sm:text-xl">
                                    <Link
                                        to={`/stories/${story.id}`}
                                        className="transition-colors group-hover:text-accent"
                                    >
                                        {story.title}
                                    </Link>
                                </h2>

                                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Clock3 className="h-3.5 w-3.5" />
                                    <span>
                                        {story.read_time} min read
                                    </span>
                                </div>
                            </div>

                            <Link
                                to={`/stories/${story.id}`}
                                className="inline-flex w-fit shrink-0 items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium transition-all hover:bg-secondary"
                            >
                                Read Story
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        </div>
                    </article>
                ))}
            </section>
        )}
    </main>
)


}

export default PersonalizedFeedPage
