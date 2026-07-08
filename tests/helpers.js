const crypto = require('node:crypto');

const bufferToHex = (buffer) => Buffer.from(buffer).toString('hex');

const createSignedTransaction = async ({ toAddress, amount, timestamp = Date.now() }) => {
  const subtle = crypto.webcrypto.subtle;
  const keyPair = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const spki = await subtle.exportKey('spki', keyPair.publicKey);
  const fromAddress = bufferToHex(spki);

  const hashHex = crypto
    .createHash('sha256')
    .update(fromAddress + toAddress + amount + timestamp)
    .digest('hex');

  const signatureBuffer = await subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    keyPair.privateKey,
    Buffer.from(hashHex, 'utf8')
  );

  return { fromAddress, toAddress, amount, timestamp, signature: bufferToHex(signatureBuffer) };
};

module.exports = { createSignedTransaction };
