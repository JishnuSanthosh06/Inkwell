import { useQuery } from "@tanstack/react-query"
import { getMyStories } from "@/api/stories"

export const useMyStories = () => {
    const accessToken = localStorage.getItem("access_token")

    return useQuery({
        queryKey: ["my-stories"],
        queryFn: () => getMyStories(accessToken),
        enabled: Boolean(accessToken),
    })
}
