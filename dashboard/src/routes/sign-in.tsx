import { ArrowLeft, Check, Coffee, Layers, LockKeyhole, Sparkles } from 'lucide-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { AppleLoginButton, GoogleLoginButton } from '../components/GoogleLoginButton'

export const Route = createFileRoute('/sign-in')({ component: SignIn })

function SignIn() {
    return <div className="min-h-screen bg-[#0A0A0A] text-white md:grid md:grid-cols-[minmax(420px,610px)_1fr]">
        <aside className="relative hidden min-h-screen overflow-hidden bg-[#A855F7] px-8 py-12 text-[#0A0A0A] md:block lg:px-16">
            <div className="flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2.5"><span className="flex h-[38px] w-[38px] items-center justify-center rounded-lg bg-[#0A0A0A]"><Coffee className="h-5 w-5 text-[#A855F7]" /></span><span className="font-mono text-lg font-bold tracking-tight">MALAS/</span></Link>
                <span className="font-mono text-[10px] font-bold tracking-[.7px] text-black/60">AUTH / 01</span>
            </div>
            <div className="absolute left-8 right-8 top-1/4 max-w-[470px] lg:left-16 lg:right-auto">
                <div className="mb-6 inline-flex items-center gap-2 rounded bg-white/15 px-3 py-2 font-mono text-[10px] font-bold tracking-[.6px] outline outline-1 outline-black/20"><Sparkles className="h-4 w-4" /> WELCOME BACK, BUILDER</div>
                <h1 className="text-5xl font-bold leading-none tracking-[-3px] lg:text-6xl">More shipping.<br />Less setup.</h1>
                <p className="mt-6 max-w-[420px] text-[17px] font-medium leading-6 text-black/80">Masuk dan lanjutkan dari tempat terakhir. Stack-mu sudah siap — tanpa config ulang, tanpa drama.</p>
            </div>
            <div className="absolute bottom-24 left-8 space-y-3 font-mono text-[11px] font-bold lg:left-16"><TrustPoint text="Secure OAuth authentication" /><TrustPoint text="No passwords stored" /><TrustPoint text="One account across every workspace" /></div>
            <div className="absolute bottom-10 left-8 font-mono text-[10px] font-bold tracking-[.6px] text-black/50 lg:left-16">MALAS MONOREPO © 2025</div>
        </aside>

        <main className="relative flex min-h-screen items-center px-6 py-12 sm:px-12 lg:px-24">
            <div className="mx-auto w-full max-w-[530px]">
                <div className="mb-16 flex items-center justify-between font-mono text-[10px] font-bold tracking-[.6px] text-[#A1A1AA]"><Link to="/" className="flex items-center gap-2 hover:text-white"><ArrowLeft className="h-4 w-4" /> BACK TO HOME</Link><span className="hidden sm:block">NEED HELP?</span></div>
                <div className="mb-7"><div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold tracking-[.8px] text-[#A855F7]"><span className="h-0.5 w-6 bg-[#A855F7]" /> ACCOUNT ACCESS</div><h2 className="text-4xl tracking-[-2px] sm:text-[46px]">Sign in to Malas</h2><p className="mt-3 text-base leading-6 text-[#A1A1AA]">Choose your preferred account to continue. We’ll create a profile automatically if you’re new here.</p></div>
                <div className="space-y-3"><GoogleLoginButton /><AppleLoginButton /></div>
                <div className="mt-7 flex gap-2.5 text-xs leading-[18px] text-[#71717A]"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" /><p>By continuing, you agree to the Terms of Service and Privacy Policy. Your authentication is securely handled by OAuth.</p></div>
                <div className="mt-12 flex items-center gap-3 rounded-lg border border-[#27272A] bg-[#111113] p-4"><span className="flex h-[38px] w-[38px] items-center justify-center rounded bg-[#A855F7]/10"><Layers className="h-5 w-5 text-[#A855F7]" /></span><div><p className="text-[13px]">One login, every project</p><p className="text-xs text-[#A1A1AA]">Your Golang API and Vite app, one workspace.</p></div></div>
                <div className="mt-16 flex justify-between font-mono text-[9px] font-bold tracking-[.5px]"><span className="text-[#BEF264]">● ALL SYSTEMS OPERATIONAL</span><span className="text-[#52525B]">256-BIT ENCRYPTED</span></div>
            </div>
        </main>
    </div>
}

function TrustPoint({ text }: { text: string }) { return <div className="flex items-center gap-2.5"><span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#0A0A0A]"><Check className="h-3.5 w-3.5 text-[#A855F7]" /></span>{text}</div> }
