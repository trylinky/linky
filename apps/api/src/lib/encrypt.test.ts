import { decrypt, encrypt, isEncrypted, reencrypt } from './encrypt';
import { describe, expect, it } from 'vitest';

const KEY = 'test-key-for-fixture';

// Produced by the node:crypto implementation this task replaces. Existing
// integration tokens in production are encrypted exactly like this, so the
// WebCrypto version MUST decrypt it. If this test fails, every stored OAuth
// token becomes unreadable.
const LEGACY_CIPHERTEXT =
  'eyJpdiI6InZEMVNCN3FSOGZveXFza00iLCJzYWx0IjoialRKSEhtNzRnYU1ucGVYTjRiYnd3dz09IiwiZW5jcnlwdGVkIjoiTFZ3WU5reFpZU1JDWm5kNWVSTHhrWERoY0ZmZG5WTmxLcU1qL2U2aTVpeTU5dVQ3L0FhM3EyVmtYeThENWJ6RCIsImF1dGhUYWciOiJOMDE5R0RrQmVxVzhVZ2I1WFFrQVNBPT0iLCJ2ZXJzaW9uIjoxfQ==';

describe('encrypt/decrypt', () => {
  it('decrypts a payload produced by the previous node:crypto implementation', async () => {
    await expect(decrypt(LEGACY_CIPHERTEXT, KEY)).resolves.toEqual({
      accessToken: 'abc123',
      refreshToken: 'def456',
    });
  });

  it('round-trips a value', async () => {
    const encrypted = await encrypt({ hello: 'world' }, KEY);
    await expect(decrypt(encrypted, KEY)).resolves.toEqual({ hello: 'world' });
  });

  it('produces a different ciphertext each time (fresh salt and IV)', async () => {
    const a = await encrypt({ hello: 'world' }, KEY);
    const b = await encrypt({ hello: 'world' }, KEY);
    expect(a).not.toBe(b);
  });

  it('fails to decrypt with the wrong key', async () => {
    const encrypted = await encrypt({ hello: 'world' }, KEY);
    await expect(decrypt(encrypted, 'wrong-key')).rejects.toThrow(
      /Decryption failed/
    );
  });

  it('rejects a tampered auth tag', async () => {
    const encrypted = await encrypt({ hello: 'world' }, KEY);
    const parsed = JSON.parse(Buffer.from(encrypted, 'base64').toString());
    parsed.encrypted = Buffer.from('tampered').toString('base64');
    const tampered = Buffer.from(JSON.stringify(parsed)).toString('base64');

    await expect(decrypt(tampered, KEY)).rejects.toThrow(/Decryption failed/);
  });

  it('recognises its own output', async () => {
    await expect(isEncrypted(await encrypt({ a: 1 }, KEY))).resolves.toBe(true);
    await expect(isEncrypted('not-encrypted')).resolves.toBe(false);
  });

  it('re-encrypts under a new key', async () => {
    const encrypted = await encrypt({ hello: 'world' }, KEY);
    const rotated = await reencrypt(encrypted, KEY, 'new-key');
    await expect(decrypt(rotated, 'new-key')).resolves.toEqual({
      hello: 'world',
    });
  });
});
