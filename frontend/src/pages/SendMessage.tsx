import { FileOutlined, PaperClipOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Card, Col, Flex, Input, message, Row, Upload } from "antd";
import { useState } from "react";
import SelectUsers from "../components/SelectUsers";
import type { UserRecipient } from "../types/user";


function SendMessage() {
    const [recipients, setRecipients] = useState<UserRecipient[]>([]);
    const [text, setText] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const [isSending, setIsSending] = useState<boolean>(false);

    const removeRecipient = (userId: number) => {
        setRecipients(recipients.filter(user => user.id !== userId));
    }

    const addRecipient = (user: UserRecipient) => {
        setRecipients([...recipients, user]);
    }

    const handleSend = async () => {
        // Implementation for sending message will go here
        setIsSending(true);
        console.log(recipients);
    }


    return (
        <Row gutter={24}>
            <Col>
                <Card title="Select Recipients">
                    <SelectUsers
                        users={recipients}
                        onAddUser={addRecipient}
                        onRemoveUser={removeRecipient}
                    />
                </Card>
            </Col>
            {/* Treść wiadomości */}
            <Col>
                <Card title="Message" variant="outlined">
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