import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { UserProvider } from './context/UserContext.tsx'
import router from './router/router.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
        <RouterProvider router={router} />
    </UserProvider>
  </StrictMode>,
)