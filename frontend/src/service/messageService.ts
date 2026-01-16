import { bytesToHex, hexToBytes } from "@noble/curves/utils.js";
import type { UserRecipient } from "../types/user";
import { keyService } from "./keyService";

export const messageService = {

    async encryptMessage(
        text: string,
        file: File | null,
        recipients: UserRecipient[],
        myPrivateKey: string
    ): Promise<any> {
        let attachment = null;
        if (file) {
            attachment = {
                name: file.name,
                type: file.type,
                data: await this.fileToBase64(file)
            }
        }
        const payload = JSON.stringify({
            text,
            attachment,
            timestamp: Date.now()
        })

        const messageAesKey = window.crypto.getRandomValues(new Uint8Array(32));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        const encodedPayload = new TextEncoder().encode(payload);
        const cryptoKey = await window.crypto.subtle.importKey(
            "raw", messageAesKey, "AES-GCM", false, ["encrypt"]
        );

        const encryptedContent = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            cryptoKey,
            encodedPayload
        );

        const ciphertextWithIv = bytesToHex(new Uint8Array([...iv, ...new Uint8Array(encryptedContent)]));

        const encryptedRecipients = await Promise.all(
            recipients.map(async (r) => {
                const sharedKey = await keyService.deriveSharedKey(myPrivateKey, r.publicKey);
                
                const encKeyForRecipient = await this.encryptAesKey(messageAesKey, sharedKey);

                return {
                    recipient_id: r.id,
                    enc_aes_key: encKeyForRecipient,
                }
            })
        );

        return {
            ciphertext: ciphertextWithIv,
            recipients: encryptedRecipients,
        }

    },

    // Decryption

    async decryptMessage(
        ciphertextWithIv: string,
        encAesKeyHex: string,
        senderPubKey: string,
        myPrivateKey: string,
    ): Promise<any> {
        const sharedKey = await keyService.deriveSharedKey(myPrivateKey, senderPubKey);
        const messageAesKey = await this.decryptAesKey(encAesKeyHex, sharedKey);

        const iv = hexToBytes(ciphertextWithIv).slice(0, 12);
        const ciphertext = hexToBytes(ciphertextWithIv).slice(12);

        const cryptoKey = await window.crypto.subtle.importKey(
            "raw", new Uint8Array(messageAesKey) , "AES-GCM", false, ["decrypt"]
        );

        const decryptedContent = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            cryptoKey,
            ciphertext
        );

        return JSON.parse(new TextDecoder().decode(decryptedContent));
    },

    // HELPERSS -----------------------------
    async fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    async encryptAesKey(aesKey: Uint8Array, sharedKey: Uint8Array): Promise<string> {
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const cryptoKey = await window.crypto.subtle.importKey(
            "raw", new Uint8Array(sharedKey), "AES-GCM", false, ["encrypt"]
        );
        const enc = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            cryptoKey,
            new Uint8Array(aesKey)
        );
        return bytesToHex(new Uint8Array([...iv, ...new Uint8Array(enc)]));
    },

    async decryptAesKey(encAesKeyHex: string, sharedKey: Uint8Array): Promise<Uint8Array> {
        const combined = hexToBytes(encAesKeyHex);
        const iv = combined.slice(0, 12);
        const encryptedAesKey = combined.slice(12);
        const cryptoKey = await window.crypto.subtle.importKey(
            "raw", new Uint8Array(sharedKey), "AES-GCM", false, ["decrypt"]
        );
        const decryptedAesKey = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            cryptoKey,
            encryptedAesKey
        );
        return new Uint8Array(decryptedAesKey);
    }

}