
export interface KeyPair {
    publicKey: string;
    privateKey: string;
}

export interface UserKeyBundle {
    signing: KeyPair; // ed25519
    encryption: KeyPair; //x25519
}

export interface FullUserKeys {
    keys: UserKeyBundle;
    keySalt: string;
}

export interface apiKeys {
    signing_pub_key: string;
    encryption_pub_key: string;

    signing_priv_key: string;
    encryption_priv_key: string;

    key_salt: string;
}

export const mapApiKeysToUserKeys = (apiKeys: apiKeys): FullUserKeys => {
    return {
        keys: {
            signing: {
                publicKey: apiKeys.signing_pub_key,
                privateKey: apiKeys.signing_priv_key,
            },
            encryption: {
                publicKey: apiKeys.encryption_pub_key,
                privateKey: apiKeys.encryption_priv_key,
            },
        },
        keySalt: apiKeys.key_salt,
    }
}