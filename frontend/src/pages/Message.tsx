import { DownloadOutlined } from "@ant-design/icons";
import { Button, Card, Divider, Flex, message, Typography } from "antd";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useUser } from "../context/UserContext";
import { messageService } from "../service/messageService";
import type { Message } from "../types/message";

const { Title, Text } = Typography;

function Message() {
    const {id } = useParams();
    // const [loading, setLoading] = useState(true);
    const { keys, getKeys } = useUser();
    const [messageData, setMessageData] = useState<Message | null>(null);

    const fetchMessage = async () => {
        console.log(keys);
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

            // console.log(data);

            messageService.decryptMessage(
                data.ciphertext, 
                data.signature, 
                data.enc_aes_key, 
                data.eph_key, 
                data.signature_pubkey, 
                keys.encryption.privateKey
            ).then((decrypted) => {
                // console.log(decrypted);
                setMessageData(decrypted);
            }).catch((err) => {
                message.error(err.message);
            });


        } catch {
            message.error("Failed to load message");
        } finally {
            // setLoading(false);
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

            <Title level={2}>Message</Title>
            <Divider style={{ margin: "0"}} />
            
            <Flex vertical gap="middle" style={{maxWidth: 800}} align="center" justify="center">

            <Text >
                {messageData?.text}
            </Text>

            {messageData?.attachment && (
                <Card size="small" title="Attachment">
                    <Flex justify="space-between" align="center" gap="large">
                        <Text strong>{messageData.attachment.name}</Text>
                        <Button 
                            type="primary"
                            icon={<DownloadOutlined />}
                            onClick={handleDownload}
                            >
                            Download
                        </Button>
                    </Flex>
                </Card>
            )}
            </Flex>
            
        </Flex>
    )

}
export default Message;