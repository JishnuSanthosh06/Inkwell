import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import MDEditor from "@uiw/react-md-editor"
import "@uiw/react-md-editor/markdown-editor.css"
import {
    ArrowLeft,
    CalendarClock,
    FileText,
    Save,
    Tag,
    Users,
} from "lucide-react"
import {
    createStory,
    getMyStory,
    updateStory,
    getTags,
    getTopics,
} from "@/api/stories"

function StoryEditorPage() {
    const navigate = useNavigate()
    const { id } = useParams()

    const isEditMode = Boolean(id)

    const [formData, setFormData] = useState({
        title: "",
        content: "",
        visibility: "free",
        status: "draft",
        scheduled_at: "",
        tags: [],
        topics: [],
    })

    const [tags, setTags] = useState([])
    const [topics, setTopics] = useState([])

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        const loadData = async () => {
            const accessToken = localStorage.getItem("access_token")

            try {
                const [tagData, topicData] = await Promise.all([
                    getTags(accessToken),
                    getTopics(accessToken),
                ])

                setTags(tagData)
                setTopics(topicData)

                if (isEditMode) {
                    const story = await getMyStory(id, accessToken)

                    setFormData({
                        title: story.title || "",
                        content: story.content || "",
                        visibility: story.visibility || "free",
                        status: story.status || "draft",
                        scheduled_at: story.scheduled_at
                            ? story.scheduled_at.slice(0, 16)
                            : "",
                        tags: story.tags || [],
                        topics: story.topics || [],
                    })
                }
            } catch (error) {
                setError(
                    error.data
                        ? JSON.stringify(error.data)
                        : "Unable to load story data."
                )
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [id, isEditMode])

    const handleChange = (event) => {
        const { name, value } = event.target

        setFormData((current) => ({
            ...current,
            [name]: value,
        }))
    }

    const handleTagChange = (event) => {
        const selectedValues = Array.from(
            event.target.selectedOptions,
            (option) => Number(option.value)
        )

        setFormData((current) => ({
            ...current,
            tags: selectedValues,
        }))
    }

    const handleTopicChange = (event) => {
        const selectedValues = Array.from(
            event.target.selectedOptions,
            (option) => Number(option.value)
        )

        setFormData((current) => ({
            ...current,
            topics: selectedValues,
        }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()

        setError("")
        setIsSubmitting(true)

        const accessToken = localStorage.getItem("access_token")

        const storyData = {
            title: formData.title,
            content: formData.content,
            visibility: formData.visibility,
            status: formData.status,
            tags: formData.tags,
            topics: formData.topics,
        }

        if (formData.status === "scheduled") {
            storyData.scheduled_at = formData.scheduled_at
        }

        try {
            if (isEditMode) {
                await updateStory(id, storyData, accessToken)
            } else {
                await createStory(storyData, accessToken)
            }

            navigate("/dashboard/stories")
        } catch (error) {
            setError(
                error.data
                    ? JSON.stringify(error.data)
                    : "Unable to save story."
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
                <div className="animate-pulse">
                    <div className="h-4 w-28 rounded bg-muted" />
                    <div className="mt-4 h-10 w-64 rounded bg-muted" />
                    <div className="mt-3 h-4 w-96 max-w-full rounded bg-muted" />

                    <div className="mt-10 space-y-6">
                        <div className="h-72 rounded-xl bg-muted" />
                        <div className="h-48 rounded-xl bg-muted" />
                        <div className="h-48 rounded-xl bg-muted" />
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
            {/* Page Header */}
            <div className="mb-8">
                <button
                    type="button"
                    onClick={() => navigate("/dashboard/stories")}
                    className="mb-6 inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to My Stories
                </button>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                            Writer Dashboard
                        </p>

                        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                            {isEditMode ? "Edit Story" : "Write a Story"}
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                            {isEditMode
                                ? "Update your story, organization, and publishing settings."
                                : "Turn your ideas into a polished story and publish them on Inkwell."}
                        </p>
                    </div>

                    <div className="hidden items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground sm:flex">
                        <FileText className="h-3.5 w-3.5" />
                        Markdown editor
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Story Content */}
                <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="border-b px-5 py-5 sm:px-6">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-secondary">
                                <FileText className="h-4 w-4" />
                            </div>

                            <div>
                                <h2 className="text-base font-semibold">
                                    Story Content
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Write your story using Markdown.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 p-5 sm:p-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <label
                                htmlFor="title"
                                className="text-sm font-medium"
                            >
                                Title
                            </label>

                            <input
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="Give your story a clear, memorable title"
                                className="w-full rounded-lg border bg-background px-4 py-3.5 text-lg font-medium tracking-tight outline-none transition-all placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/20 sm:text-xl"
                            />
                        </div>

                        {/* Content */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="content"
                                    className="text-sm font-medium"
                                >
                                    Content
                                </label>

                                <span className="text-xs text-muted-foreground">
                                    Markdown supported
                                </span>
                            </div>

                            <div className="overflow-hidden rounded-lg border bg-background">
                                <div data-color-mode="light">
                                    <MDEditor
                                        value={formData.content}
                                        onChange={(value) =>
                                            setFormData((current) => ({
                                                ...current,
                                                content: value || "",
                                            }))
                                        }
                                        height={520}
                                        preview="edit"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Publishing Settings */}
                <section className="rounded-xl border bg-card shadow-sm">
                    <div className="border-b px-5 py-5 sm:px-6">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-secondary">
                                <CalendarClock className="h-4 w-4" />
                            </div>

                            <div>
                                <h2 className="text-base font-semibold">
                                    Publishing Settings
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Choose who can read your story and when it
                                    should be published.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-2">
                        {/* Visibility */}
                        <div className="space-y-2">
                            <label
                                htmlFor="visibility"
                                className="text-sm font-medium"
                            >
                                Visibility
                            </label>

                            <select
                                id="visibility"
                                name="visibility"
                                value={formData.visibility}
                                onChange={handleChange}
                                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
                            >
                                <option value="free">Free</option>
                                <option value="member_only">
                                    Member-only
                                </option>
                            </select>

                            <p className="text-xs leading-5 text-muted-foreground">
                                {formData.visibility === "member_only"
                                    ? "Only premium members can read the full story."
                                    : "Anyone can read this story."}
                            </p>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <label
                                htmlFor="status"
                                className="text-sm font-medium"
                            >
                                Status
                            </label>

                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
                            >
                                <option value="draft">Draft</option>
                                <option value="published">
                                    Published
                                </option>
                                <option value="scheduled">
                                    Scheduled
                                </option>
                            </select>

                            <p className="text-xs leading-5 text-muted-foreground">
                                {formData.status === "scheduled"
                                    ? "Your story will be published automatically at the selected time."
                                    : formData.status === "published"
                                        ? "Your story will be published immediately."
                                        : "Your story will remain private as a draft."}
                            </p>
                        </div>

                        {/* Scheduled Date */}
                        {formData.status === "scheduled" && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 md:col-span-2">
                                <div className="mb-3 flex items-start gap-3">
                                    <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />

                                    <div>
                                        <p className="text-sm font-medium text-amber-900">
                                            Schedule publication
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-amber-800/80">
                                            Select when Inkwell should
                                            automatically publish this story.
                                        </p>
                                    </div>
                                </div>

                                <label
                                    htmlFor="scheduled_at"
                                    className="mb-2 block text-sm font-medium text-amber-950"
                                >
                                    Scheduled date and time
                                </label>

                                <input
                                    id="scheduled_at"
                                    name="scheduled_at"
                                    type="datetime-local"
                                    value={formData.scheduled_at}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                                />
                            </div>
                        )}
                    </div>
                </section>

                {/* Organization */}
                <section className="rounded-xl border bg-card shadow-sm">
                    <div className="border-b px-5 py-5 sm:px-6">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-secondary">
                                <Tag className="h-4 w-4" />
                            </div>

                            <div>
                                <h2 className="text-base font-semibold">
                                    Organization
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Add tags and topics to help organize your
                                    story.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-2">
                        {/* Tags */}
                        <div className="space-y-2">
                            <label
                                htmlFor="tags"
                                className="text-sm font-medium"
                            >
                                Tags
                            </label>

                            <select
                                id="tags"
                                name="tags"
                                multiple
                                value={formData.tags.map(String)}
                                onChange={handleTagChange}
                                className="min-h-36 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
                            >
                                {tags.map((tag) => (
                                    <option key={tag.id} value={tag.id}>
                                        {tag.name}
                                    </option>
                                ))}
                            </select>

                            <p className="text-xs leading-5 text-muted-foreground">
                                Hold Ctrl on Windows or Command on Mac to
                                select multiple tags.
                            </p>
                        </div>

                        {/* Topics */}
                        <div className="space-y-2">
                            <label
                                htmlFor="topics"
                                className="text-sm font-medium"
                            >
                                Topics
                            </label>

                            <select
                                id="topics"
                                name="topics"
                                multiple
                                value={formData.topics.map(String)}
                                onChange={handleTopicChange}
                                className="min-h-36 w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
                            >
                                {topics.map((topic) => (
                                    <option key={topic.id} value={topic.id}>
                                        {topic.name}
                                    </option>
                                ))}
                            </select>

                            <p className="text-xs leading-5 text-muted-foreground">
                                Hold Ctrl on Windows or Command on Mac to
                                select multiple topics.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Error */}
                {error && (
                    <div
                        role="alert"
                        className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-4"
                    >
                        <p className="text-sm font-medium text-destructive">
                            Unable to save your story
                        </p>

                        <p className="mt-1 break-words text-sm leading-5 text-destructive/80">
                            {error}
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="sticky bottom-4 z-30 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur-xl sm:p-3.5">
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            type="button"
                            onClick={() =>
                                navigate("/dashboard/stories")
                            }
                            className="inline-flex h-10 items-center justify-center rounded-lg border bg-background px-4 text-sm font-medium transition-colors hover:bg-secondary"
                        >
                            Cancel
                        </button>

                        <div className="flex flex-col gap-2 sm:flex-row">
                            <div className="hidden items-center gap-2 px-2 text-xs text-muted-foreground sm:flex">
                                <Users className="h-3.5 w-3.5" />

                                {formData.visibility === "member_only"
                                    ? "Premium members"
                                    : "Public readers"}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />

                                {isSubmitting
                                    ? "Saving..."
                                    : isEditMode
                                        ? "Update Story"
                                        : "Save Story"}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </main>
    )
}

export default StoryEditorPage
