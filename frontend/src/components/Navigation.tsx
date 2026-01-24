import { InboxOutlined, LoginOutlined, LogoutOutlined, MenuOutlined, SendOutlined, UserAddOutlined } from "@ant-design/icons";
import { Divider, Menu, Typography } from "antd";
import { Header } from "antd/es/layout/layout";
import Sider from "antd/es/layout/Sider";
import { useNavigate } from "react-router";
import { useUser } from "../context/UserContext";

const {Text} = Typography

export const AppNavigation = () => {
    const navigate = useNavigate();
    const logout = useUser().logout;
    const { username, isLoggedIn } = useUser();

    return (
        <Sider collapsible breakpoint="lg" collapsedWidth="50" width={200}>
            <Menu>
                <Header style={{padding: 0, textAlign: "center", color: "white", fontWeight: "bold", fontSize: "1.2rem"}}>{isLoggedIn ? username : "Not logged in"}</Header>

                <Menu.Item key="/login" icon={<LoginOutlined />} onClick={() => navigate('/login')}>Login</Menu.Item>
                <Menu.Item key="/register" icon={<UserAddOutlined />} onClick={() => navigate('/register')}>Register</Menu.Item>
                
                {isLoggedIn && username && <Menu.Item key="/logout" icon={<LogoutOutlined />} onClick={() => {
                    logout();
                    navigate('/');
                } }>Logout</Menu.Item>}

                <Divider />

                <Menu.Item key="/" icon={<MenuOutlined />} onClick={() => navigate('/')}>Home</Menu.Item>
                {isLoggedIn && username &&
                <>
                    <Menu.Item key="/send" icon={<SendOutlined />} onClick={() => navigate('/send')}>Send Message</Menu.Item>
                    <Menu.Item key="/inbox" icon={<InboxOutlined />} onClick={() => navigate('/inbox')}>Inbox</Menu.Item>
                </>
                }
            </Menu>
        </Sider>
    )
}