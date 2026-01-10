import { Button, Flex, Form, Input, message, QRCode, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { API_CONFIG } from "../config/api";

interface TotpSetup {
    totp_uri: string;
    secret: string;
}

const {Title} = Typography
 
function TwoFactorAuth() {
    const [secretOpen, setSecretOpen] = useState(false);
    const [props, setProps] = useState<TotpSetup | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetch2FASetup = async () => {
            try {
                const response = await fetch(`${API_CONFIG.BASE_URL}/2fa/setup`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                const data = await response.json();
                setProps(data);
            } catch (error) {
                console.error('Error fetching 2FA setup:', error);
            }
        };
        fetch2FASetup();
    }, [])

    const verifyCode = async (values: {token: string}) => {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/2fa/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: values.token }),
            });

            if (!response.ok) {
                message.error("Invalid code. Please try again.");
                return;
            }

            const data = await response.json();

            if (data.status === "ok") {
                message.success("2FA setup complete!");
                // jakis redirect
                navigate('/');

                return;
            }
            message.error("Verification failed. Please try again.");
        } catch (error) {
            message.error("Network error. Try again later");
        }
    }

    if (loading || !props) {
        return <div>Loading...</div>;
    }

    return (
        <Flex vertical align="center" justify="center" style={{ minHeight: "94vh", gap: '20px'}} >
            <Title level={2}>Two-Factor Authentication Setup</Title>
            <QRCode value={props?.totp_uri} size={300}/>
            {secretOpen && <div>Secret: {props.secret}</div>}
            <Button onClick={() => setSecretOpen(!secretOpen)}>
                {secretOpen ? "Hide Secret" : "Show Secret"}
            </Button>

            <Form onFinish={verifyCode} layout="vertical" style={{ width: 300 }}>
                <Form.Item label="Enter the code:" name="token" rules={[
                    { required: true, message: 'Please input the code!' },
                    { len: 6, message: 'Code must be 6 digits long.' }]}>
                    <Input type="number" placeholder="000 000" style={{textAlign: "center"}} />
                </Form.Item>
                
                <Button type="primary" htmlType="submit" block>Verify</Button>
            </Form>
        </Flex>
    )
}
export default TwoFactorAuth;