import { Button, Flex, QRCode, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import TwoFAInput from "../components/TwoFAInput";
import { API_CONFIG } from "../config/api";

interface TotpSetup {
    totp_uri: string;
    secret: string;
}

const {Title} = Typography
 
function TwoFactorAuth({mode}: {mode: "setup" | "verify"}) {
    const [secretOpen, setSecretOpen] = useState(false);
    const [props, setProps] = useState<TotpSetup | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetch2FASetup = async () => {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/2fa/setup`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                navigate('/2fa/verify')
            }

            const data = await response.json();

            setProps(data);
        } catch (error) {
            console.error('Error fetching 2FA setup:', error);
        }
    };

    useEffect(() => {
        if (mode === "setup")
            fetch2FASetup();
        else
            setLoading(false);
    }, [mode, fetch2FASetup]);

    

    if (loading || (!props && mode === "setup")) {
        return <div>Loading...</div>;
    }

    return (
        <Flex vertical align="center" justify="center" style={{ minHeight: "94vh", gap: '20px'}} >

            {(mode === "setup" && props) &&
            <>
                <Title level={2}>Two-Factor Authentication Setup</Title>
                <QRCode value={props?.totp_uri} size={300}/>
                {secretOpen && <div>Secret: {props.secret}</div>}
                <Button onClick={() => setSecretOpen(!secretOpen)}>
                    {secretOpen ? "Hide Secret" : "Show Secret"}
                </Button>
            </>
            }

            <TwoFAInput />

        </Flex>
    )
}
export default TwoFactorAuth;