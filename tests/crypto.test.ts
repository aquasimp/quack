import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateKeyPair,
  exportPublicKey,
  importPublicKey,
  exportPrivateKey,
  importPrivateKey,
  encryptMessage,
  decryptMessage,
} from '../src/lib/crypto/e2eEncryption';

describe('Web Crypto E2E Encryption Module', () => {
  test('generates valid ECDH key pairs with P-256 curve', async () => {
    const keyPair = await generateKeyPair();
    assert.ok(keyPair.publicKey, 'publicKey should be generated');
    assert.ok(keyPair.privateKey, 'privateKey should be generated');
    assert.equal(keyPair.publicKey.algorithm.name, 'ECDH');
    assert.equal((keyPair.publicKey.algorithm as EcKeyAlgorithm).namedCurve, 'P-256');
  });

  test('exports and imports public keys losslessly as base64', async () => {
    const keyPair = await generateKeyPair();
    const exportedBase64 = await exportPublicKey(keyPair.publicKey);
    assert.ok(exportedBase64.length > 20, 'exported public key should be non-empty base64');

    const imported = await importPublicKey(exportedBase64);
    assert.equal(imported.algorithm.name, 'ECDH');
    assert.equal((imported.algorithm as EcKeyAlgorithm).namedCurve, 'P-256');
    assert.equal(imported.type, 'public');
  });

  test('exports and imports private keys losslessly as base64', async () => {
    const keyPair = await generateKeyPair();
    const exportedBase64 = await exportPrivateKey(keyPair.privateKey);
    assert.ok(exportedBase64.length > 20, 'exported private key should be non-empty base64');

    const imported = await importPrivateKey(exportedBase64);
    assert.equal(imported.algorithm.name, 'ECDH');
    assert.equal((imported.algorithm as EcKeyAlgorithm).namedCurve, 'P-256');
    assert.equal(imported.type, 'private');
  });

  test('performs full ECDH key exchange, encryption, and decryption between two users', async () => {
    const alice = await generateKeyPair();
    const bob = await generateKeyPair();

    const originalSecret = 'Confidential placement assessment token: 9482-XYZ';

    // Alice encrypts for Bob
    const { ciphertext, iv } = await encryptMessage(originalSecret, alice.privateKey, bob.publicKey);
    assert.notEqual(ciphertext, originalSecret, 'ciphertext must not match plaintext');
    assert.ok(ciphertext.length > 0);
    assert.ok(iv.length > 0);

    // Bob decrypts with his private key and Alice's public key
    const decrypted = await decryptMessage(ciphertext, iv, bob.privateKey, alice.publicKey);
    assert.equal(decrypted, originalSecret, 'decrypted text must match original plaintext');
  });

  test('detects tampered ciphertext and rejects decryption', async () => {
    const alice = await generateKeyPair();
    const bob = await generateKeyPair();

    const originalSecret = 'Secret exam questions';
    const { ciphertext, iv } = await encryptMessage(originalSecret, alice.privateKey, bob.publicKey);

    // Corrupt the ciphertext
    const rawCipher = atob(ciphertext);
    const tamperedCipher = btoa(
      rawCipher.slice(0, -2) + String.fromCharCode(rawCipher.charCodeAt(rawCipher.length - 1) ^ 0xff)
    );

    await assert.rejects(
      async () => {
        await decryptMessage(tamperedCipher, iv, bob.privateKey, alice.publicKey);
      },
      /operation failed|OperationError|bad decrypt/i,
      'tampered ciphertext must fail authentication tag check in AES-GCM'
    );
  });

  test('detects tampered IV and rejects decryption', async () => {
    const alice = await generateKeyPair();
    const bob = await generateKeyPair();

    const { ciphertext, iv } = await encryptMessage('Message with bad IV', alice.privateKey, bob.publicKey);

    // Corrupt the IV
    const rawIv = atob(iv);
    const tamperedIv = btoa(
      String.fromCharCode(rawIv.charCodeAt(0) ^ 0x01) + rawIv.slice(1)
    );

    await assert.rejects(
      async () => {
        await decryptMessage(ciphertext, tamperedIv, bob.privateKey, alice.publicKey);
      },
      /operation failed|OperationError|bad decrypt/i,
      'tampered IV must fail AES-GCM authentication'
    );
  });
});
