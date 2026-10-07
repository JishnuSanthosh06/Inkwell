import { BrowserRouter, Route, Routes } from "react-router-dom"

import HomePage from "@/pages/HomePage"
import LoginPage from "@/pages/LoginPage"
import RegisterPage from "@/pages/RegisterPage"
import StoryReaderPage from "@/pages/StoryReaderPage"
import WriterDashboardPage from "@/pages/WriterDashboardPage"
import WriterStoriesPage from "@/pages/WriterStoriesPage"
import StoryEditorPage from "@/pages/StoryEditorPage"
import ReadingListPage from "@/pages/ReadingListPage"
import WriterProfilePage from "@/pages/WriterProfilePage"
import SubscriptionPage from "@/pages/SubscriptionPage"
import PersonalizedFeedPage from "@/pages/PersonalizedFeedPage"
import ProfilePage from "@/pages/ProfilePage"

import MainLayout from "@/components/layout/MainLayout"

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element = {<MainLayout />}>
                    <Route path="/" element={<HomePage />}/>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/stories/:id" element={<StoryReaderPage />} />
                    <Route path="/feed" element={<PersonalizedFeedPage />} />
                    <Route path="/dashboard" element={<WriterDashboardPage />} />
                    <Route path="/dashboard/stories" element={<WriterStoriesPage />} />
                    <Route path="/dashboard/stories/new" element={<StoryEditorPage />} />
                    <Route path="/dashboard/stories/:id/edit" element={<StoryEditorPage />} />
                    <Route path="/dashboard/reading-list" element={<ReadingListPage />} />
                    <Route path="/writers/:username" element={<WriterProfilePage />} />
                    <Route path="/subscription" element={<SubscriptionPage />} />
                    <Route path="/profile" element={<ProfilePage />} />

                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes