const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const isValidAddress = (address) => isNonEmptyString(address);

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
  isValidAmount,
  isValidTimestamp,
  sanitizeAddress,
  sanitizeAmount,
  sanitizeTimestamp,
};
