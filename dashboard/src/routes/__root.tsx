import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Navbar } from '../components/Navbar'
import { useAuthStore } from '../store/authStore'
import { config } from '../lib/config'
import { fetchWithAuth } from '../lib/fetch'

export const Route = createRootRoute({ component: Root })

function Root() {
    const pathname = useRouterState({ select: (state) => state.location.pathname })
    const isFullBleed = pathname === '/' || pathname === '/sign-in' || pathname === '/dashboard'

    return <>
        {!isFullBleed && <Navbar />}
        <SessionSync />
        <main className="flex-1"><Outlet /></main>
        <TanStackRouterDevtools />
    </>
}

function SessionSync() {
    const setAuth = useAuthStore((state) => state.setAuth)
    const logout = useAuthStore((state) => state.logout)

    useEffect(() => {
        fetchWithAuth(`${config.apiUrl}/auth/user`)
            .then((response) => response.ok ? response.json() : null)
            .then((user) => user ? setAuth(user) : logout())
            .catch(logout)
    }, [logout, setAuth])

    return null
}
