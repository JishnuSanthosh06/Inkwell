import { useQuery } from "@tanstack/react-query"
import { getCurrentUser } from "@/api/auth"

export const useCurrentUser = () => {
    const accessToken = localStorage.getItem("access_token")

    return useQuery({
        queryKey: ["current-user"],
        queryFn: () => getCurrentUser(accessToken),
        enabled: Boolean(accessToken),
    })
}