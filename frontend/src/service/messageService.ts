import { ed25519, x25519 } from "@noble/curves/ed25519.js";
import { bytesToHex, hexToBytes } from "@noble/curves/utils.js";
import type { Message } from "../types/message";
import type { UserRecipient } from "../types/user";
import { keyService } from "./keyService";

export const messageService = {
    
    async encryptMessage(
        text: string,
        file: File | null,
        recipients: UserRecipient[],
        signingKey: string
    ): Promise<any> {
        // generowanie klucze eph dla jednej wiadomości
        const encPriv = x25519.utils.randomSecretKey();
        const encKey = bytesToHex(encPriv);
        const encPub = x25519.getPublicKey(encPriv);
        const encPubHex = bytesToHex(encPub);

        // przygotowanie payloadu
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

        // utworzenie klucza aes i iv
        const messageAesKey = window.crypto.getRandomValues(new Uint8Array(32));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        // szyfrowanie wiadomości
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

        // podpis
        const dataToSign = hexToBytes(ciphertextWithIv + encPubHex)

        const signatureBytes = ed25519.sign(dataToSign, hexToBytes(signingKey));
        const signatureHex = bytesToHex(new Uint8Array(signatureBytes));

        // szyfrowanie klucza aes dla każdego odbiorcy
        const encryptedRecipients = await Promise.all(
            recipients.map(async (r) => {
                const sharedKey = await keyService.deriveSharedKey(encKey, r.publicKey);
                
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
            signature: signatureHex,
            ephKey: encPubHex,
        }

    },

    // Decryption

    async decryptMessage(
        ciphertextWithIv: string,
        signatureHex: string,
        encAesKeyHex: string,
        ephKeyHex: string,
        senderSignKey: string,
        myEncKey: string
    ): Promise<Message> {
        // sprawdzenie podpisu
        const dataToVerify = hexToBytes(ciphertextWithIv + ephKeyHex);
        const signatureBytes = hexToBytes(signatureHex);
        const senderSignPubKeyBytes = hexToBytes(senderSignKey);

        const isValid = ed25519.verify(signatureBytes, dataToVerify, senderSignPubKeyBytes);

        if (!isValid) {
            throw new Error("Invalid message signature");
        }

        // odszyfrowanie klucza aes
        const sharedKey = await keyService.deriveSharedKey(myEncKey, ephKeyHex);
        const messageAesKey = await this.decryptAesKey(encAesKeyHex, sharedKey);

        // przygotowanie danych
        const fullBytes = hexToBytes(ciphertextWithIv);
        const iv = fullBytes.slice(0,12);
        const ciphertext = fullBytes.slice(12);
        

        const cryptoKey = await window.crypto.subtle.importKey(
            "raw", new Uint8Array(messageAesKey) , "AES-GCM", false, ["decrypt"]
        );

        // odszyfrowanie wiadomości
        const decryptedContent = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            cryptoKey,
            ciphertext
        );

        return JSON.parse(new TextDecoder().decode(decryptedContent));
    },

    // HELPERS -----------------------------
    async fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    // szyfrowanie klucza aes dla odbiorcy
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

    // odszyfrowanie klucza aes dla odbiorcy
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