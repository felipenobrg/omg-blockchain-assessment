const bufferToHex = (buffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const sha256Hex = async (text) => {
  const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return bufferToHex(digest);
};

export const generateWallet = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );

  const spki = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const publicKeyHex = bufferToHex(spki);

  return { publicKeyHex, privateKey: keyPair.privateKey };
};

export const signTransaction = async ({ fromAddress, toAddress, amount, timestamp }, privateKey) => {
  const hashHex = await sha256Hex(`${fromAddress}${toAddress}${amount}${timestamp}`);

  const signatureBuffer = await window.crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(hashHex)
  );

  return bufferToHex(signatureBuffer);
};
