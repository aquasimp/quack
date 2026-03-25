/**
 * E2E Encryption Module — Client-side only
 * Uses Web Crypto API for ECDH key exchange + AES-GCM encryption
 * Messages are encrypted before leaving the browser
 */

// Generate ECDH key pair for a user
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  );
}

// Export public key as base64 string (to store on server/share with others)
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

// Import a public key from base64 string
export async function importPublicKey(base64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );
}

// Export private key as base64 (for local storage persistence)
export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('pkcs8', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

// Import private key from base64
export async function importPrivateKey(base64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'pkcs8',
    raw,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  );
}

// Derive a shared AES-GCM key from our private key + their public key
async function deriveSharedKey(privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> {
  return await crypto.subtle.deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt a message using AES-GCM with a shared key
export async function encryptMessage(
  plaintext: string,
  privateKey: CryptoKey,
  recipientPublicKey: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const sharedKey = await deriveSharedKey(privateKey, recipientPublicKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    sharedKey,
    encoded
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

// Decrypt a message using AES-GCM with a shared key
export async function decryptMessage(
  ciphertext: string,
  iv: string,
  privateKey: CryptoKey,
  senderPublicKey: CryptoKey
): Promise<string> {
  const sharedKey = await deriveSharedKey(privateKey, senderPublicKey);
  const encryptedData = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const ivData = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivData },
    sharedKey,
    encryptedData
  );

  return new TextDecoder().decode(decrypted);
}

// For group chats: derive a deterministic group key from a shared secret
export async function deriveGroupKey(sharedSecret: string): Promise<CryptoKey> {
  const encoded = new TextEncoder().encode(sharedSecret);
  const hash = await crypto.subtle.digest('SHA-256', encoded);

  return await crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt with a group key
export async function encryptWithGroupKey(
  plaintext: string,
  groupKey: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    groupKey,
    encoded
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

// Decrypt with a group key
export async function decryptWithGroupKey(
  ciphertext: string,
  iv: string,
  groupKey: CryptoKey
): Promise<string> {
  const encryptedData = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const ivData = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivData },
    groupKey,
    encryptedData
  );

  return new TextDecoder().decode(decrypted);
}

// Store keys in localStorage
export function storeKeys(userId: string, publicKey: string, privateKey: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`qwack_pub_${userId}`, publicKey);
    localStorage.setItem(`qwack_priv_${userId}`, privateKey);
  }
}

// Retrieve keys from localStorage
export function getStoredKeys(userId: string): { publicKey: string; privateKey: string } | null {
  if (typeof window === 'undefined') return null;
  const publicKey = localStorage.getItem(`qwack_pub_${userId}`);
  const privateKey = localStorage.getItem(`qwack_priv_${userId}`);
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey };
}
