import { useQuery } from "@tanstack/react-query";
import { getStories } from "@/api/stories";

export const useStories = () => {
    return useQuery( {
        queryKey: ['stories'],
        queryFn : getStories,
    })
}