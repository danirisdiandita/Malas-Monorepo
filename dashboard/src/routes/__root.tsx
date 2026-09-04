import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Navbar } from '../components/Navbar'

export const Route = createRootRoute({ component: Root })

function Root() {
    const pathname = useRouterState({ select: (state) => state.location.pathname })
    const isFullBleed = pathname === '/' || pathname === '/sign-in'

    return <>
        {!isFullBleed && <Navbar />}
        <main className="flex-1"><Outlet /></main>
        <TanStackRouterDevtools />
    </>
}
