import { createFileRoute, useRouter, redirect } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Activity, Target, Zap } from "lucide-react"
import { Button } from '@/components/ui/button'
import { useAuthStore } from '../../store/authStore'

export const Route = createFileRoute('/dashboard/')({
    beforeLoad: () => {
        const { isAuthenticated } = useAuthStore.getState()
        if (!isAuthenticated) {
            throw redirect({
                to: '/',
            })
        }
    },
    component: Dashboard,
})


function Dashboard() {
    const metrics = [
        { label: 'Total Users', value: '1,234', change: '+12.5%', icon: Users },
        { label: 'Active Sessions', value: '56', change: '+5.2%', icon: Activity },
        { label: 'Conversion Rate', value: '12.5%', change: '+1.4%', icon: Target },
        { label: 'System Health', value: '99.9%', change: 'Stable', icon: Zap },
    ]

    const router = useRouter()

    return (
        <div className="container py-8 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                <p className="text-muted-foreground font-medium">
                    Welcome back! Here's what's happening today.
                </p>
            </div>

            <Button onClick={() => router.navigate({ to: '/' })}>Go to Home</Button>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((metric) => (
                    <Card key={metric.label}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                            <metric.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metric.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                <span className="text-primary font-medium">{metric.change}</span> from last month
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>You have 3 new notifications</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">New user registered</p>
                                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
