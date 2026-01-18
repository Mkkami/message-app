import { createBrowserRouter } from "react-router";
import App from "../App";
import Inbox from "../pages/Inbox";
import Login from "../pages/Login";
import Message from "../pages/Message";
import Register from "../pages/Register";
import SendMessage from "../pages/SendMessage";
import TwoFactorAuth from "../pages/TwoFactorAuth";
import RootLayout from "../RootLayout";


const router = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout />,
        children: [
            {
                path: "/",
                element: <App />,
            },
            {
                path: "/register",
                element: <Register />,
            },
            {
                path: "/login",
                element: <Login />
            },
            {
                path: "/2fa/setup",
                element: <TwoFactorAuth mode="setup" />,
            },
            {
                path: "/2fa/verify",
                element: <TwoFactorAuth mode="verify" />
            },
            {
                path: "/send",
                element: <SendMessage />
            },
            {
                path: "/inbox",
                element: <Inbox />
            },
            {
                path: "/message/:id",
                element: <Message />
            }
        ]
    }
])
export default router;