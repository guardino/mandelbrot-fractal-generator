const Big = require("big.js")();
Big.DP = 1000;
const COMMAND_SIGNIFICANT_DIGITS = 80;

exports.formatCoordinateForCommand = value => {
  return new Big(new Big(value).toPrecision(COMMAND_SIGNIFICANT_DIGITS)).toString();
};

exports.formatCoordinate = value => {
  const numericValue = Number(value);
  return isFinite(numericValue) ? numericValue.toString() : new Big(value).toString();
};

exports.formatCoordinateRange = (min, max) => {
  const minDecimal = new Big(min);
  const maxDecimal = new Big(max);
  const formattedMin = exports.formatCoordinate(min);
  const formattedMax = exports.formatCoordinate(max);

  if (formattedMin !== formattedMax || minDecimal.eq(maxDecimal)) {
    return { min: formattedMin, max: formattedMax };
  }

  const maxPrecision = Math.max(17, minDecimal.c.length, maxDecimal.c.length);
  for (let precision = 17; precision <= maxPrecision; precision++) {
    const preciseMin = trimTrailingZeros(minDecimal.toPrecision(precision));
    const preciseMax = trimTrailingZeros(maxDecimal.toPrecision(precision));
    if (preciseMin !== preciseMax) {
      return { min: preciseMin, max: preciseMax };
    }
  }

  return { min: minDecimal.toString(), max: maxDecimal.toString() };
};

function trimTrailingZeros(value) {
  const exponentIndex = value.indexOf("e");
  const mantissa = exponentIndex === -1 ? value : value.substring(0, exponentIndex);
  const exponent = exponentIndex === -1 ? "" : value.substring(exponentIndex);
  const trimmedMantissa = mantissa.indexOf(".") === -1
    ? mantissa
    : mantissa.replace(/0+$/, "").replace(/\.$/, "");
  return trimmedMantissa + exponent;
}
