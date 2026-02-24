import argon2 from "hash-wasm";

export async function generateKEK(password, salt) {
  const key = await argon2.argon2id({
    password: password,
    salt: salt,
    iterations: 3,
    memorySize: 65536,
    parallelism: 4,
    hashLength: 32,
    outputType: "binary",
  });

  return key;
}

export async function encryptDEK(KEK, DEK) {
  const encoder = new TextEncoder();
  const dekBuffer = encoder.encode(DEK);

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    KEK,
    "AES-GCM",
    false,
    ["encrypt"],
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    cryptoKey,
    dekBuffer,
  );

  return {
    eDEK: new Uint8Array(encryptedBuffer),
    iv,
  };
}
