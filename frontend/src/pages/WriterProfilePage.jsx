import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useParams } from "react-router-dom"
import {
    followUser,
    getWriterProfile,
    unfollowUser,
} from "@/api/stories"
import {
    ArrowRight,
    BookOpen,
    Check,
    UserPlus,
} from "lucide-react"

function WriterProfilePage() {
    const { username } = useParams()
    const accessToken = localStorage.getItem("access_token")
    const queryClient = useQueryClient()

    const { data, isLoading, isError } = useQuery({
        queryKey: ["writer-profile", username],
        queryFn: () => getWriterProfile(username, accessToken),
    })

    const followMutation = useMutation({
        mutationFn: () => followUser(data.id, accessToken),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["writer-profile", username],
            })
        },
    })

    const unfollowMutation = useMutation({
        mutationFn: () => unfollowUser(data.id, accessToken),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["writer-profile", username],
            })
        },
    })

    if (isLoading) {
        return (
            <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
                <div className="animate-pulse">
                    <div className="rounded-2xl border bg-card p-6 sm:p-8">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="h-16 w-16 shrink-0 rounded-full bg-muted sm:h-20 sm:w-20" />

                                <div className="space-y-3">
                                    <div className="h-3 w-16 rounded bg-muted" />
                                    <div className="h-8 w-48 rounded bg-muted" />
                                    <div className="h-4 w-28 rounded bg-muted" />
                                </div>
                            </div>

                            <div className="h-10 w-28 rounded-lg bg-muted" />
                        </div>

                        <div className="mt-7 space-y-2">
                            <div className="h-4 w-full max-w-2xl rounded bg-muted" />
                            <div className="h-4 w-4/5 max-w-xl rounded bg-muted" />
                        </div>
                    </div>

                    <div className="mt-10 space-y-4">
                        <div className="h-6 w-44 rounded bg-muted" />
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
                <div
                    role="alert"
                    className="rounded-xl border border-destructive/25 bg-destructive/5 p-6"
                >
                    <h1 className="text-sm font-semibold text-destructive">
                        Unable to load writer profile
                    </h1>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Something went wrong while loading this writer's
                        profile. Please try again later.
                    </p>
                </div>
            </main>
        )
    }

    const isFollowing = data?.is_following ?? false

    const displayName =
        [data.first_name, data.last_name].filter(Boolean).join(" ") ||
        data.username

    const isFollowPending =
        followMutation.isPending || unfollowMutation.isPending

    const initial = data.username?.charAt(0)?.toUpperCase() || "W"

    const API_SERVER_URL = "http://127.0.0.1:8000"

    const profileImageUrl = data.profile_image
        ? data.profile_image.startsWith("http")
            ? data.profile_image
            : `${API_SERVER_URL}${data.profile_image}`
        : null

    return (
        <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
            {/* Profile Header */}
            <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className="h-2 bg-primary" />

                <div className="p-6 sm:p-8">
                    <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4 sm:gap-5">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-secondary sm:h-20 sm:w-20">
                                {profileImageUrl ? (
                                    <img
                                        src={profileImageUrl}
                                        alt={displayName}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="text-xl font-semibold tracking-tight sm:text-2xl">
                                        {initial}
                                    </span>
                                )}
                            </div>

                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                                    Writer
                                </p>

                                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                                    {displayName}
                                </h1>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    @{data.username}
                                </p>
                            </div>
                        </div>

                        {accessToken && (
                            <button
                                type="button"
                                onClick={() =>
                                    isFollowing
                                        ? unfollowMutation.mutate()
                                        : followMutation.mutate()
                                }
                                disabled={isFollowPending}
                                className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium shadow-sm transition-all sm:w-auto ${
                                    isFollowing
                                        ? "border bg-background hover:bg-secondary"
                                        : "bg-primary text-primary-foreground hover:-translate-y-0.5 hover:opacity-90"
                                } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                                {isFollowing ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <UserPlus className="h-4 w-4" />
                                )}

                                {isFollowing
                                    ? unfollowMutation.isPending
                                        ? "Unfollowing..."
                                        : "Following"
                                    : followMutation.isPending
                                        ? "Following..."
                                        : "Follow"}
                            </button>
                        )}
                    </div>

                    {data.bio && (
                        <div className="mt-7 border-t pt-6">
                            <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                                {data.bio}
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* Published Stories */}
            <section className="mt-10 sm:mt-12">
                <div className="mb-6 flex items-end justify-between gap-4 border-b pb-5">
                    <div>
                        <div className="flex items-center gap-2 text-accent">
                            <BookOpen className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                                Writing
                            </span>
                        </div>

                        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                            Published Stories
                        </h2>

                        <p className="mt-2 text-sm text-muted-foreground">
                            Stories published by {displayName}.
                        </p>
                    </div>

                    {data.stories?.length > 0 && (
                        <span className="hidden shrink-0 rounded-full border bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
                            {data.stories.length}{" "}
                            {data.stories.length === 1 ? "story" : "stories"}
                        </span>
                    )}
                </div>

                {data.stories?.length ? (
                    <div className="space-y-4">
                        {data.stories.map((story) => (
                            <article
                                key={story.id}
                                className="group rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6"
                            >
                                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-lg font-semibold leading-snug tracking-tight sm:text-xl">
                                            <Link
                                                to={`/stories/${story.id}`}
                                                className="transition-colors group-hover:text-accent"
                                            >
                                                {story.title}
                                            </Link>
                                        </h3>

                                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                            <BookOpen className="h-3.5 w-3.5" />
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
                    </div>
                ) : (
                    <div className="rounded-2xl border bg-card p-10 text-center shadow-sm sm:p-14">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border bg-secondary">
                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                        </div>

                        <h3 className="mt-5 text-xl font-semibold tracking-tight">
                            No published stories
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                            This writer has not published any stories yet.
                        </p>
                    </div>
                )}
            </section>
        </main>
    )
}

export default WriterProfilePage
