import { zxcvbn, type ZxcvbnResult } from "@zxcvbn-ts/core";
import { Button, Card, Col, Form, Input, message, Row } from "antd";
import { useState } from "react";
import PasswordStrengthIndicator from "../components/PassStrengthIndicator";
import { setupZxcvbn } from "../config/password";

setupZxcvbn();

function Register() {
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<number>(0);
    const [passwordResult, setPasswordResult] = useState<ZxcvbnResult>(zxcvbn(""));

    const onFinish = async (values: any) => {
        setLoading(true);

        try {
            // generate keys
            // encrypt keys
            // send to backend
            console.log(values);
            await new Promise((resolve) => setTimeout(resolve, 2000)); // simulate network request

            message.success("Registration successful!");

        } catch (error) {
            message.error("Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    // const checkUsernameAvailability = async (username: string) => {
    //     // api call to backend
    // }

    const checkPasswordStrength = (password: string) => {
        const result = zxcvbn(password);
        setPasswordStrength(result.score);
        setPasswordResult(result);
    }


    return (
    <Row align="middle" style={{ minHeight: '100vh' }}>
        <Col xs={24} md={12}>
            <Card title="Register" style={{ maxWidth: 400, margin: '50px auto'}}>
                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item label="Username" name="username" rules={[{ required: true, message: 'Please input your username!' }]}>
                        <Input placeholder="username" />
                    </Form.Item>

                    <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Please input your password!' }]}>
                        <Input.Password placeholder="password" onChange={e => checkPasswordStrength(e.target.value)} />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" loading={loading} block disabled={passwordStrength < 3}>
                        Register
                    </Button>
                </Form>
            </Card>
        </Col>
        <Col xs={24} md={12} style={{ padding: '0 20px' }}>
            <PasswordStrengthIndicator result={passwordResult} />
        </Col>
    </Row>
    )

}
export default Register;