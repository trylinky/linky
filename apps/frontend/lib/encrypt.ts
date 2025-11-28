'use server';

import 'server-only';

import { captureException } from '@sentry/nextjs';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;
const ITERATIONS = 100000;

interface EncryptedData {
  iv: string;
  salt: string;
  encrypted: string;
  authTag: string;
  version: number; // For future encryption format changes
}

/**
 * Derives an encryption key from the base key and salt
 */
function deriveKey(encryptionKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    encryptionKey,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    'sha256'
  );
}

/**
 * Encrypts a JSON object and returns a string
 */
export async function encrypt(
  data: unknown,
  encryptionKey?: string
): Promise<string> {
  const key = encryptionKey || process.env.ENCRYPTION_KEY || '';
  if (!key) {
    throw new Error('Encryption key is required');
  }

  try {
    // Validate and stringify the JSON data
    const jsonString = JSON.stringify(data);
    if (!jsonString) {
      throw new Error('Invalid JSON data');
    }

    // Generate salt and derive key
    const salt = crypto.randomBytes(SALT_LENGTH);
    const derivedKey = deriveKey(key, salt);

    // Generate IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    // Encrypt the data
    let encrypted = cipher.update(jsonString, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Combine all components
    const result: EncryptedData = {
      iv: iv.toString('base64'),
      salt: salt.toString('base64'),
      encrypted: encrypted,
      authTag: authTag.toString('base64'),
      version: 1,
    };

    // Return as base64 string
    return Buffer.from(JSON.stringify(result)).toString('base64');
  } catch (error) {
    captureException(error);
    throw new Error(`Encryption failed: ${(error as Error).message}`);
  }
}

/**
 * Decrypts a string back into a JSON object
 */
export async function decrypt<T = unknown>(
  encryptedString: string,
  encryptionKey?: string
): Promise<T> {
  const key = encryptionKey || process.env.ENCRYPTION_KEY || '';
  if (!key) {
    throw new Error('Encryption key is required');
  }

  try {
    // Parse the encrypted data structure
    const data: EncryptedData = JSON.parse(
      Buffer.from(encryptedString, 'base64').toString()
    );

    // Version check for future compatibility
    if (data.version !== 1) {
      throw new Error('Unsupported encryption version');
    }

    // Convert components back to buffers
    const iv = Buffer.from(data.iv, 'base64');
    const salt = Buffer.from(data.salt, 'base64');
    const authTag = Buffer.from(data.authTag, 'base64');

    // Derive the key
    const derivedKey = deriveKey(key, salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    // Set auth tag
    decipher.setAuthTag(authTag);

    // Decrypt the data
    let decrypted = decipher.update(data.encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    // Parse and return the JSON
    return JSON.parse(decrypted) as T;
  } catch (error) {
    captureException(error);
    throw new Error(`Decryption failed: ${(error as Error).message}`);
  }
}

/**
 * Validates that a string appears to be an encrypted payload
 */
export async function isEncrypted(data: string): Promise<boolean> {
  try {
    const decoded = JSON.parse(
      Buffer.from(data, 'base64').toString()
    ) as Partial<EncryptedData>;

    return !!(
      decoded.iv &&
      decoded.salt &&
      decoded.encrypted &&
      decoded.authTag &&
      decoded.version === 1
    );
  } catch {
    return false;
  }
}

/**
 * Changes the encryption key and re-encrypts data
 */
export async function reencrypt(
  encryptedData: string,
  currentKey: string,
  newKey: string
): Promise<string> {
  const decrypted = await decrypt(encryptedData, currentKey);
  return await encrypt(decrypted, newKey);
}
