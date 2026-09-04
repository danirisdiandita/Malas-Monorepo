import { Button } from './ui/button';
import { config } from '../lib/config';

export function GoogleLoginButton() {
    const login = () => {
        const from = encodeURIComponent(window.location.origin);
        window.location.assign(`${config.apiUrl}/auth/google/login?from=${from}`);
    };

    return <Button onClick={login}>Continue with Google</Button>;
}

export function AppleLoginButton() {
    const login = () => {
        const from = encodeURIComponent(window.location.origin);
        window.location.assign(`${config.apiUrl}/auth/apple/login?from=${from}`);
    };

    return <Button onClick={login}>Continue with Apple</Button>;
}
