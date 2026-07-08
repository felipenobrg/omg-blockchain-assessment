const HEX_REGEX = /^[0-9a-f]+$/i;
const P256_SPKI_HEX_LENGTH = 182;

const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const isValidAddress = (address) => isNonEmptyString(address);

const isValidSenderAddress = (address) =>
  isNonEmptyString(address) && HEX_REGEX.test(address) && address.length === P256_SPKI_HEX_LENGTH;

const isValidAmount = (amount) => {
  const parsed = parseFloat(amount);
  return !isNaN(parsed) && isFinite(parsed) && parsed > 0;
};

const isValidTimestamp = (timestamp) => {
  const parsed = Number(timestamp);
  return Number.isFinite(parsed) && parsed > 0;
};

const sanitizeAddress = (address) => String(address).trim();

const sanitizeAmount = (amount) => parseFloat(amount);

const sanitizeTimestamp = (timestamp) => Number(timestamp);

module.exports = {
  isNonEmptyString,
  isValidAddress,
  isValidSenderAddress,
  isValidAmount,
  isValidTimestamp,
  sanitizeAddress,
  sanitizeAmount,
  sanitizeTimestamp,
};
