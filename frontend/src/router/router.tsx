import { createBrowserRouter } from "react-router";
import App from "../App";
import Login from "../pages/Login";
import Register from "../pages/Register";
import SendMessage from "../pages/SendMessage";
import TwoFactorAuth from "../pages/TwoFactorAuth";


const router = createBrowserRouter([
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
    }
])
export default router;