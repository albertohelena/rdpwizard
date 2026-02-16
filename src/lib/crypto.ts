import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key.length !== 64) {
        throw new Error(
            'ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Generate with: openssl rand -hex 32'
        );
    }
    return Buffer.from(key, 'hex');
}

export interface EncryptedData {
    encrypted: string; // base64
    iv: string; // base64
    authTag: string; // base64
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns the encrypted data, initialization vector, and authentication tag.
 */
export function encryptApiKey(plaintext: string): EncryptedData {
    const key = getEncryptionKey();
    const iv = randomBytes(16);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return {
        encrypted,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
    };
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * Used exclusively in server-side API routes.
 */
export function decryptApiKey(
    encryptedKey: string,
    iv: string,
    authTag: string
): string {
    const key = getEncryptionKey();
    const decipher = createDecipheriv(
        ALGORITHM,
        key,
        Buffer.from(iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));

    let decrypted = decipher.update(encryptedKey, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Returns a display hint for an API key (last 4 characters).
 */
export function getKeyHint(apiKey: string): string {
    if (apiKey.length <= 4) return '****';
    return `...${apiKey.slice(-4)}`;
}
