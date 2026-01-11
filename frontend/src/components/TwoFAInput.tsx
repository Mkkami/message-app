import { Button, Form, Input, message } from "antd";
import { useNavigate } from "react-router";
import { API_CONFIG } from "../config/api";

function TwoFAInput() {
    const navigate = useNavigate();
    
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
                message.success("2FA complete!");
                // jakis redirect
                navigate('/');

                return;
            }
            message.error("Verification failed. Please try again.");
        } catch (error) {
            message.error("Network error. Try again later");
        }
    }

    return (
        <Form onFinish={verifyCode} layout="vertical" style={{ width: 300 }}>
            <Form.Item label="Enter the code:" name="token" rules={[
                { required: true, message: 'Please input the code!' },
                { len: 6, message: 'Code must be 6 digits long.' }]}>
                <Input type="number" placeholder="000 000" style={{textAlign: "center"}} />
            </Form.Item>
            
            <Button type="primary" htmlType="submit" block>Verify</Button>
        </Form>
    )
}
export default TwoFAInput;