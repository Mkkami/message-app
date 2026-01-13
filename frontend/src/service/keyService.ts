import { ed25519, x25519 } from "@noble/curves/ed25519.js";
import { bytesToHex, hexToBytes } from "@noble/curves/utils.js";
import type { KeyPair, UserKeyBundle } from "../types/keys";

const enc = new TextEncoder();
const ITERATIONS = 600_000;

export const keyService = {

    // KEY GEN -----------------------------
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

    // HELPER -----------------------------

    async deriveKeyFromPassword(password: string, saltHex: string, usage: "encrypt" | "decrypt" ): Promise<CryptoKey> {
        const salt = new Uint8Array(hexToBytes(saltHex));

        const baseKey = await window.crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            "PBKDF2",
            false,
            ["deriveKey"]
        )
        return window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 600000,
                hash: "SHA-256"
            },
            baseKey,
            { name: "AES-GCM", length: 256 },
            false,
            [usage]
        );
    },

    // ENCRYPTION -----------------------------

    async encryptPrivateKey(privateKeyHex: string, password: string, saltHex: string): Promise<string> {
        const privKeyBytes = new Uint8Array(hexToBytes(privateKeyHex));

        const aesKey = await this.deriveKeyFromPassword(password, saltHex, "encrypt");
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        const encryptedContent = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            aesKey,
            privKeyBytes
        );

        const combined = new Uint8Array(iv.length + encryptedContent.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encryptedContent), iv.length);

        return bytesToHex(combined);
    },

    // DECRYPTION -----------------------------

    async decryptPrivateKey(encryptedHex: string, password: string, saltHex: string): Promise<string> {
        try {
            const salt = hexToBytes(saltHex);
            const combined = hexToBytes(encryptedHex);

            const iv = combined.slice(0, 12);
            const encryptedContent = combined.slice(12);

            const aesKey = await this.deriveKeyFromPassword(password, saltHex, "decrypt");

            const decryptedContent = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                aesKey,
                encryptedContent
            );

            return bytesToHex(new Uint8Array(decryptedContent));
        } catch (error) {
            throw new Error("Decryption failed"); // złe hasło lub uszkodzone dane
        }
    },

    async decryptAll(keys: UserKeyBundle, password: string, saltHex: string): Promise<UserKeyBundle> {
        const signingPrivKey = await this.decryptPrivateKey(keys.signing.privateKey, password, saltHex);
        const encryptionPrivKey = await this.decryptPrivateKey(keys.encryption.privateKey, password, saltHex);

        return {
            signing: {
                publicKey: keys.signing.publicKey,
                privateKey: signingPrivKey,
            },
            encryption: {
                publicKey: keys.encryption.publicKey,
                privateKey: encryptionPrivKey,
            }
        }
    }
};