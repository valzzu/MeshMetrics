exports.formatNumber = (value, decimals = 2) => {
  if (value == null) return null;
  const num = parseFloat(value);
  return isNaN(num) ? value : num.toFixed(decimals);
};
