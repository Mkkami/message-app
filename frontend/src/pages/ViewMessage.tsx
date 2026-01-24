import { ArrowLeftOutlined, LoadingOutlined } from "@ant-design/icons";
import { Button, Card, Flex, message, Spin, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useUser } from "../context/UserContext";
import { messageService } from "../service/messageService";
import type { Message } from "../types/message";

const { Title, Text, Paragraph } = Typography;

function ViewMessage() {
    const {id } = useParams();
    const { keys, getKeys } = useUser();
    const [messageData, setMessageData] = useState<Message | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    const fetchMessage = async () => {
        setLoading(true);
        if (!keys) {
            await getKeys();
            return;
        }

        try {
            const response = await fetch(`/api/messages/${id}`);
            if (!response.ok) {

                return;
            }

            const data = await response.json();

            messageService.decryptMessage(
                data.ciphertext, 
                data.signature, 
                data.enc_aes_key, 
                data.eph_key, 
                data.signature_pubkey, 
                keys.encryption.privateKey
            ).then((decrypted) => {
                setMessageData(decrypted);
            }).catch((err) => {
                message.error(err.message);
            });


        } catch {
            message.error("Failed to load message");
        } finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        fetchMessage();
    }, [id])

    const handleDownload = () => {
        if (!messageData || !messageData.attachment) {
            return;
        }
        const {data, name, type} = messageData.attachment;
        const link = document.createElement("a");
        link.href = `data:${type};base64,${data}`;
        link.download = name;
        link.click();
    };

    return (
        <Flex vertical gap="small" align="center" style={{minHeight: "100vh", padding: 20}}>
            <Card
                style={{ width: '100%', maxWidth: 800 }}
                title={
                    <Flex align="center" gap="middle">
                        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/inbox')} />
                        <Title level={4} style={{margin: 0}}>Message Details</Title>
                    </Flex>
                }
            >
                {loading ? (
                    <Spin indicator={<LoadingOutlined />} />
                ) : messageData && (
                    <Flex vertical gap="large">
                        <div style={{
                            background: '#f8f9fa',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '1px solid #f0f0f0',
                        }}>
                            <Paragraph style={{
                                whiteSpace: 'pre-wrap',
                                fontSize: '16px',
                                margin: 0,
                                color: '#262626'
                            }}>
                                {messageData.text}
                            </Paragraph>
                        </div>
                        {messageData.attachment && (
                            <Card size="small" type="inner" title="Attachment">
                                <Flex justify="space-between" align="center">
                                    <Text style={{fontWeight: 'bold'}}>{messageData.attachment.name}</Text>
                                    <Button type="primary" onClick={handleDownload}>Download</Button>
                                </Flex>
                            </Card>
                        )}
                    </Flex>
                )}  
            </Card>
        </Flex>
    )
}
export default ViewMessage;