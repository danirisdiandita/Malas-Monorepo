import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Terminal, Code2, Rocket, Zap } from "lucide-react"

export const Route = createFileRoute('/')({
    component: Index,
})

function Index() {
    return (
        <div className="relative min-h-screen bg-background flex flex-col items-center justify-center overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-purple-500/10 rounded-full blur-[100px]" />
            </div>

            <main className="relative z-10 container px-6 py-24 text-center sm:py-32">
                <div className="flex justify-center mb-8">
                    <Badge variant="outline" className="px-4 py-2 bg-secondary/50 backdrop-blur-sm border-primary/20 text-primary animate-in fade-in slide-in-from-bottom-3 duration-1000">
                        <Terminal className="w-4 h-4 mr-2" />
                        <span>The Ultimate Monorepo Stack</span>
                    </Badge>
                </div>

                <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl mb-6 bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-transparent">
                    Malas Monorepo
                </h1>

                <p className="max-w-[42rem] mx-auto text-xl text-muted-foreground sm:text-2xl mb-10 leading-relaxed">
                    Budayakan Malas ngoding. <br />
                    <span className="text-foreground/80">Simple, nggak ribet, dan elegan. Fokus pada produk Anda, biar kami yang urus boilerplate-nya.</span>
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link to="/dashboard">
                        <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300">
                            Launch Dashboard
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                    <Button variant="outline" size="lg" className="h-14 px-10 text-lg rounded-full backdrop-blur-sm hover:bg-secondary/80">
                        View Components
                    </Button>
                </div>

                <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3 text-left max-w-4xl mx-auto border-t border-border pt-12">
                    <div className="space-y-2">
                        <div className="p-2 w-fit rounded-md bg-primary/10 text-primary">
                            <Code2 className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold">Typed Everywhere</h3>
                        <p className="text-sm text-muted-foreground">Type-safe routes & API calls with TanStack.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="p-2 w-fit rounded-md bg-primary/10 text-primary">
                            <Zap className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold">Ultra Fast</h3>
                        <p className="text-sm text-muted-foreground">Powered by Vite & Go for near-instant DX.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="p-2 w-fit rounded-md bg-primary/10 text-primary">
                            <Rocket className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold">Ready to Scale</h3>
                        <p className="text-sm text-muted-foreground">Modular architecture for serious projects.</p>
                    </div>
                </div>
            </main>

            {/* Grid Pattern Background */}
            <div className="absolute inset-0 -z-20 h-full w-full bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>
    )
}

