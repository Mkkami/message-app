import { createBrowserRouter } from "react-router";
import App from "../App";
import Register from "../pages/Register";
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
        path: "/2fa",
        element: <TwoFactorAuth />
    }
])
export default router;