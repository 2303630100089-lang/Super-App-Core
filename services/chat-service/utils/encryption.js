import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256-bit
const IV_LENGTH = 12;  // 96-bit recommended for GCM
const TAG_LENGTH = 16; // 128-bit auth tag

/**
 * Generate a new random 256-bit encryption key (hex string).
 */
export const generateKey = () => randomBytes(KEY_LENGTH).toString('hex');

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a single string: "<iv_hex>:<tag_hex>:<ciphertext_hex>"
 */
export const encrypt = (plaintext, keyHex) => {
  const key = Buffer.from(keyHex, 'hex');
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
};

/**
 * Decrypt a value produced by encrypt().
 * Returns the original plaintext string, or null if decryption fails.
 */
export const decrypt = (encryptedValue, keyHex) => {
  try {
    const [ivHex, tagHex, ciphertextHex] = encryptedValue.split(':');
    if (!ivHex || !tagHex || !ciphertextHex) return null;

    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
};
