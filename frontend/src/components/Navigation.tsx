import { InboxOutlined, LoginOutlined, MenuOutlined, SendOutlined, UserAddOutlined } from "@ant-design/icons";
import { Menu } from "antd";
import Sider from "antd/es/layout/Sider";
import { useNavigate } from "react-router";
import { useUser } from "../context/UserContext";

export const AppNavigation = () => {
    const navigate = useNavigate();
    const logout = useUser().logout;

    return (
        <Sider collapsible breakpoint="md" collapsedWidth="50">
            <Menu>
                <Menu.Item key="/" icon={<MenuOutlined />} onClick={() => navigate('/')}>Home</Menu.Item>
                <Menu.Item key="/login" icon={<LoginOutlined />} onClick={() => navigate('/login')}>Login</Menu.Item>
                <Menu.Item key="/register" icon={<UserAddOutlined />} onClick={() => navigate('/register')}>Register</Menu.Item>
                <Menu.Item key="/send" icon={<SendOutlined />} onClick={() => navigate('/send')}>Send Message</Menu.Item>
                <Menu.Item key="/inbox" icon={<InboxOutlined />} onClick={() => navigate('/inbox')}>Inbox</Menu.Item>
                <Menu.Item key="/logout" icon={<LoginOutlined />} onClick={() => {
                    logout();
                    navigate('/');

                } }>Logout</Menu.Item>
            </Menu>
        </Sider>
    )
}