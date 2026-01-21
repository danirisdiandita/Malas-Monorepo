import { Link } from '@tanstack/react-router'
import { Button } from "@/components/ui/button"
import { LayoutDashboard, LogOut } from "lucide-react"
import { GoogleLoginButton } from './GoogleLoginButton'
import { useSession } from '../store/authStore'

export function Navbar() {
    const { user, isAuthenticated, logout } = useSession()

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-2 hover:opacity-90">
                        <div className="bg-primary p-1.5 rounded-lg text-primary-foreground">
                            <LayoutDashboard className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">ANTIGRAVITY</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-6">
                        <Link
                            to="/"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary [&.active]:text-foreground [&.active]:font-bold"
                        >
                            Home
                        </Link>
                        <Link
                            to="/dashboard"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary [&.active]:text-foreground [&.active]:font-bold"
                        >
                            Dashboard
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <img src={user?.picture} alt={user?.name} className="h-8 w-8 rounded-full border" />
                                <span className="text-sm font-medium hidden sm:inline-block">{user?.name}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline-block">Logout</span>
                            </Button>
                        </div>
                    ) : (
                        <GoogleLoginButton />
                    )}
                    <Link to="/dashboard">
                        <Button size="sm">
                            Get Started
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    )
}
