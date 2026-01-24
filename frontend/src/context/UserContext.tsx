import message from "antd/es/message";
import { createContext, useContext, useState } from "react";
import { API_CONFIG } from "../config/api";
import { keyService } from "../service/keyService";
import { mapApiKeysToUserKeys, type UserKeyBundle } from "../types/keys";

interface UserContextType {
    username: string | null;

    isLoggedIn: boolean;
    
    tempPassword: string | null;

    keys: UserKeyBundle | null;


    setUsername: (username: string | null) => void;
    setTempPassword: (password: string | null) => void;
    setIsLoggedIn: (loggedIn: boolean) => void;
    setKeys: (keys: UserKeyBundle | null) => void;
    logout: () => void;
    getKeys: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({children}: {children: React.ReactNode}) => {
    const [username, setUsername] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [keys, setKeys] = useState<UserKeyBundle | null>(null);
    const [tempPassword, setTempPassword] = useState<string | null>(null);
    // const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const logout = async () => {
        // setUsername(null);
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/logout`, {
                method: 'POST',
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error("Logout failed");
            }
            message.success("Logged out successfully");
        } catch {
            message.error("Error during logout");
        }
        setKeys(null);
        setTempPassword(null);
        setUsername(null);
        setIsLoggedIn(false);
    }

    const getKeys = async () => {
        if (!tempPassword) {
            window.location.href = '/login';
            return;
        }

        try {
            const response = await fetch('/api/users/me/keys', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            // console.log("Fetching keys response", response);

            if (!response.ok) {
                throw new Error("Failed to fetch keys");
            }

            const data = await response.json();

            const keys = mapApiKeysToUserKeys(data.keys);
            
            const decryptedKeys = await keyService.decryptAll(keys.keys, tempPassword, keys.keySalt);

            setKeys(decryptedKeys);

            // console.log("Decrypted keys", decryptedKeys);

        } catch {
            // console.error("Error fetching or decrypting keys:");
            logout();
        } finally {
            //

        }
    }

    return (
        <UserContext.Provider value={{
            username, keys, tempPassword, isLoggedIn,
            setUsername, setTempPassword, setKeys, setIsLoggedIn, logout, getKeys
        }}>
            {children}
        </UserContext.Provider>
    )
}

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used within UserProvider");
    return context;
}