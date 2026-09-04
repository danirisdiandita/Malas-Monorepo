import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router'
import { Activity, ArrowUpRight, Coffee, LogOut, Target, Users, Zap } from 'lucide-react'
import { useUser } from '../../hooks/useUser'
import { config } from '../../lib/config'
import { fetchWithAuth } from '../../lib/fetch'
import { useAuthStore } from '../../store/authStore'

export const Route = createFileRoute('/dashboard/')({
    beforeLoad: async () => {
        const response = await fetchWithAuth(`${config.apiUrl}/auth/user`)
        if (!response.ok) {
            useAuthStore.getState().logout()
            throw redirect({ to: '/sign-in' })
        }
        useAuthStore.getState().setAuth(await response.json())
    },
    component: Dashboard,
})

const metrics = [
    { label: 'TOTAL USERS', value: '1,234', change: '+12.5%', icon: Users },
    { label: 'ACTIVE SESSIONS', value: '56', change: '+5.2%', icon: Activity },
    { label: 'CONVERSION RATE', value: '12.5%', change: '+1.4%', icon: Target },
    { label: 'SYSTEM HEALTH', value: '99.9%', change: 'STABLE', icon: Zap },
]

function Dashboard() {
    const { data: user, isLoading, error } = useUser()
    const { logout } = useAuthStore()
    const router = useRouter()

    const handleLogout = async () => {
        await fetchWithAuth(`${config.apiUrl}/auth/logout`).catch(() => undefined)
        logout()
        await router.navigate({ to: '/sign-in' })
    }

    if (isLoading) return <div className="min-h-screen bg-[#0A0A0A] p-8 font-mono text-sm text-[#BEF264]">LOADING WORKSPACE...</div>
    if (error) return <div className="min-h-screen bg-[#0A0A0A] p-8 font-mono text-sm text-[#FB7185]">ERROR: {error.message}</div>

    return (
        <div className="min-h-screen overflow-hidden bg-[#0A0A0A] text-white">
            <header className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-7 sm:px-10">
                <Link to="/" className="flex items-center gap-2.5 text-[#A855F7]"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#A855F7] text-[#0A0A0A]"><Coffee size={19} /></span><span className="font-mono text-lg font-bold tracking-[-0.5px]">MALAS/</span></Link>
                <div className="flex items-center gap-4 font-mono text-[10px] font-bold tracking-[0.6px] text-[#A1A1AA]"><span className="hidden sm:inline">WORKSPACE / 01</span><button onClick={handleLogout} className="flex items-center gap-2 rounded-full border border-[#27272A] px-3 py-2 transition hover:border-[#A855F7] hover:text-white"><LogOut size={13} /> LOG OUT</button></div>
            </header>

            <main className="mx-auto max-w-[1280px] px-6 pb-12 sm:px-10">
                <section className="relative mb-8 overflow-hidden rounded-lg bg-[#A855F7] px-7 py-9 text-[#0A0A0A] shadow-[0_12px_32px_#00000055] sm:px-10 sm:py-12"><div className="relative z-10 max-w-2xl"><div className="mb-5 inline-flex items-center gap-2 rounded border border-[#0A0A0A33] bg-white/20 px-3 py-2 font-mono text-[10px] font-bold tracking-[0.7px]"><span className="h-2 w-2 rounded-full bg-[#BEF264]" /> YOUR WORKSPACE IS LIVE</div><h1 className="text-5xl font-bold leading-[0.95] tracking-[-2.8px] sm:text-7xl">Ship more.<br />Manage less.</h1><p className="mt-5 max-w-lg text-base font-medium leading-7 text-[#0A0A0ACC]">Welcome back, {user?.name || 'builder'}. Your Go API and Vite frontend are connected and ready for the next release.</p></div><div className="absolute -right-8 -top-16 hidden select-none font-mono text-[220px] font-bold leading-none text-white/10 lg:block">01</div></section>

                <div className="mb-5 flex items-end justify-between"><div><div className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.8px] text-[#A855F7]"><span className="h-0.5 w-6 bg-[#A855F7]" /> SYSTEM SNAPSHOT</div><h2 className="text-3xl tracking-[-1.2px] sm:text-4xl">Everything is moving.</h2></div><span className="hidden font-mono text-[10px] font-bold tracking-[0.6px] text-[#BEF264] sm:block">● ALL SYSTEMS OPERATIONAL</span></div>

                <section className="grid gap-px overflow-hidden rounded-lg border border-[#27272A] bg-[#27272A] sm:grid-cols-2 lg:grid-cols-4">{metrics.map(({ label, value, change, icon: Icon }) => <div key={label} className="bg-[#111113] p-5 transition hover:bg-[#18181B]"><div className="mb-8 flex items-center justify-between"><span className="font-mono text-[10px] font-bold tracking-[0.6px] text-[#A1A1AA]">{label}</span><Icon size={16} className="text-[#A855F7]" /></div><div className="flex items-end justify-between"><span className="font-mono text-3xl font-bold tracking-[-1px]">{value}</span><span className="font-mono text-[10px] font-bold text-[#BEF264]">{change}</span></div></div>)}</section>

                <section className="mt-8 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]"><div className="rounded-lg border border-[#27272A] bg-[#111113]"><div className="flex items-center justify-between border-b border-[#27272A] px-5 py-4"><span className="font-mono text-[10px] font-bold tracking-[0.7px] text-white">RECENT ACTIVITY</span><span className="font-mono text-[10px] text-[#A1A1AA]">LAST 24 HOURS</span></div><div className="divide-y divide-[#27272A]">{['New user registered', 'Workspace authentication verified', 'Vite deployment completed'].map((activity, index) => <div key={activity} className="flex items-center gap-4 px-5 py-4"><span className="h-2 w-2 rounded-full bg-[#BEF264]" /><div className="flex-1"><p className="text-sm">{activity}</p><p className="mt-1 font-mono text-[10px] text-[#71717A]">{index + 1} hour{index ? 's' : ''} ago</p></div><ArrowUpRight size={15} className="text-[#52525B]" /></div>)}</div></div><div className="rounded-lg border border-[#27272A] bg-[#111113] p-5"><div className="mb-6 font-mono text-[10px] font-bold tracking-[0.7px] text-[#A855F7]">CONNECTED STACK</div><div className="space-y-4 font-mono text-xs"><div className="flex justify-between"><span className="text-[#A1A1AA]">API</span><span className="text-[#BEF264]">GO / :8080</span></div><div className="flex justify-between"><span className="text-[#A1A1AA]">FRONTEND</span><span className="text-[#BEF264]">VITE / :5173</span></div><div className="flex justify-between"><span className="text-[#A1A1AA]">AUTH</span><span className="text-[#BEF264]">OAUTH READY</span></div></div></div></section>
            </main>
        </div>
    )
}
