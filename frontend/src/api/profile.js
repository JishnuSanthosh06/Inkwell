import apiClient from "./client"

export const getProfile = (accessToken) =>
    apiClient("/profile/", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })

export const updateProfile = (profileData, accessToken) => {
    const formData = new FormData()

    if (profileData.bio !== undefined) {
        formData.append("bio", profileData.bio)
    }

    if (profileData.profile_image) {
        formData.append(
            "profile_image",
            profileData.profile_image
        )
    }

    return apiClient("/profile/", {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
    })
}
