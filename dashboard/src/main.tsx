import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { config } from './lib/config'
import './index.css'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <GoogleOAuthProvider clientId={config.googleClientId}>
        <RouterProvider router={router} />
      </GoogleOAuthProvider>
    </StrictMode>,
  )
}

