import { Link } from '@tanstack/react-router'
import { Button } from "@/components/ui/button"
import { LayoutDashboard } from "lucide-react"

export function Navbar() {
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
                    <Button variant="ghost" size="sm">
                        Sign In
                    </Button>
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
