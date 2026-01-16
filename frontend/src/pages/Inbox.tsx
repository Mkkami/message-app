import { DeleteOutlined, ReloadOutlined } from "@ant-design/icons"
import { Button, Flex, List, message, Popconfirm, Typography } from "antd"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { API_CONFIG } from "../config/api"


const {Title} = Typography

function Inbox() {
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    const fetchMessages = async () => {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/messages/inbox`);

            if (!response.ok) {
                message.error("Failed to load messages")
                return;
            }
            const data = await response.json();
            console.log(data);
            setMessages(data)

        } catch {
            message.error("Failed to load messages")
        } finally {
            setLoading(false)
        }
    }
    const handleDelete = async (e: any, messageId: number) => {
        e.stopPropagation();
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/messages/${messageId}`, {
                method: "DELETE"
            });
            if (!response.ok) {
                message.error("Failed to delete message")
                return;
            }
            message.success("Message deleted")
            setMessages(messages.filter((msg: any) => msg.id !== messageId))
        } catch {
            message.error("Failed to delete message")
        }
    }

    useEffect(() => {
        fetchMessages()
    }, [])

    return (
        <Flex vertical gap="middle" style={{maxWidth: "800px", margin: "auto", padding: "20px"}}>
            <Flex justify="space-between" align="center">
                <Title level={2}>Inbox</Title>
                <Button icon={<ReloadOutlined/>} loading={loading} onClick={fetchMessages}/>
            </Flex>
            <List
                loading={loading}
                itemLayout="horizontal"
                dataSource={messages}
                locale={{emptyText: "No messages in inbox"}}
                renderItem={(item: any) => (
                    <List.Item
                        key={item.id}
                        style={{cursor: "pointer", background: item.is_read ? "white" : "#e6f7ff"}}
                        onClick={() => navigate(`/message/${item.id}`)}
                        actions={[
                        <div onClick={(e) => e.stopPropagation()}>
                            <Popconfirm
                                title="Delete?"
                                onConfirm={(e: any) => handleDelete(e, item.id)}
                                okText="Yes"
                                cancelText="No"
                            >
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </Popconfirm>
                        </div>
                        ]}
                        >
                        <List.Item.Meta
                            title={`From: ${item.sender_username}`}
                            description={item.is_read ? "Read" : "Unread"}
                        />
                    </List.Item>
                )}
                >
            </List>
        </Flex>
    )
}
export default Inbox