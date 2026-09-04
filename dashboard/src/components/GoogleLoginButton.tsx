import { ArrowUpRight, Apple } from 'lucide-react';
import { Button } from './ui/button';
import { config } from '../lib/config';

export function GoogleLoginButton() {
    const login = () => {
        const from = encodeURIComponent(`${window.location.origin}/dashboard`);
        window.location.assign(`${config.apiUrl}/auth/google/login?from=${from}`);
    };

    return <Button onClick={login} className="h-[58px] w-full justify-between rounded-lg bg-white px-[18px] text-[15px] text-[#0A0A0A] hover:bg-white/90"><span className="flex items-center gap-3.5"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F4F4F5] font-bold">G</span>Continue with Google</span><ArrowUpRight className="h-[18px] w-[18px]" /></Button>;
}

export function AppleLoginButton() {
    const login = () => {
        const from = encodeURIComponent(`${window.location.origin}/dashboard`);
        window.location.assign(`${config.apiUrl}/auth/apple/login?from=${from}`);
    };

    return <Button onClick={login} variant="outline" className="h-[58px] w-full justify-between rounded-lg border-[#27272A] bg-[#111113] px-[18px] text-[15px] text-white hover:bg-[#18181B] hover:text-white"><span className="flex items-center gap-3.5"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#27272A]"><Apple className="h-4 w-4 fill-white" /></span>Continue with Apple</span><ArrowUpRight className="h-[18px] w-[18px] text-[#A1A1AA]" /></Button>;
}
