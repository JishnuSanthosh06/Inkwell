import apiClient from "./client"

export const getStories = () => {
    return apiClient("/stories/discover/")
}

export const getPersonalizedFeed = (accessToken) =>
    apiClient("/stories/feed/", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })

export const getStory = (id, accessToken) =>
    apiClient(`/stories/read/${id}/`, {
        headers: accessToken
            ? {
                  Authorization: `Bearer ${accessToken}`,
              }
            : {},
    })

export const getMyStories = (accessToken) => {
    return apiClient("/stories/", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })
}

export const createStory = (storyData, accessToken) => {
    return apiClient("/stories/", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(storyData),
    })
}

export const getMyStory = (id, accessToken) => {
    return apiClient(`/stories/${id}/`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })
}

export const updateStory = (id, storyData, accessToken) => {
    return apiClient(`/stories/${id}/`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(storyData),
    })
}

export const getTags = (accessToken) => {
    return apiClient("/stories/tags/", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })
}

export const getTopics = (accessToken) => {
    return apiClient("/stories/topics/", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })
}

export const clapStory = (id, accessToken) => {
    return apiClient(`/stories/${id}/clap/`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })
}

export const getComments = (storyId, accessToken) => {
    return apiClient(`/stories/${storyId}/comments/`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })
}

export const createComment = (storyId, content, accessToken, parentId = null) => {
    return apiClient(`/stories/${storyId}/comments/`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            content,
            parent: parentId,
        }),
    })
}

export const updateComment = (commentId, content, accessToken) => {
    return apiClient(`/stories/comments/${commentId}/`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            content,
        }),
    })
}

export const deleteComment = (commentId, accessToken) => {
    return apiClient(`/stories/comments/${commentId}/`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })
}


export const getReadingList = (accessToken) =>
    apiClient("/stories/reading-list/", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })

export const addToReadingList = (storyId, accessToken) =>
    apiClient("/stories/reading-list/", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            story: storyId,
        }),
    })

export const removeFromReadingList = (storyId, accessToken) =>
    apiClient(`/stories/reading-list/${storyId}/`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })

export const followUser = (userId, accessToken) =>
    apiClient("/stories/follow/", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            following: userId,
        }),
    })

export const unfollowUser = (userId, accessToken) =>
    apiClient(`/stories/follow/${userId}/`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })

export const getWriterProfile = (username, accessToken) =>
    apiClient(`/profile/writers/${username}/`, {
        headers: accessToken
            ? {
                  Authorization: `Bearer ${accessToken}`,
              }
            : {},
    })