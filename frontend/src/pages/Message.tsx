import { message } from "antd";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

function Message() {
    const {id } = useParams();
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        
        const fetchMessage = async () => {
            try {
                const response = await fetch(`/api/messages/${id}`);
                if (!response.ok) {

                    return;
                }

                const data = await response.json();


            } catch {
                message.error("Failed to load message");
            } finally {
                setLoading(false);
            }
        }
        setLoading(true);
        fetchMessage();
    }, [id])

    return (
        <div>
            
        </div>
    )

}
export default Message;