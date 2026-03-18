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
 * @param {Uint8Array} kSalt
 */
async function generateKEK(password, kSalt) {
  const key = await argon2id({
    password: password,
    salt: kSalt,
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
async function encryptDEK(KEK, DEK) {
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

async function decryptString(KEK, cipherText, eIv) {
  const cryptoKey = await createCryptoKey(KEK);
  const decryptedBuffer = await decrypt(
    base64ToBuffer(cipherText),
    cryptoKey,
    base64ToBuffer(eIv)
  );

  return bufferToString(decryptedBuffer);
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
    eIv: bufferToBase64(iv),
  };
}

/**
 * @param {Uint8Array} DEK
 * @param {string} cipherText
 * @param {string} iv
 * @returns {Promise<Record<string, any>>}
 */
async function decryptEntry(DEK, cipherText, eIv) {
  const cryptoKey = await createCryptoKey(DEK);
  const decryptedBuffer = await decrypt(
    base64ToBuffer(cipherText),
    cryptoKey,
    base64ToBuffer(eIv)
  );

  return JSON.parse(bufferToString(decryptedBuffer));
}

/**
 * Derives a KEK from the password, generates a random DEK, encrypts the DEK,
 * and returns base64-encoded values for storage/transmission.
 * @param {string} password
 * @returns {Promise<{eDEK: string, kSalt: string, rSalt: string, iv: string}>}
 */
async function createVaultKey(password) {
  const kSalt = generateSalt();
  const rSalt = generateSalt();
  const bufferKEK = await generateKEK(password, kSalt);
  const bufferRKEK = await generateKEK(password, rSalt);
  const bufferDEK = window.crypto.getRandomValues(new Uint8Array(32));

  const { eDEK, iv: kIv } = await encryptDEK(bufferKEK, bufferDEK);
  const { eDEK: reDEK, iv: rIv } = await encryptDEK(bufferRKEK, bufferDEK);

  return {
    eDEK: bufferToBase64(eDEK),
    reDEK: bufferToBase64(reDEK),
    kSalt: bufferToBase64(kSalt),
    rSalt: bufferToBase64(rSalt),
    kIv: bufferToBase64(kIv),
    rIv: bufferToBase64(rIv),
    bufferKEK,
    bufferRKEK,
    bufferDEK,
  };
}

const P = (1n << 127n) - 1n;

function bigIntToBuffer(val) {
  let hex = val.toString(16);
  if (hex.length % 2 != 0) hex = '0' + hex;
  return Uint8Array.fromHex(hex);
}

function bufferToBigInt(buffer) {
  return BigInt('0x' + buffer.toHex());
}

function generateFAttributes() {
  const bufferA2R = new Uint8Array(16);
  const bufferA1R = new Uint8Array(16);
  crypto.getRandomValues(bufferA2R);
  crypto.getRandomValues(bufferA1R);

  const bigIntA2 = bufferToBigInt(bufferA2R) % P;
  const bigIntA1 = bufferToBigInt(bufferA1R) % P;

  const bufferA2 = bigIntToBuffer(bigIntA2);
  const bufferA1 = bigIntToBuffer(bigIntA1);

  return { a2: bufferToBase64(bufferA2), a1: bufferToBase64(bufferA1) };
}

/**
 * @param {Uint8Array} KEK
 */
async function generateRSAKeyPair(KEK) {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const publicKeyBuffer = await window.crypto.subtle.exportKey(
    'spki',
    keyPair.publicKey
  );
  const privateKeyBuffer = await window.crypto.subtle.exportKey(
    'pkcs8',
    keyPair.privateKey
  );

  const cryptoKey = await createCryptoKey(KEK);
  const iv = generateIV();
  const encryptedPrivateKeyBuffer = await encrypt(
    new Uint8Array(privateKeyBuffer),
    cryptoKey,
    iv
  );

  return {
    publicKey: bufferToBase64(publicKeyBuffer),
    encryptedPrivateKey: bufferToBase64(encryptedPrivateKeyBuffer),
    rsaIv: bufferToBase64(iv),
    decryptedPrivateKey: new Uint8Array(privateKeyBuffer),
  };
}

/**
 *
 * @param {Uint8Array} RKEK
 * @param {string} receiverId
 * @param {Object} fAttributes
 */
function generateShard(RKEK, receiverId, fAttributes) {
  const x = BigInt('0x' + receiverId);
  const bigIntA2 = bufferToBigInt(base64ToBuffer(fAttributes.a2));
  const bigIntA1 = bufferToBigInt(base64ToBuffer(fAttributes.a1));

  // split 32 byte RKEK into 11, 11, 10 byte blocks
  // and convert them to BigInt
  const blocks = [
    bufferToBigInt(RKEK.subarray(0, 11)),
    bufferToBigInt(RKEK.subarray(11, 22)),
    bufferToBigInt(RKEK.subarray(22, 32)),
  ];

  // this will create the 3 different f(x) and return back the 3 y values for each
  // RKEK block
  const points = blocks.map((yIntercept) => {
    const x2 = (x * x) % P;

    const term1 = (x2 * bigIntA2) % P;
    const term2 = (x * bigIntA1) % P;

    return (term2 + term1 + yIntercept) % P;
  });

  // values to base64
  const pointsBase64 = points.map((shardBlock) =>
    bufferToBase64(bigIntToBuffer(shardBlock))
  );

  return {
    receiverId,
    shard: pointsBase64.join(':'),
  };
}

/**
 * Encrypts a shard string using the recipient's RSA public key.
 * @param {string} publicKeyBase64 - Base64-encoded SPKI public key
 * @param {string} shardString - The shard string to encrypt
 * @returns {Promise<string>} Base64-encoded RSA ciphertext
 */
async function encryptShardWithRSA(publicKeyBase64, shardString) {
  const publicKeyBuffer = base64ToBuffer(publicKeyBase64);
  const publicKey = await window.crypto.subtle.importKey(
    'spki',
    publicKeyBuffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );

  const shardBuffer = stringToBuffer(shardString);
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    shardBuffer
  );

  return bufferToBase64(encryptedBuffer);
}

async function decryptPrivateKey(encryptedPrivateKey, password, salt, iv) {
  const kek = await generateKEK(password, base64ToBuffer(salt));
  const cryptoKey = await createCryptoKey(kek);
  const decryptedBuffer = await decrypt(
    base64ToBuffer(encryptedPrivateKey),
    cryptoKey,
    base64ToBuffer(iv)
  );
  return new Uint8Array(decryptedBuffer);
}

// Alias for clarity in recovery flow
const decryptEphemeralPrivateKey = decryptPrivateKey;

async function decryptShardWithRSA(privateKeyBuffer, encryptedShardBase64) {
  const privateKey = await window.crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['decrypt']
  );

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    base64ToBuffer(encryptedShardBase64)
  );

  return bufferToString(decryptedBuffer);
}

