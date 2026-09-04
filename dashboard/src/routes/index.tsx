import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, ChevronRight, Code2, Coffee, GitBranch, Terminal, Zap } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export const Route = createFileRoute('/')({ component: Landing })

function Landing() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    const destination = isAuthenticated ? '/dashboard' : '/sign-in'

    return (
        <div className="min-h-screen overflow-hidden bg-[#0A0A0A] text-white">
            <section className="relative min-h-[620px] bg-[#A855F7] text-[#0A0A0A]">
                <nav className="absolute inset-x-0 top-0 z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-7 lg:px-10">
                    <Link to="/" className="flex items-center gap-2.5"><span className="flex h-[38px] w-[38px] items-center justify-center rounded-lg bg-[#0A0A0A]"><Coffee className="h-5 w-5 text-[#A855F7]" /></span><span className="font-mono text-lg font-bold">MALAS/</span></Link>
                    <div className="hidden items-center gap-7 font-sans text-sm font-semibold md:flex"><a href="#product">Product</a><a href="#components">Components</a><a href="#docs">Docs</a></div>
                    <Link to={destination} className="inline-flex items-center gap-2 rounded-full bg-[#0A0A0A] px-4 py-2.5 font-mono text-xs font-bold text-white">{isAuthenticated ? 'DASHBOARD' : 'GET STARTED'} <ArrowRight className="h-4 w-4" /></Link>
                </nav>
                <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pb-24 pt-32 lg:grid-cols-[1fr_540px] lg:px-10 lg:pt-36">
                    <div className="max-w-[650px] self-start">
                        <div className="mb-6 inline-flex items-center gap-2 rounded bg-white/20 px-3 py-2 font-mono text-[11px] font-bold tracking-[0.6px] outline outline-1 outline-black/20">
                            <span className="h-2 w-2 rounded-full bg-[#BEF264]" />
                            V1.0 — THE LAZY STACK IS LIVE
                        </div>
                        <h1 className="text-6xl font-bold leading-[.9] tracking-[-4px] sm:text-8xl">Build less.<br />Ship more.</h1>
                        <p className="mt-7 max-w-xl text-lg font-medium leading-7 text-black/80">Monorepo Golang + Vite yang sudah siap tempur. Backend ringan, frontend super cepat, dan sengaja dibuat agar kamu fokus ke produk.</p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link to={destination} className="inline-flex items-center gap-2 rounded-full bg-[#0A0A0A] px-5 py-3 font-mono text-xs font-bold text-white">{isAuthenticated ? 'OPEN DASHBOARD' : 'START BUILDING'} <ArrowRight className="h-4 w-4" /></Link>
                            <a href="https://github.com/danirisdiandita/malas-monorepo" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full px-5 py-3 font-mono text-xs font-bold outline outline-1 outline-[#0A0A0A]"><GitBranch className="h-4 w-4" /> VIEW GITHUB</a>
                        </div>
                    </div>
                    <PreviewCard />
                </div>
                <span className="absolute bottom-8 right-10 font-mono text-xs font-bold text-black/60">01</span>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
                <div className="grid gap-12 lg:grid-cols-[380px_1fr]">
                    <div>
                        <div className="mb-3 flex items-center gap-2 font-mono text-[11px] font-bold tracking-[0.7px] text-[#A855F7]"><span className="h-0.5 w-7 bg-[#A855F7]" /> DESIGNED FOR MOMENTUM</div>
                        <h2 className="text-3xl leading-tight tracking-tight sm:text-4xl">Everything you need.<br />Nothing you don’t.</h2>
                    </div>
                    <div className="grid gap-8 sm:grid-cols-3">
                        <Feature number="01" title="Go-powered API" text="Kontrak API Go dan frontend Vite tetap jelas, cepat, dan mudah dirawat." />
                        <Feature number="02" title="Vite-fast frontend" text="Vite HMR di frontend, binary Go yang ringan di backend." />
                        <Feature number="03" title="Scales cleanly" text="Pisahkan web dan API tanpa kehilangan workflow satu repo." />
                    </div>
                </div>
                <div className="mt-20 grid gap-6 border-t border-[#27272A] pt-6 sm:grid-cols-4">
                    <Stat value="GO" label="BACKEND" /><Stat value="&lt; 1s" label="VITE HMR" /><Stat value="02" label="APPS, ONE REPO" /><Stat value="0" label="BORING SETUP" />
                </div>
            </section>
        </div>
    )
}

function PreviewCard() {
    return <div className="overflow-hidden rounded-lg border border-white/10 bg-[#111113] text-white shadow-2xl shadow-black/50 lg:mt-[-6px]">
        <div className="flex h-14 items-center justify-between border-b border-[#27272A] px-5 font-mono text-[11px] text-[#A1A1AA]"><div className="flex gap-2"><i className="h-2 w-2 rounded-full bg-[#FB7185]" /><i className="h-2 w-2 rounded-full bg-[#FBBF24]" /><i className="h-2 w-2 rounded-full bg-[#BEF264]" /></div>workspace · go + vite<ChevronRight className="h-4 w-4 rotate-90" /></div>
        <div className="grid grid-cols-[24px_1fr] gap-4 bg-[#0D0D0F] p-6 font-mono text-xs leading-[22px]"><div className="text-right text-[#52525B]">01<br />02<br />03<br />04<br />05<br />06<br />07<br />08<br />09</div><div><div className="text-[#BEF264]">$ moon run :dev</div><br /><div>✓ web Vite ready on :5173</div><div>✓ api Go ready on :8080</div><br /><div className="text-[#A855F7]">apps/</div><div className="text-[#60A5FA]">├── api/ main.go</div><div className="text-[#60A5FA]">└── dashboard/ vite.config.ts</div><div className="text-[#71717A]">ready in 0.8s — ship it.</div></div></div>
        <div className="space-y-4 border-t border-[#27272A] p-6"><div className="flex items-center justify-between font-mono text-[11px] font-bold"><span className="flex items-center gap-2"><Terminal className="h-4 w-4 text-[#BEF264]" /> BUILD STATUS</span><span className="text-[#BEF264]">0.8s</span></div><div className="h-1 rounded-full bg-[#27272A]"><div className="h-full w-[87%] rounded-full bg-[#BEF264]" /></div><div className="flex flex-wrap gap-2 font-mono text-[9px] font-bold text-[#A1A1AA]"><span className="rounded border border-[#27272A] bg-[#18181B] px-2 py-2"><Code2 className="mr-1 inline h-3.5 w-3.5" /> GOLANG</span><span className="rounded border border-[#27272A] bg-[#18181B] px-2 py-2"><Zap className="mr-1 inline h-3.5 w-3.5" /> VITE</span><span className="rounded border border-[#27272A] bg-[#18181B] px-2 py-2"><GitBranch className="mr-1 inline h-3.5 w-3.5" /> MONOREPO</span></div></div>
    </div>
}

function Feature({ number, title, text }: { number: string; title: string; text: string }) { return <div><div className="mb-2 font-mono text-[11px] font-bold text-[#A855F7]">{number}</div><h3 className="text-lg">{title}</h3><p className="mt-2 text-sm leading-5 text-[#A1A1AA]">{text}</p></div> }
function Stat({ value, label }: { value: string; label: string }) { return <div className="flex items-center gap-3"><span className="font-mono text-[22px] font-bold">{value}</span><span className="font-mono text-[10px] font-bold tracking-[0.6px] text-[#A1A1AA]">{label}</span></div> }
