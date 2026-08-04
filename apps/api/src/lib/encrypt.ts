import { captureException } from '@sentry/node';

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
 * Derives an encryption key from the base key and salt.
 *
 * WebCrypto rather than node:crypto's pbkdf2Sync: Workers guarantees the
 * former, and the parameters (PBKDF2-SHA256, 100k iterations, 32-byte output)
 * are identical, so ciphertext written by the previous implementation still
 * decrypts.
 */
async function deriveKey(
  encryptionKey: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(encryptionKey),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: KEY_LENGTH * 8 },
    false,
    ['encrypt', 'decrypt']
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
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const derivedKey = await deriveKey(key, salt);

    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // WebCrypto appends the auth tag to the ciphertext; the envelope stores
    // them separately, so split the trailing AUTH_TAG_LENGTH bytes back out.
    const sealed = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, tagLength: AUTH_TAG_LENGTH * 8 },
        derivedKey,
        new TextEncoder().encode(jsonString)
      )
    );

    const ciphertext = sealed.slice(0, sealed.length - AUTH_TAG_LENGTH);
    const authTag = sealed.slice(sealed.length - AUTH_TAG_LENGTH);

    // Combine all components
    const result: EncryptedData = {
      iv: Buffer.from(iv).toString('base64'),
      salt: Buffer.from(salt).toString('base64'),
      encrypted: Buffer.from(ciphertext).toString('base64'),
      authTag: Buffer.from(authTag).toString('base64'),
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
    const iv = new Uint8Array(Buffer.from(data.iv, 'base64'));
    const salt = new Uint8Array(Buffer.from(data.salt, 'base64'));
    const authTag = new Uint8Array(Buffer.from(data.authTag, 'base64'));
    const ciphertext = new Uint8Array(Buffer.from(data.encrypted, 'base64'));

    // Derive the key
    const derivedKey = await deriveKey(key, salt);

    // Re-join ciphertext and tag into the single buffer WebCrypto expects.
    const sealed = new Uint8Array(ciphertext.length + authTag.length);
    sealed.set(ciphertext);
    sealed.set(authTag, ciphertext.length);

    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: AUTH_TAG_LENGTH * 8 },
      derivedKey,
      sealed
    );

    // Parse and return the JSON
    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
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
