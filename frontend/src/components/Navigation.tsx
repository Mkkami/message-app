import { InboxOutlined, LoginOutlined, LogoutOutlined, MenuOutlined, SendOutlined, UserAddOutlined, UserOutlined } from "@ant-design/icons";
import { Divider, Menu } from "antd";
import { Header } from "antd/es/layout/layout";
import Sider from "antd/es/layout/Sider";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useUser } from "../context/UserContext";

export const AppNavigation = () => {
    const navigate = useNavigate();
    const logout = useUser().logout;
    const { username, isLoggedIn } = useUser();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)} breakpoint="lg" collapsedWidth="50" width={200}>
                <Header style={{
                    padding: 0, 
                    textAlign: "center", 
                    color: "white", 
                    fontWeight: "bold", 
                    fontSize: "1.2rem",
                    overflow: "hidden",
                    }}>
                        {!collapsed ? 
                            isLoggedIn ? username : "Not logged in"
                        : <UserOutlined />
                        }
                </Header>
            <Menu>

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