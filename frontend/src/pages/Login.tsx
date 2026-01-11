import { Button, Card, Flex, Form, Input, message, Typography } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router";
import { API_CONFIG } from "../config/api";

const { Title } = Typography;

function Login() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values: {username: string, password: string}) => {
        setLoading(true);
        console.log(values);
        try {
            const params = new URLSearchParams();
            params.append('username', values.username);
            params.append('password', values.password);

            const response = await fetch(`${API_CONFIG.BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });
            if (!response.ok) {
                message.error("Incorrect username or password")
                return;
            } 
            const data = await response.json();
            navigate(`/2fa/${data.target}`)

        } catch (error) {
            console.error("Login error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Flex vertical align="center" justify="center" style={{ minHeight: "94vh", gap: '20px'}} >
            <Title level={2}>Login Page</Title>
            <Card>
                <Form onFinish={onFinish} layout="vertical">
                    <Form.Item label="Username" name="username" rules={[{ required: true, message: 'Please input your username!' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Please input your password!' }]}>
                        <Input.Password />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Login
                    </Button>
                </Form>
            </Card>
        </Flex>
    )
}
export default Login;