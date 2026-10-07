import apiClient from "./client"

export const registerUser = (userData) => {
    return apiClient("/auth/register/", {
        method: "POST",
        body: JSON.stringify(userData),
    })
}

export const loginUser = (credentials) => {
    return apiClient("/auth/login/", {
        method: "POST",
        body: JSON.stringify(credentials),
    })
}

export const refreshToken = (refresh) => {
    return apiClient("/auth/token/refresh/", {
        method: "POST",
        body: JSON.stringify({ refresh }),
    })
}

export const getCurrentUser = (accessToken) => {
    return apiClient("/auth/me/", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })
}