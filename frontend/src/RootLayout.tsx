import { Outlet } from "react-router"
import { AppNavigation } from "./components/Navigation"


function RootLayout () {
    return (
        <>
            <AppNavigation />
            <main>
                <Outlet />
            </main>
        </>
    )
}
export default RootLayout