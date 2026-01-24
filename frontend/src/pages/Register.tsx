import { bytesToHex } from "@noble/curves/utils.js";
import { zxcvbn, type ZxcvbnResult } from "@zxcvbn-ts/core";
import { Button, Card, Col, Form, Input, message, Row } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router";
import PasswordStrengthIndicator from "../components/PassStrengthIndicator";
import { API_CONFIG } from "../config/api";
import { setupZxcvbn } from "../config/password";
import { useUser } from "../context/UserContext";
import { keyService } from "../service/keyService";

setupZxcvbn();

function Register() {
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<number>(0);
    const [passwordResult, setPasswordResult] = useState<ZxcvbnResult>(zxcvbn(""));
    const { setTempPassword, setUsername } = useUser();
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        setLoading(true);

        const exists = await checkUsernameAvailability(values.username);
        if (exists) {
            message.error("Username already exists. Please choose another one.");
            setLoading(false);
            return;
        }

        try {
            // generate salt
            const saltBytes = window.crypto.getRandomValues(new Uint8Array(16));
            const saltHex = bytesToHex(saltBytes);
            
            // generate keys
            const keys = await keyService.generateAllKeys();

            // encrypt keys
            const encryptedSigning = await keyService.encryptPrivateKey(
                keys.signing.privateKey,
                values.password,
                saltHex
            )

            const encryptedEncryption = await keyService.encryptPrivateKey(
                keys.encryption.privateKey,
                values.password,
                saltHex
            )

            const payload = {
                username: values.username,
                password: values.password,

                keys: {
                    signing_pub_key: keys.signing.publicKey,
                    encryption_pub_key: keys.encryption.publicKey,
    
                    signing_priv_key: encryptedSigning,
                    encryption_priv_key: encryptedEncryption,
    
                    key_salt: saltHex,
                }
            }
            // console.log("Payload: ", payload);

            // send request
            const request = await fetch(`${API_CONFIG.BASE_URL}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await request.json();

            // check for errors
            if (!request.ok) {
                if (request.status === 409) {
                    message.error(`Registration failed. Username already exists.`);
                    return;
                } else {
                    message.error(`Registration failed. ${data.details.warning}`)
                    return;
                }
            }

            // save passwd to decrypt keys after successful 2fa setup
            setUsername(values.username);
            setTempPassword(values.password);

            navigate('/2fa/setup');

        } catch {
            message.error("Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    const checkUsernameAvailability = async (username: string) => {
        const response = await fetch(`${API_CONFIG.BASE_URL}/users/check_username?username=${encodeURIComponent(username)}`);
        const data = await response.json();
        return data.exists;
    }

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
                    <Form.Item label="Username" name="username" rules={[
                        { required: true, message: 'Please input your username!' },
                        { 
                            pattern: /^[a-zA-Z0-9_-]+$/,
                            message: 'Username can only contain letters, numbers, - and _.'
                        }
                         ]}>
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