import { Link } from "react-router-dom"
import { ArrowRight, BookOpen, Clock3 } from "lucide-react"
import { useStories } from "@/hooks/useStories"

function HomePage() {
    const { data, isLoading, isError } = useStories()

    if (isLoading) {
        return (
            <main className="py-16">
                <div className="mx-auto max-w-3xl">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 w-32 rounded bg-muted" />
                        <div className="h-12 w-3/4 rounded bg-muted" />
                        <div className="h-5 w-2/3 rounded bg-muted" />
                    </div>
                </div>
            </main>
        )
    }

    if (isError) {
        return (
            <main className="py-16">
                <div className="mx-auto max-w-2xl rounded-xl border border-destructive/30 bg-destructive/5 p-6">
                    <h1 className="font-semibold text-destructive">
                        Unable to load stories
                    </h1>

                    <p className="mt-2 text-sm text-muted-foreground">
                        Please try again later.
                    </p>
                </div>
            </main>
        )
    }

    return (
        <main>
            {/* Hero */}
            <section className="relative overflow-hidden border-b border-border/80 py-16 sm:py-20 lg:py-24">
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-secondary/70 via-background to-background" />

                <div className="max-w-4xl">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium tracking-wide text-muted-foreground shadow-sm">
                        <BookOpen className="h-3.5 w-3.5" />
                        Independent publishing
                    </div>

                    <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                        Welcome to Inkwell
                    </p>

                    <h1 className="max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                        Discover stories
                        <br />
                        worth reading.
                    </h1>

                    <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                        Explore ideas, experiences, and knowledge from
                        writers on Inkwell.
                    </p>
                </div>
            </section>

            {/* Stories */}
            <section className="py-12 sm:py-16">
                <div className="mb-8 flex items-end justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                            Explore
                        </p>

                        <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                            Latest stories
                        </h2>
                    </div>

                    <span className="shrink-0 text-sm text-muted-foreground">
                        {data?.length || 0} stories
                    </span>
                </div>

                {data?.length === 0 ? (
                    <div className="rounded-xl border bg-card p-10 text-center">
                        <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />

                        <h3 className="mt-4 font-semibold">
                            No stories available
                        </h3>

                        <p className="mt-2 text-sm text-muted-foreground">
                            Check back later for new stories.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2">
                        {data?.map((story) => (
                            <article
                                key={story.id}
                                className="group flex flex-col rounded-xl border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div className="mb-5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    <Clock3 className="h-3.5 w-3.5" />
                                    {story.read_time_display}
                                </div>

                                <h3 className="text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
                                    {story.title}
                                </h3>

                                <div className="mt-auto pt-7">
                                    <Link
                                        to={`/stories/${story.id}`}
                                        className="inline-flex items-center gap-2 text-sm font-semibold transition-colors group-hover:text-accent"
                                    >
                                        Read story
                                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    )
}

export default HomePage