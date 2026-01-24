import { Layout } from "antd"
import { Content } from "antd/es/layout/layout"
import { Outlet } from "react-router"
import { AppNavigation } from "./components/Navigation"


function RootLayout () {
    return (
        <Layout style={{minHeight: "100vh"}}>
            <AppNavigation />
            <Content>

                <Outlet />
            </Content>
        </Layout>
    )
}
export default RootLayout