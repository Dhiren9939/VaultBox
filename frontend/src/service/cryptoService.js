import { argon2id } from 'hash-wasm';

function generateSalt() {
  const salt = window.crypto.getRandomValues(new Uint8Array(32));
  return salt;
}

function generateIV() {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  return iv;
}

/**
 * @param {Uint8Array} key
 */
async function createCryptoKey(key) {
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    key,
    'AES-GCM',
    false,
    ['encrypt', 'decrypt']
  );
  return cryptoKey;
}

/**
 * @param {Uint8Array} cipherText
 * @param {CryptoKey} cryptoKey
 * @param {Uint8Array} iv
 */
async function encrypt(cipherText, cryptoKey, iv) {
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    cryptoKey,
    cipherText
  );

  return encryptedBuffer;
}

/**
 * @param {Uint8Array} cipherText
 * @param {CryptoKey} cryptoKey
 * @param {Uint8Array} iv
 */
async function decrypt(cipherText, cryptoKey, iv) {
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    cryptoKey,
    cipherText
  );

  return decryptedBuffer;
}

/**
 * @param {string} str
 */
function stringToBuffer(str) {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(str);
  return buffer;
}

/**
 * @param {ArrayBuffer} buffer
 */
function bufferToString(buffer) {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}

/**
 * @param {Uint8Array} buffer
 */
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  return bytes.toBase64();
}

/**
 * @param {string} string
 */
function base64ToBuffer(string) {
  return Uint8Array.fromBase64(string);
}

/**
 * @param {string} password
 * @param {Uint8Array} salt
 */
export async function generateKEK(password, salt) {
  const key = await argon2id({
    password: password,
    salt: salt,
    iterations: 3,
    memorySize: 65536,
    parallelism: 4,
    hashLength: 32,
    outputType: 'binary',
  });

  return key;
}

/**
 * @param {Uint8Array} KEK
 * @param {Uint8Array} DEK
 */
export async function encryptDEK(KEK, DEK) {
  const cryptoKey = await createCryptoKey(KEK);
  const iv = generateIV();
  const encryptedBuffer = await encrypt(DEK, cryptoKey, iv);

  return {
    eDEK: new Uint8Array(encryptedBuffer),
    iv,
  };
}

async function decryptDEK(KEK, eDEK, iv) {
  const cryptoKey = await createCryptoKey(KEK);
  const decryptedBuffer = await decrypt(eDEK, cryptoKey, iv);

  return new Uint8Array(decryptedBuffer);
}

async function encryptString(KEK, string) {
  const cryptoKey = await createCryptoKey(KEK);
  const iv = generateIV();
  const buffer = stringToBuffer(string);
  const encryptedBuffer = await encrypt(buffer, cryptoKey, iv);
  const encryptedString = bufferToBase64(encryptedBuffer);
  return { encryptedString, iv };
}

/**
 * @param {Uint8Array} DEK
 * @param {Record<string, any>} data
 * @returns {Promise<{cipherText: string, iv: string}>}
 */
async function encryptEntry(DEK, data) {
  const cryptoKey = await createCryptoKey(DEK);
  const iv = generateIV();
  const buffer = stringToBuffer(JSON.stringify(data));
  const encryptedBuffer = await encrypt(buffer, cryptoKey, iv);

  return {
    cipherText: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
  };
}

/**
 * @param {Uint8Array} DEK
 * @param {string} cipherText
 * @param {string} iv
 * @returns {Promise<Record<string, any>>}
 */
async function decryptEntry(DEK, cipherText, iv) {
  const cryptoKey = await createCryptoKey(DEK);
  const decryptedBuffer = await decrypt(
    base64ToBuffer(cipherText),
    cryptoKey,
    base64ToBuffer(iv)
  );

  return JSON.parse(bufferToString(decryptedBuffer));
}

/**
 * Derives a KEK from the password, generates a random DEK, encrypts the DEK,
 * and returns base64-encoded values for storage/transmission.
 * @param {string} password
 * @returns {Promise<{eDEK: string, salt: string, iv: string}>}
 */
export async function createVaultKey(password) {
  const salt = generateSalt();
  const bufferKEK = await generateKEK(password, salt);
  const bufferDEK = window.crypto.getRandomValues(new Uint8Array(32));
  const { eDEK, iv } = await encryptDEK(bufferKEK, bufferDEK);

  return {
    eDEK: bufferToBase64(eDEK),
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
  };
}

export { base64ToBuffer, decryptDEK, encryptEntry, decryptEntry };
