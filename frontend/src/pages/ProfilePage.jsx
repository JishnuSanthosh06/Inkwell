import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import {
CheckCircle2,
Crown,
ImagePlus,
Save,
User,
} from "lucide-react"
import { getProfile, updateProfile } from "@/api/profile"

const API_SERVER_URL = "http://127.0.0.1:8000"

function ProfilePage() {
const accessToken = localStorage.getItem("access_token")
const queryClient = useQueryClient()


const [bio, setBio] = useState("")
const [profileImage, setProfileImage] = useState(null)

const {
    data: profile,
    isLoading,
    isError,
} = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(accessToken),
    enabled: Boolean(accessToken),
})

useEffect(() => {
    if (profile) {
        setBio(profile.bio || "")
    }
}, [profile])

const updateMutation = useMutation({
    mutationFn: (profileData) =>
        updateProfile(profileData, accessToken),

    onSuccess: () => {
        queryClient.invalidateQueries({
            queryKey: ["profile"],
        })
    },
})

if (!accessToken) {
    return (
        <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
            <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center shadow-sm sm:p-10">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border bg-secondary">
                    <User className="h-6 w-6 text-muted-foreground" />
                </div>

                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    Account
                </p>

                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                    Profile
                </h1>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Please log in to view and manage your profile.
                </p>
            </div>
        </main>
    )
}

if (isLoading) {
    return (
        <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
            <div className="animate-pulse">
                <div className="h-3 w-20 rounded bg-muted" />
                <div className="mt-3 h-10 w-52 rounded bg-muted" />
                <div className="mt-3 h-4 w-80 max-w-full rounded bg-muted" />

                <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_2fr]">
                    <div className="h-72 rounded-2xl bg-muted" />
                    <div className="h-96 rounded-2xl bg-muted" />
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
                    Unable to load profile
                </h1>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Something went wrong while loading your profile.
                    Please try again later.
                </p>
            </div>
        </main>
    )
}

const handleSubmit = (event) => {
    event.preventDefault()

    updateMutation.mutate({
        bio,
        profile_image: profileImage,
    })
}

const profileImageUrl = profile.profile_image
    ? profile.profile_image.startsWith("http")
        ? profile.profile_image
        : `${API_SERVER_URL}${profile.profile_image}`
    : null

const initial =
    profile.username?.charAt(0)?.toUpperCase() || "U"

return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
        {/* Page Header */}
        <div className="mb-8 border-b pb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                Account
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                My Profile
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Manage the information readers see on your public profile.
            </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            {/* Profile Summary */}
            <section className="h-fit overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className="h-2 bg-primary" />

                <div className="p-6 sm:p-7">
                    <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border bg-secondary">
                            {profileImageUrl ? (
                                <img
                                    src={profileImageUrl}
                                    alt={`${profile.username}'s profile`}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-2xl font-semibold">
                                    {initial}
                                </span>
                            )}
                        </div>

                        <div className="mt-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                                Inkwell Member
                            </p>

                            <h2 className="mt-2 text-xl font-bold tracking-tight">
                                {profile.username}
                            </h2>

                            <p className="mt-1 break-all text-sm text-muted-foreground">
                                {profile.email}
                            </p>
                        </div>
                    </div>

                    {/* Premium Status */}
                    <div className="mt-7 rounded-xl border bg-secondary/60 p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
                                <Crown className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-sm font-semibold">
                                    Premium Membership
                                </p>

                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Your current subscription status
                                </p>
                            </div>

                            <span
                                className={`ml-auto shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                    profile.has_active_premium
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : "border-border bg-background text-muted-foreground"
                                }`}
                            >
                                {profile.has_active_premium
                                    ? "Active"
                                    : "Inactive"}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Edit Profile */}
            <section className="rounded-2xl border bg-card shadow-sm">
                <div className="border-b px-5 py-5 sm:px-7">
                    <h2 className="text-base font-semibold">
                        Profile Information
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Update your bio and profile image.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-7 p-5 sm:p-7"
                >
                    {/* Bio */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                            <label
                                htmlFor="bio"
                                className="text-sm font-medium"
                            >
                                Bio
                            </label>

                            <span className="text-xs text-muted-foreground">
                                Public
                            </span>
                        </div>

                        <textarea
                            id="bio"
                            value={bio}
                            onChange={(event) =>
                                setBio(event.target.value)
                            }
                            placeholder="Tell readers a little about yourself"
                            rows={6}
                            className="w-full resize-y rounded-lg border bg-background px-4 py-3 text-sm leading-6 outline-none transition-all placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/20"
                        />

                        <p className="text-xs leading-5 text-muted-foreground">
                            Your bio may be shown on your public writer
                            profile.
                        </p>
                    </div>

                    {/* Profile Image */}
                    <div className="space-y-3">
                        <div>
                            <label
                                htmlFor="profile-image"
                                className="text-sm font-medium"
                            >
                                Profile Image
                            </label>

                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                Choose an image to represent your profile.
                            </p>
                        </div>

                        <label
                            htmlFor="profile-image"
                            className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed bg-background p-4 transition-colors hover:bg-secondary/50"
                        >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-secondary">
                                <ImagePlus className="h-5 w-5 text-muted-foreground" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-sm font-medium">
                                    Choose image
                                </p>

                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                    {profileImage
                                        ? profileImage.name
                                        : "Select a JPG, PNG, or other image file"}
                                </p>
                            </div>

                            <input
                                id="profile-image"
                                type="file"
                                accept="image/*"
                                onChange={(event) =>
                                    setProfileImage(
                                        event.target.files?.[0] || null
                                    )
                                }
                                className="sr-only"
                            />
                        </label>

                        {profileImage && (
                            <p className="text-xs text-muted-foreground">
                                Selected:{" "}
                                <span className="font-medium text-foreground">
                                    {profileImage.name}
                                </span>
                            </p>
                        )}
                    </div>

                    {/* Save */}
                    <div className="border-t pt-6">
                        <button
                            type="submit"
                            disabled={updateMutation.isPending}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />

                            {updateMutation.isPending
                                ? "Saving..."
                                : "Save Profile"}
                        </button>
                    </div>
                </form>

                {/* Success */}
                {updateMutation.isSuccess && (
                    <div className="mx-5 mb-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:mx-7 sm:mb-7">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />

                        <span>
                            Profile updated successfully.
                        </span>
                    </div>
                )}

                {/* Error */}
                {updateMutation.isError && (
                    <div
                        role="alert"
                        className="mx-5 mb-5 rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive sm:mx-7 sm:mb-7"
                    >
                        Unable to update profile. Please try again.
                    </div>
                )}
            </section>
        </div>
    </main>
)


}

export default ProfilePage
