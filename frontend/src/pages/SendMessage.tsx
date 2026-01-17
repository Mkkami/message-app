import { FileOutlined, PaperClipOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Card, Col, Divider, Flex, Input, message, Row, Typography, Upload } from "antd";
import { useState } from "react";
import SelectUsers from "../components/SelectUsers";
import { API_CONFIG } from "../config/api";
import { useUser } from "../context/UserContext";
import { messageService } from "../service/messageService";
import type { UserRecipient } from "../types/user";

const { Title } = Typography;

function SendMessage() {
    const [recipients, setRecipients] = useState<UserRecipient[]>([]);
    const [text, setText] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const [isSending, setIsSending] = useState<boolean>(false);
    const keys = useUser().keys;

    const removeRecipient = (userId: number) => {
        setRecipients(recipients.filter(user => user.id !== userId));
    }

    const addRecipient = (user: UserRecipient) => {
        setRecipients([...recipients, user]);
    }

    const handleSend = async () => {
        console.log(recipients, text, file, keys);

        if (recipients.length === 0 || recipients === null) {
            message.error("Please add at least one recipient or type a message.");
            return;
        }
        if (!text.trim() && !file) {
            message.error("Cannot send an empty message.");
            return;
        }

        if (!keys) {
            message.error("Encryption keys are not available.");
            return;
        }

        setIsSending(true);
        try {
            const encryptedData = await messageService.encryptMessage(
                text,
                file,
                recipients,
                keys.signing.privateKey,
            );

            const response = await fetch(`${API_CONFIG.BASE_URL}/messages/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ciphertext: encryptedData.ciphertext,
                    signature: encryptedData.signature,
                    eph_key: encryptedData.ephKey,
                    recipients: encryptedData.recipients,
                })
            })

            if (!response.ok) {
                throw new Error("Failed to send message");
            }
            
            message.success("Message sent!");
            setText("");
            setFile(null);
            setRecipients([]);
        } catch {
            message.error("Error sending message.");
        } finally {
            setIsSending(false);
        }
        console.log(recipients);
    }


    return (
        <Row align="middle" justify="center" style={{minHeight: "100vh"}}>
            <Col xs={6}>
                <Card title="Select Recipients" style={{maxWidth: 400, margin: "auto"}}>
                    <Card.Meta description="You can send a message to yourself or others" />
                    <Divider />
                    <SelectUsers
                        users={recipients}
                        onAddUser={addRecipient}
                        onRemoveUser={removeRecipient}
                    />
                </Card>
            </Col>
            {/* Treść wiadomości */}
            <Col xs={12}>
                <Card title="Message" style={{maxWidth: 800, margin: "auto"}}>
                    <Flex vertical gap="middle">
                        <Input.TextArea 
                            rows={6}
                            placeholder="Type your message here..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                        {file && (
                            <Card size="small" type="inner">
                                <Flex justify="space-between" align="center">
                                    <span><FileOutlined /> {file.name}</span>
                                    <Button type="link" danger onClick={() => setFile(null)}>Remove</Button>
                                </Flex>
                            </Card>
                        )}
                        
                        <Flex justify="space-between">
                            <Upload
                                beforeUpload={(file) => {
                                    const isLt2M = file.size / 1024 / 1024 < 2;
                                    if (!isLt2M) {
                                        message.error("File must be smaller than 2MB!")
                                        return Upload.LIST_IGNORE;
                                    }
                                    setFile(file);
                                    return false; // Prevent automatic upload
                                }}
                                showUploadList={false}
                            >
                                <Button disabled={!!file} icon={<PaperClipOutlined />}>Attach file (max 2MB)</Button>
                            </Upload>

                            <Button type="primary"
                                icon={<SendOutlined />}
                                loading={isSending}
                                onClick={handleSend}
                                disabled={recipients.length === 0 && !text}
                            >
                                Send
                            </Button>
                        </Flex>
                    </Flex>
                </Card>
            </Col>
        </Row>
    )
}
export default SendMessage;