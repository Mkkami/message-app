import { Button, Flex, Input, List, message } from "antd";
import { useState } from "react";
import type { UserRecipient } from "../types/user";

interface SelectUsersProps {
    users: UserRecipient[];

    onAddUser: (user: UserRecipient) => void;
    onRemoveUser: (userId: number) => void;
}

function SelectUsers(props: SelectUsersProps) {
    const [currentUsername, setCurrentUsername] = useState<string>("");

    const searchUser = async (username: string) => {
        if (props.users.some(u => u.username === username)) {
            message.warning("User already added");
            return;
        }

        if (!validateUsername(username)) {
            return;
        }
        try {
            const response = await fetch(`/api/users/search?username=${encodeURIComponent(username)}`);

            if (!response.ok) {
                message.error("User not found");
                return;
            }

            const user: UserRecipient = await response.json();
            props.onAddUser(user);
            setCurrentUsername("");

        } catch {
            message.error("Error searching for user");
        }
    }

    const validateUsername = (username: string) => {
        const usernameRegex = /^[a-zA-Z0-9-_]+$/;
        if (!usernameRegex.test(username)) {
            message.error("Invalid username format");
            return false;
        }
        return true;
    }

    return (
        <Flex vertical>
            <Flex>
                <Input placeholder="Search user..." onChange={(e) => setCurrentUsername(e.target.value)} onPressEnter={() => searchUser(currentUsername)} />
                <Button type="primary" onClick={() => searchUser(currentUsername)}>Add</Button>
            </Flex>
            <List>
                {props.users.map((user) => (
                    <List.Item key={user.id}>
                        <Flex justify="space-between" align="center" style={{ width: "100%" }}>
                            <span>{user.username}</span>
                            <Button type="link" danger onClick={() => props.onRemoveUser(user.id)}>Remove</Button>
                        </Flex>
                    </List.Item>
                ))}
            </List>
        </Flex>
    )
}
export default SelectUsers;