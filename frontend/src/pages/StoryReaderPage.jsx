import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    ArrowLeft,
    BookOpen,
    Check,
    Clock3,
    Edit3,
    Hand,
    MessageCircle,
    Trash2,
} from "lucide-react"

import {
    getStory,
    clapStory,
    getComments,
    createComment,
    updateComment,
    deleteComment,
    getReadingList,
    addToReadingList,
    removeFromReadingList,
} from "@/api/stories"

import { useCurrentUser } from "@/hooks/useCurrentUser"

function StoryReaderPage() {
    const { id } = useParams()
    const accessToken = localStorage.getItem("access_token")
    const queryClient = useQueryClient()

    const [comment, setComment] = useState("")
    const [replyContent, setReplyContent] = useState("")
    const [replyTo, setReplyTo] = useState(null)

    const [editingCommentId, setEditingCommentId] = useState(null)
    const [editingContent, setEditingContent] = useState("")

    const { data: currentUser } = useCurrentUser()

    const { data, isLoading, isError } = useQuery({
        queryKey: ["story", id],
        queryFn: () => getStory(id, accessToken),
    })

    const { data: comments = [] } = useQuery({
        queryKey: ["comments", id],
        queryFn: () => getComments(id, accessToken),
        enabled: Boolean(accessToken),
    })

    const { data: readingList = [] } = useQuery({
        queryKey: ["reading-list"],
        queryFn: () => getReadingList(accessToken),
        enabled: Boolean(accessToken),
    })

    const clapMutation = useMutation({
        mutationFn: () => clapStory(id, accessToken),
    })

    const readingListMutation = useMutation({
        mutationFn: (isSaved) =>
            isSaved
                ? removeFromReadingList(id, accessToken)
                : addToReadingList(id, accessToken),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["reading-list"],
            })
        },
    })

    const commentMutation = useMutation({
        mutationFn: () => createComment(id, comment, accessToken),

        onSuccess: () => {
            setComment("")

            queryClient.invalidateQueries({
                queryKey: ["comments", id],
            })
        },
    })

    const replyMutation = useMutation({
        mutationFn: () =>
            createComment(
                id,
                replyContent,
                accessToken,
                replyTo
            ),

        onSuccess: () => {
            setReplyContent("")
            setReplyTo(null)

            queryClient.invalidateQueries({
                queryKey: ["comments", id],
            })
        },
    })

    const updateCommentMutation = useMutation({
        mutationFn: ({ commentId, content }) =>
            updateComment(
                commentId,
                content,
                accessToken
            ),

        onSuccess: () => {
            setEditingCommentId(null)
            setEditingContent("")

            queryClient.invalidateQueries({
                queryKey: ["comments", id],
            })
        },
    })

    const deleteCommentMutation = useMutation({
        mutationFn: (commentId) =>
            deleteComment(
                commentId,
                accessToken
            ),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["comments", id],
            })
        },
    })

    const handleCommentSubmit = (event) => {
        event.preventDefault()

        if (!comment.trim()) {
            return
        }

        commentMutation.mutate()
    }

    const handleEditStart = (commentItem) => {
        setEditingCommentId(commentItem.id)
        setEditingContent(commentItem.content)

        setReplyTo(null)
        setReplyContent("")
    }

    const handleEditCancel = () => {
        setEditingCommentId(null)
        setEditingContent("")
    }

    const handleEditSave = () => {
        if (!editingContent.trim()) {
            return
        }

        updateCommentMutation.mutate({
            commentId: editingCommentId,
            content: editingContent.trim(),
        })
    }

    const handleDelete = (commentItem) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this comment?"
        )

        if (!confirmed) {
            return
        }

        if (editingCommentId === commentItem.id) {
            handleEditCancel()
        }

        if (replyTo === commentItem.id) {
            setReplyTo(null)
            setReplyContent("")
        }

        deleteCommentMutation.mutate(commentItem.id)
    }

    const renderComments = (parentId) => {
        return comments
            .filter((item) => item.parent === parentId)
            .map((commentItem) => {
                const isOwner =
                    Boolean(accessToken) &&
                    String(commentItem.user) ===
                        String(currentUser?.id)

                const isEditing =
                    editingCommentId === commentItem.id

                const isReplying =
                    replyTo === commentItem.id

                const wasEdited =
                    commentItem.updated_at !==
                    commentItem.created_at

                const profileImageUrl = commentItem.profile_image
                    ? commentItem.profile_image.startsWith("http")
                        ? commentItem.profile_image
                        : `http://127.0.0.1:8000${commentItem.profile_image}`
                    : null

                return (
                    <article
                        key={commentItem.id}
                        className="py-6 first:pt-0 last:pb-0"
                    >
                        <div className="flex items-start gap-3.5">
                            {/* Avatar */}
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-secondary text-sm font-semibold text-secondary-foreground">
                                {profileImageUrl ? (
                                    <img
                                        src={profileImageUrl}
                                        alt={
                                            commentItem.username ||
                                            "User"
                                        }
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    commentItem.username
                                        ?.charAt(0)
                                        ?.toUpperCase() || "U"
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                {/* Comment header */}
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <Link
                                        to={`/writers/${commentItem.username}`}
                                        className="text-sm font-semibold tracking-tight hover:underline"
                                    >
                                        {commentItem.username}
                                    </Link>

                                    {wasEdited && (
                                        <span className="text-xs text-muted-foreground">
                                            edited
                                        </span>
                                    )}
                                </div>

                                {/* Comment content / edit form */}
                                {isEditing ? (
                                    <div className="mt-3 rounded-lg border bg-background p-3">
                                        <textarea
                                            className="min-h-24 w-full resize-y rounded-md border bg-background px-3 py-2.5 text-sm leading-6 outline-none transition-shadow focus:ring-2"
                                            value={editingContent}
                                            onChange={(event) =>
                                                setEditingContent(
                                                    event.target.value
                                                )
                                            }
                                            rows={3}
                                            autoFocus
                                        />

                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                                onClick={
                                                    handleEditSave
                                                }
                                                disabled={
                                                    updateCommentMutation.isPending ||
                                                    !editingContent.trim()
                                                }
                                            >
                                                <Check className="h-3.5 w-3.5" />

                                                {updateCommentMutation.isPending
                                                    ? "Saving..."
                                                    : "Save"}
                                            </button>

                                            <button
                                                type="button"
                                                className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                                                onClick={
                                                    handleEditCancel
                                                }
                                                disabled={
                                                    updateCommentMutation.isPending
                                                }
                                            >
                                                Cancel
                                            </button>
                                        </div>

                                        {updateCommentMutation.isError && (
                                            <p className="mt-2 text-xs text-destructive">
                                                Unable to update comment.
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="mt-2 text-sm leading-6 text-foreground/80">
                                        {commentItem.content}
                                    </p>
                                )}

                                {/* Comment actions */}
                                {!isEditing && (
                                    <div className="mt-3 flex flex-wrap items-center gap-4">
                                        {accessToken && (
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                                                onClick={() => {
                                                    setReplyTo(
                                                        isReplying
                                                            ? null
                                                            : commentItem.id
                                                    )

                                                    if (isReplying) {
                                                        setReplyContent("")
                                                    }
                                                }}
                                            >
                                                <MessageCircle className="h-3.5 w-3.5" />

                                                {isReplying
                                                    ? "Cancel reply"
                                                    : "Reply"}
                                            </button>
                                        )}

                                        {isOwner && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                                                    onClick={() =>
                                                        handleEditStart(
                                                            commentItem
                                                        )
                                                    }
                                                >
                                                    <Edit3 className="h-3.5 w-3.5" />
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive/80 transition-colors hover:text-destructive"
                                                    onClick={() =>
                                                        handleDelete(
                                                            commentItem
                                                        )
                                                    }
                                                    disabled={
                                                        deleteCommentMutation.isPending
                                                    }
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Reply form */}
                                {isReplying && (
                                    <div className="mt-4 rounded-lg border bg-muted/30 p-3.5">
                                        <div className="mb-2">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                Reply to{" "}
                                                <span className="text-foreground">
                                                    {commentItem.username}
                                                </span>
                                            </p>
                                        </div>

                                        <textarea
                                            className="min-h-24 w-full resize-y rounded-md border bg-background px-3 py-2.5 text-sm leading-6 outline-none transition-shadow focus:ring-2"
                                            value={replyContent}
                                            onChange={(event) =>
                                                setReplyContent(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Write a reply..."
                                            rows={3}
                                            autoFocus
                                        />

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                className="rounded-md bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                                onClick={() => {
                                                    if (
                                                        !replyContent.trim()
                                                    ) {
                                                        return
                                                    }

                                                    replyMutation.mutate()
                                                }}
                                                disabled={
                                                    replyMutation.isPending ||
                                                    !replyContent.trim()
                                                }
                                            >
                                                {replyMutation.isPending
                                                    ? "Replying..."
                                                    : "Post Reply"}
                                            </button>

                                            <button
                                                type="button"
                                                className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-background"
                                                onClick={() => {
                                                    setReplyTo(null)
                                                    setReplyContent("")
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>

                                        {replyMutation.isError && (
                                            <p className="mt-2 text-xs text-destructive">
                                                Unable to post reply.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Nested replies */}
                                {comments.some(
                                    (item) =>
                                        item.parent ===
                                        commentItem.id
                                ) && (
                                    <div className="mt-5 border-l-2 border-border pl-4 sm:pl-5">
                                        {renderComments(
                                            commentItem.id
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </article>
                )
            })
    }

    if (isLoading) {
        return (
            <main className="mx-auto max-w-3xl py-12">
                <div className="animate-pulse space-y-5">
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="h-12 w-4/5 rounded bg-muted" />
                    <div className="h-5 w-2/5 rounded bg-muted" />

                    <div className="space-y-3 pt-8">
                        <div className="h-4 w-full rounded bg-muted" />
                        <div className="h-4 w-full rounded bg-muted" />
                        <div className="h-4 w-3/4 rounded bg-muted" />
                    </div>
                </div>
            </main>
        )
    }

    if (isError) {
        return (
            <main className="mx-auto max-w-3xl py-12">
                <div className="rounded-xl border bg-card p-8 text-center">
                    <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />

                    <h1 className="mt-4 text-xl font-semibold">
                        Unable to load story
                    </h1>

                    <p className="mt-2 text-sm text-muted-foreground">
                        Please try again later.
                    </p>

                    <Link
                        to="/"
                        className="mt-5 inline-flex items-center gap-2 text-sm font-medium hover:underline"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to stories
                    </Link>
                </div>
            </main>
        )
    }

    if (data?.premium_required) {
        return (
            <main className="mx-auto max-w-3xl py-10">
                <article>
                    <header className="border-b pb-8">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                            Premium story
                        </div>

                        <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
                            {data.title}
                        </h1>

                        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                            {data?.author_username && (
                                <span>
                                    By{" "}
                                    <Link
                                        to={`/writers/${data.author_username}`}
                                        className="font-medium text-foreground underline-offset-4 hover:underline"
                                    >
                                        {data.author_username}
                                    </Link>
                                </span>
                            )}

                            {data?.read_time_display && (
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock3 className="h-3.5 w-3.5" />
                                    {data.read_time_display}
                                </span>
                            )}
                        </div>
                    </header>

                    <div className="mt-10 rounded-xl border bg-card p-6 sm:p-8">
                        <p className="text-base leading-8 text-muted-foreground">
                            {data.preview}
                        </p>
                    </div>

                    <section className="mt-6 rounded-xl border bg-secondary/40 p-6 sm:p-8">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <BookOpen className="h-5 w-5" />
                        </div>

                        <h2 className="mt-5 text-xl font-semibold tracking-tight">
                            Upgrade to Premium
                        </h2>

                        <p className="mt-2 max-w-xl leading-7 text-muted-foreground">
                            {data.upgrade_message}
                        </p>

                        <Link
                            to="/subscription"
                            className="mt-6 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                        >
                            Subscribe to Premium
                        </Link>
                    </section>
                </article>
            </main>
        )
    }

    const isSaved = readingList.some(
        (item) =>
            String(item.story) === String(id) ||
            String(item.story_id) === String(id)
    )

    return (
        <main className="mx-auto max-w-3xl py-10 sm:py-12">
            <article>
                {/* Story header */}
                <header className="border-b pb-8">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                        Story
                    </p>

                    <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
                        {data?.title}
                    </h1>

                    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                        {data?.author_username && (
                            <span>
                                By{" "}
                                <Link
                                    to={`/writers/${data.author_username}`}
                                    className="font-medium text-foreground underline-offset-4 hover:underline"
                                >
                                    {data.author_username}
                                </Link>
                            </span>
                        )}

                        {data?.read_time_display && (
                            <span className="inline-flex items-center gap-1.5">
                                <Clock3 className="h-3.5 w-3.5" />
                                {data.read_time_display}
                            </span>
                        )}
                    </div>
                </header>

                {/* Story content */}
                <div
                    className="prose prose-neutral mt-10 max-w-none dark:prose-invert prose-headings:tracking-tight prose-p:leading-8 prose-a:text-accent"
                    dangerouslySetInnerHTML={{
                        __html: data?.rendered_content,
                    }}
                />

                {/* Story actions */}
                <section className="mt-12 flex flex-wrap items-center gap-3 border-y py-6">
                    {accessToken ? (
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() =>
                                readingListMutation.mutate(isSaved)
                            }
                            disabled={
                                readingListMutation.isPending
                            }
                        >
                            <BookOpen className="h-4 w-4" />

                            {readingListMutation.isPending
                                ? "Saving..."
                                : isSaved
                                    ? "Remove from Reading List"
                                    : "Save to Reading List"}
                        </button>
                    ) : (
                        <span className="text-sm text-muted-foreground">
                            Login to save this story.
                        </span>
                    )}

                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => clapMutation.mutate()}
                        disabled={
                            !accessToken ||
                            clapMutation.isPending
                        }
                        title={
                            accessToken
                                ? "Clap for this story"
                                : "Login to clap"
                        }
                    >
                        <Hand className="h-4 w-4" />

                        {clapMutation.isPending
                            ? "Clapping..."
                            : "Clap"}
                    </button>

                    {!accessToken && (
                        <span className="text-sm text-muted-foreground">
                            Login to clap and save stories.
                        </span>
                    )}

                    {readingListMutation.isError && (
                        <p className="basis-full text-sm text-destructive">
                            Unable to update your reading list.
                        </p>
                    )}

                    {clapMutation.isError && (
                        <p className="basis-full text-sm text-destructive">
                            Unable to clap for this story.
                        </p>
                    )}

                    {clapMutation.isSuccess && (
                        <p className="basis-full text-sm text-muted-foreground">
                            Clap added successfully.
                        </p>
                    )}
                </section>

                {/* Comments */}
                <section className="mt-12">
                    <div className="flex items-end justify-between gap-4 border-b pb-5">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Discussion
                            </p>

                            <h2 className="mt-1.5 text-2xl font-semibold tracking-tight">
                                Comments
                            </h2>
                        </div>

                        {accessToken && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                <MessageCircle className="h-3.5 w-3.5" />
                                {comments.length}
                            </span>
                        )}
                    </div>

                    {/* New comment */}
                    {accessToken ? (
                        <form
                            onSubmit={handleCommentSubmit}
                            className="mt-6 rounded-xl border bg-card p-4 sm:p-5"
                        >
                            <textarea
                                className="min-h-24 w-full resize-y border-0 bg-transparent px-0 py-0 text-sm leading-6 outline-none placeholder:text-muted-foreground focus:ring-0"
                                value={comment}
                                onChange={(event) =>
                                    setComment(event.target.value)
                                }
                                placeholder="Share your thoughts..."
                                rows={3}
                            />

                            <div className="mt-4 flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                                <span className="text-xs text-muted-foreground">
                                    Be respectful and constructive.
                                </span>

                                <button
                                    type="submit"
                                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={
                                        commentMutation.isPending ||
                                        !comment.trim()
                                    }
                                >
                                    {commentMutation.isPending
                                        ? "Posting..."
                                        : "Post Comment"}
                                </button>
                            </div>

                            {commentMutation.isError && (
                                <p className="mt-3 text-xs text-destructive">
                                    Unable to post comment.
                                </p>
                            )}
                        </form>
                    ) : (
                        <div className="mt-6 rounded-xl border bg-secondary/30 p-5">
                            <p className="text-sm text-muted-foreground">
                                Login to join the discussion and reply to
                                other readers.
                            </p>

                            <Link
                                to="/login"
                                className="mt-3 inline-flex text-sm font-semibold hover:underline"
                            >
                                Login to comment →
                            </Link>
                        </div>
                    )}

                    {/* Comment list */}
                    {accessToken && (
                        <div className="mt-6">
                            {comments.length > 0 ? (
                                <div className="divide-y">
                                    {renderComments(null)}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed p-8 text-center">
                                    <MessageCircle className="mx-auto h-7 w-7 text-muted-foreground" />

                                    <h3 className="mt-3 text-sm font-semibold">
                                        No comments yet
                                    </h3>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Be the first to share your thoughts.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </article>
        </main>
    )
}

export default StoryReaderPage
