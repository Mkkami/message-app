import { InboxOutlined, LoginOutlined, MenuOutlined, SendOutlined, UserAddOutlined } from "@ant-design/icons";
import { Button, Dropdown, type MenuProps } from "antd";
import { useLocation, useNavigate } from "react-router";

export const AppNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const items: MenuProps["items"] = [
        { key: '/', label: 'Home', icon: <MenuOutlined />},
        { key: '/login', label: 'Login' , icon: <LoginOutlined />},
        { key: '/register', label: 'Register' , icon: <UserAddOutlined />},
        { key: '/send', label: 'Send Message'  , icon: <SendOutlined />},
        { key: '/inbox', label: 'Inbox'  , icon: <InboxOutlined />},
    ];

    const handleMenuClick: MenuProps['onClick'] = (e) => {
        navigate(e.key);
    }

    if (location.pathname === '/') {
        return null;
    }

    return (
        <div style={{position: 'fixed', top: 20, left: 20, zIndex: 1000}}>
            <Dropdown menu={{ items, onClick: handleMenuClick }} trigger={['click']} >
                <Button size="large" icon={<MenuOutlined />} shape="default" />
            </ Dropdown>
        </div>
    )
}