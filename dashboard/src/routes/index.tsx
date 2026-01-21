import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles } from "lucide-react"

export const Route = createFileRoute('/')({
    component: Index,
})

function Index() {
    return (
        <div className="relative isolate px-6 pt-14 lg:px-8 overflow-hidden">
            {/* Animated gradients */}
            <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }} />
            </div>

            <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56 text-center">
                <div className="mb-8 flex justify-center">
                    <Badge variant="secondary" className="px-4 py-1.5 flex items-center gap-2 animate-bounce">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span>Introducing Antigravity Template</span>
                    </Badge>
                </div>
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                        Design for the future of Indie Hacking
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-xl mx-auto">
                        The most complete monorepo template with TanStack Router, Shadcn UI, and premium design patterns already baked in.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link to="/dashboard">
                            <Button size="lg" className="h-12 px-8 text-lg gap-2">
                                Launch Dashboard
                                <ArrowRight className="h-5 w-5" />
                            </Button>
                        </Link>
                        <Button variant="ghost" size="lg" className="h-12 px-8 text-lg">
                            Documentation
                        </Button>
                    </div>
                </div>
            </div>

            <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
                <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }} />
            </div>
        </div>
    )
}
