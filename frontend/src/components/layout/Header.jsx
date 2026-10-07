import { Link, useLocation, useNavigate } from "react-router-dom"
import {
    BookOpen,
    Crown,
    LayoutDashboard,
    LogOut,
    User,
    Rss,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

function Header() {
    const location = useLocation()
    const navigate = useNavigate()

    const accessToken = localStorage.getItem("access_token")

    const handleLogout = () => {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")

        navigate("/login")
    }

    const isActive = (path) => location.pathname === path

    const isDashboardActive =
        location.pathname === "/dashboard" ||
        location.pathname.startsWith("/dashboard/")

    return (
        <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-xl">
            <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-3 px-4">
                {/* Brand */}
                <Link
                    to="/"
                    className="group flex shrink-0 items-center gap-2"
                    aria-label="Inkwell home"
                >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform duration-200 group-hover:scale-[1.03]">
                        <BookOpen className="h-4 w-4" />
                    </span>

                    <span className="text-xl font-bold tracking-tight">
                        Inkwell
                    </span>
                </Link>

                {/* Navigation */}
                <nav
                    aria-label="Main navigation"
                    className="ml-auto min-w-0 overflow-x-auto scrollbar-none"
                >
                    <div className="flex min-w-max items-center gap-1">
                        {!accessToken ? (
                            <>
                                <Link
                                    to="/login"
                                    className={cn(
                                        buttonVariants({
                                            variant: isActive("/login")
                                                ? "secondary"
                                                : "ghost",
                                            size: "sm",
                                        })
                                    )}
                                >
                                    Login
                                </Link>

                                <Link
                                    to="/register"
                                    className={cn(
                                        buttonVariants({
                                            size: "sm",
                                        })
                                    )}
                                >
                                    Register
                                </Link>
                            </>
                        ) : (
                            <>
                                {/* Feed */}
                                <Link
                                    to="/feed"
                                    aria-current={
                                        isActive("/feed")
                                            ? "page"
                                            : undefined
                                    }
                                    className={cn(
                                        buttonVariants({
                                            variant: isActive("/feed")
                                                ? "secondary"
                                                : "ghost",
                                            size: "sm",
                                        }),
                                        "gap-2"
                                    )}
                                >
                                    <Rss className="h-4 w-4" />
                                    <span className="hidden md:inline">
                                        Feed
                                    </span>
                                </Link>

                                {/* Reading List */}
                                <Link
                                    to="/dashboard/reading-list"
                                    aria-current={
                                        isActive(
                                            "/dashboard/reading-list"
                                        )
                                            ? "page"
                                            : undefined
                                    }
                                    className={cn(
                                        buttonVariants({
                                            variant: isActive(
                                                "/dashboard/reading-list"
                                            )
                                                ? "secondary"
                                                : "ghost",
                                            size: "sm",
                                        }),
                                        "gap-2"
                                    )}
                                >
                                    <BookOpen className="h-4 w-4" />
                                    <span className="hidden md:inline">
                                        Reading List
                                    </span>
                                </Link>

                                {/* Dashboard */}
                                <Link
                                    to="/dashboard"
                                    aria-current={
                                        isDashboardActive
                                            ? "page"
                                            : undefined
                                    }
                                    className={cn(
                                        buttonVariants({
                                            variant: isDashboardActive
                                                ? "secondary"
                                                : "ghost",
                                            size: "sm",
                                        }),
                                        "gap-2"
                                    )}
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span className="hidden md:inline">
                                        Dashboard
                                    </span>
                                </Link>

                                {/* Premium */}
                                <Link
                                    to="/subscription"
                                    aria-current={
                                        isActive("/subscription")
                                            ? "page"
                                            : undefined
                                    }
                                    className={cn(
                                        buttonVariants({
                                            variant: isActive(
                                                "/subscription"
                                            )
                                                ? "secondary"
                                                : "ghost",
                                            size: "sm",
                                        }),
                                        "gap-2"
                                    )}
                                >
                                    <Crown className="h-4 w-4" />
                                    <span className="hidden md:inline">
                                        Premium
                                    </span>
                                </Link>

                                {/* Profile */}
                                <Link
                                    to="/profile"
                                    aria-current={
                                        isActive("/profile")
                                            ? "page"
                                            : undefined
                                    }
                                    className={cn(
                                        buttonVariants({
                                            variant: isActive("/profile")
                                                ? "secondary"
                                                : "ghost",
                                            size: "sm",
                                        }),
                                        "gap-2"
                                    )}
                                >
                                    <User className="h-4 w-4" />
                                    <span className="hidden md:inline">
                                        Profile
                                    </span>
                                </Link>

                                {/* Logout */}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleLogout}
                                    className="ml-1 gap-2"
                                >
                                    <LogOut className="h-4 w-4" />

                                    <span className="hidden sm:inline">
                                        Logout
                                    </span>
                                </Button>
                            </>
                        )}
                    </div>
                </nav>
            </div>
        </header>
    )
}

export default Header
