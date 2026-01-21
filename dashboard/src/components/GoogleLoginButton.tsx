import { GoogleLogin } from '@react-oauth/google';
import { config } from '../lib/config';

export function GoogleLoginButton() {
    const handleSuccess = async (credentialResponse: any) => {
        try {
            const response = await fetch(`${config.apiUrl}/auth/google`, {
                method: 'POST',


                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    idToken: credentialResponse.credential,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to authenticate with backend');
            }

            const data = await response.json();
            console.log('Login Success:', data);

            // Here you would typically store the user data or token in your state management
            // e.g., localStorage.setItem('user', JSON.stringify(data));
        } catch (error) {
            console.error('Login Error:', error);
        }
    };

    const handleError = () => {
        console.error('Login Failed');
    };

    return (
        <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap
        />
    );
}
