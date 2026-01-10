import { ed25519, x25519 } from "@noble/curves/ed25519.js";
import { bytesToHex, hexToBytes } from "@noble/curves/utils.js";

export interface KeyPair {
    publicKey: string;
    privateKey: string;
}

export interface UserKeyBundle {
    signing: KeyPair; // ed25519
    encryption: KeyPair; //x25519
}

const enc = new TextEncoder();

export const keyService = {

    generateSigningKeys(): KeyPair {
        const privateKey = ed25519.utils.randomSecretKey();
        const publicKey = ed25519.getPublicKey(privateKey);

        return {
            publicKey: bytesToHex(publicKey),
            privateKey: bytesToHex(privateKey),
        };
    },

    generateEncryptionKeys(): KeyPair {
        const privateKey = x25519.utils.randomSecretKey();
        const publicKey = x25519.getPublicKey(privateKey);
        return {
            publicKey: bytesToHex(publicKey),
            privateKey: bytesToHex(privateKey),
        };
    },

    async generateAllKeys(): Promise<UserKeyBundle> {
        return {
            signing: this.generateSigningKeys(),
            encryption: this.generateEncryptionKeys(),
        }
    },

    async encryptPrivateKey(privateKeyHex: string, password: string, saltHex: string): Promise<string> {
        const salt = new Uint8Array(hexToBytes(saltHex));
        const privKeyBytes = new Uint8Array(hexToBytes(privateKeyHex));

        const baseKey = await window.crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            "PBKDF2",
            false,
            ["deriveKey"]
        );
        
        const aesKey = await window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 600000,
                hash: "SHA-256"
            },
            baseKey,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt"]
        );

        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        const encryptedContent = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            aesKey,
            privKeyBytes
        );

        // combine iv + ciphertext
        const combined = new Uint8Array(iv.length + encryptedContent.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encryptedContent), iv.length);

        return bytesToHex(combined);
    }

}


