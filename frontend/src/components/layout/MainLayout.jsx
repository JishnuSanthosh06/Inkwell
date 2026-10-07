import { Outlet } from "react-router-dom"
import Header from "./Header"

function MainLayout() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />

            <main className="mx-auto w-full max-w-6xl px-4 py-8">
                <Outlet />
            </main>
        </div>
    )
}

export default MainLayout