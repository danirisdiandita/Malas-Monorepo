import { Link } from '@tanstack/react-router'
import { Button } from "@/components/ui/button"
import { Coffee, LogOut } from "lucide-react"
import { GoogleLoginButton } from './GoogleLoginButton'
import { useSession } from '../store/authStore'

export function Navbar() {
    const { user, isAuthenticated, logout } = useSession()

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                        <div className="bg-primary p-2 rounded-xl text-primary-foreground shadow-sm shadow-primary/20">
                            <Coffee className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Malas Monorepo
                        </span>
                    </Link>
                    <div className="hidden md:flex items-center gap-1">
                        <Link
                            to="/"
                            className="px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-primary hover:bg-secondary/50 rounded-md [&.active]:text-foreground [&.active]:bg-secondary"
                        >
                            Home
                        </Link>
                        <Link
                            to="/dashboard"
                            className="px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-primary hover:bg-secondary/50 rounded-md [&.active]:text-foreground [&.active]:bg-secondary"
                        >
                            Dashboard
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isAuthenticated ? (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 pl-2 border-l">
                                <img src={user?.picture} alt={user?.name} className="h-8 w-8 rounded-full border shadow-sm" />
                                <span className="text-sm font-semibold hidden sm:inline-block">{user?.name}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={logout} className="h-9 px-3 gap-2 hover:bg-destructive/10 hover:text-destructive">
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline-block font-medium">Logout</span>
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <GoogleLoginButton />
                            <Link to="/dashboard">
                                <Button size="sm" className="h-9 px-4 font-semibold shadow-sm">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>

    )
}
