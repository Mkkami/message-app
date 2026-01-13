import { Button, Form, Input, Modal } from "antd";
import { createContext, useContext, useState } from "react";
import { keyService } from "../service/keyService";
import { mapApiKeysToUserKeys, type UserKeyBundle } from "../types/keys";

interface UserContextType {
    tempPassword: string | null;

    keys: UserKeyBundle | null;

    setKeys: (keys: UserKeyBundle | null) => void;
    setTempPassword: (password: string | null) => void;
    logout: () => void;
    getKeys: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({children}: {children: React.ReactNode}) => {
    const [keys, setKeys] = useState<UserKeyBundle | null>(null);
    const [tempPassword, setTempPassword] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const logout = () => {
        // setUsername(null);
        setKeys(null);
        setTempPassword(null);
        // api do wyrzucenia sesji
    }

    const getKeys = async () => {
        if (!tempPassword) {
            setIsModalOpen(true);
            return;
        }

        try {
            const response = await fetch('/api/users/me/keys', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            console.log("Fetching keys response", response);

            if (!response.ok) {
                throw new Error("Failed to fetch keys");
            }

            const data = await response.json();

            const keys = mapApiKeysToUserKeys(data.keys);
            
            const decryptedKeys = await keyService.decryptAll(keys.keys, tempPassword, keys.keySalt);

            setKeys(decryptedKeys);

            console.log("Decrypted keys", decryptedKeys);

        } catch (error) {
            console.error("Error fetching or decrypting keys:", error);
            logout();
        } finally {
            //

        }
    }

    const handlePasswordSubmit = (values: {password: string}) => {
        //  validate with backend??
        setTempPassword(values.password);
        setIsModalOpen(false);
    }

    return (
        <UserContext.Provider value={{
            keys, tempPassword,
            setKeys, setTempPassword, logout, getKeys
        }}>
            {children}
            <Modal
                title="Input password"
                open={isModalOpen}
                footer={null}
                closable={false}
                maskClosable={false}
            >
                <Form
                    onFinish={handlePasswordSubmit}
                    layout="vertical"
                >
                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[{ required: true }]}
                    >
                        <Input.Password autoFocus/>
                    </Form.Item>
                    <Button type="primary" htmlType="submit">Unlock</Button>
                </Form>
            </Modal>
        </UserContext.Provider>
    )
}

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser muse be used within UserProvider");
    return context;
}