import { FileOutlined, PaperClipOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Card, Col, Divider, Flex, Input, message, Row, Upload } from "antd";
import { useEffect, useState } from "react";
import SelectUsers from "../components/SelectUsers";
import { API_CONFIG } from "../config/api";
import { useUser } from "../context/UserContext";
import { messageService } from "../service/messageService";
import type { UserRecipient } from "../types/user";

// const { Title } = Typography;

function SendMessage() {
    const [recipients, setRecipients] = useState<UserRecipient[]>([]);
    const [text, setText] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const [isSending, setIsSending] = useState<boolean>(false);
    const {keys, getKeys} = useUser();

    useEffect(() => {
        const checkKeys = async () => {
            if (!keys) {
                await getKeys();
                return;
            }
        }
        checkKeys();
    }, [])

    const removeRecipient = (userId: number) => {
        setRecipients(recipients.filter(user => user.id !== userId));
    }

    const addRecipient = (user: UserRecipient) => {
        setRecipients(prev => [...prev, user]);
    }

    const handleSend = async () => {

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
    }


    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: 'auto' }}>
            <Card title={
                <span style={{ fontWeight: 'bold', fontSize: '18px', width: '100%' }}>Send Message</span>
            }>

                <Row  style={{minHeight: '60vh'}}>
                    <Col xs={24} md={8} >
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
                    <Col xs={24} md={16}>
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
                                <Flex justify="space-between" align="center">
                                    <Upload
                                        beforeUpload={(file) => {
                                            const isLt5M = file.size / 1024 / 1024 < 5;
                                            if (!isLt5M) {
                                                message.error("File must be smaller than 5MB!")
                                                return Upload.LIST_IGNORE;
                                            }
                                            setFile(file);
                                            return false; // Prevent automatic upload
                                        }}
                                        showUploadList={false}
                                    >
                                        <Button disabled={!!file} icon={<PaperClipOutlined />}>Attach file (max 5MB)</Button>
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
            </Card>
        </div>
    )
}
export default SendMessage;