/**
 * Reconstructs the RKEK from exactly k shards
 * points: array of {x: BigInt, y: BigInt[]}
 */
function reconstructRKEK(points) {
  if (!Array.isArray(points) || points.length < 3) {
    throw new Error('At least 3 points are required to reconstruct RKEK.');
  }

  const selectedPoints = points.slice(0, 3);
  const segmentLengths = [11, 11, 10];
  const segments = [];

  for (let segmentIndex = 0; segmentIndex < 3; segmentIndex++) {
    const segmentPoints = selectedPoints.map((point) => {
      if (!Array.isArray(point.y) || point.y.length < 3) {
        throw new Error('Each point must include 3 y-values.');
      }

      return { x: point.x, y: point.y[segmentIndex] };
    });

    const yIntercept = lagrangeInterpolate(segmentPoints, P);
    segments.push(
      padBuffer(bigIntToBuffer(yIntercept), segmentLengths[segmentIndex])
    );
  }

  return new Uint8Array([...segments[0], ...segments[1], ...segments[2]]);
}

function padBuffer(buffer, totalLength) {
  if (buffer.length === totalLength) return buffer;
  const newBuf = new Uint8Array(totalLength);
  newBuf.set(buffer, totalLength - buffer.length);
  return newBuf;
}

function modPow(base, exponent, m) {
  let res = 1n;
  base = base % m;
  while (exponent > 0n) {
    if (exponent % 2n === 1n) res = (res * base) % m;
    base = (base * base) % m;
    exponent = exponent / 2n;
  }
  return res;
}

function mod(n, p) {
  return ((n % p) + p) % p;
}

function modInverse(a, p) {
  let t = 0n;
  let newT = 1n;
  let r = p;
  let newR = mod(a, p);

  while (newR !== 0n) {
    const q = r / newR;
    const nextT = t - q * newT;
    t = newT;
    newT = nextT;

    const nextR = r - q * newR;
    r = newR;
    newR = nextR;
  }

  if (r !== 1n) {
    throw new Error('Modular inverse does not exist.');
  }

  return mod(t, p);
}

function lagrangeInterpolate(points, p) {
  let intercept = 0n;

  for (let i = 0; i < points.length; i++) {
    let numerator = 1n;
    let denominator = 1n;

    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      numerator = mod(numerator * mod(-points[j].x, p), p);
      denominator = mod(denominator * mod(points[i].x - points[j].x, p), p);
    }

    const liAtZero = mod(numerator * modInverse(denominator, p), p);
    intercept = mod(intercept + mod(points[i].y * liAtZero, p), p);
  }

  return intercept;
}


export {
  createVaultKey,
  encryptDEK,
  generateKEK,
  base64ToBuffer,
  bufferToBase64,
  decryptDEK,
  encryptEntry,
  decryptEntry,
  generateFAttributes,
  generateRSAKeyPair,
  generateShard,
  encryptShardWithRSA,
  decryptPrivateKey,
  decryptEphemeralPrivateKey,
  decryptShardWithRSA,
  reconstructRKEK,
  encryptString,
  decryptString,
};
