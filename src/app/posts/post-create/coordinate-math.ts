import * as Big from 'big.js';

const Decimal = Big();
Decimal.DP = 1000;

export interface CoordinateBounds {
  xMin: string;
  xMax: string;
  yMin: string;
  yMax: string;
}

export interface CoordinateRange {
  min: string;
  max: string;
}

export function formatCoordinate(value: string): string {
  const numericValue = Number(value);
  return isFinite(numericValue) ? numericValue.toString() : new Decimal(value).toString();
}

export function formatCoordinateRange(min: string, max: string): CoordinateRange {
  const minDecimal = new Decimal(min);
  const maxDecimal = new Decimal(max);
  const formattedMin = formatCoordinate(min);
  const formattedMax = formatCoordinate(max);

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
}

export function formatCoordinateBounds(bounds: CoordinateBounds): CoordinateBounds {
  const x = formatCoordinateRange(bounds.xMin, bounds.xMax);
  const y = formatCoordinateRange(bounds.yMin, bounds.yMax);
  return { xMin: x.min, xMax: x.max, yMin: y.min, yMax: y.max };
}

export function getCoordinateForSubmission(
  formValue: string,
  preciseValue: string,
  displayedValue: string
): string {
  return formValue === displayedValue ? preciseValue : formValue;
}

export function getSelectedBounds(
  bounds: CoordinateBounds,
  selection: number[],
  imageWidth: number,
  imageHeight: number
): CoordinateBounds {
  const xMin = new Decimal(bounds.xMin);
  const xMax = new Decimal(bounds.xMax);
  const yMin = new Decimal(bounds.yMin);
  const yMax = new Decimal(bounds.yMax);
  const xSpan = xMax.minus(xMin);
  const ySpan = yMax.minus(yMin);
  const width = new Decimal(imageWidth);
  const height = new Decimal(imageHeight);

  let visibleWidth: Big;
  let visibleHeight: Big;
  let startX: Big;
  let startY: Big;
  if (xSpan.times(height).lt(ySpan.times(width))) {
    visibleWidth = xSpan.times(height).div(ySpan);
    visibleHeight = height;
    startX = width.minus(visibleWidth).div(2);
    startY = new Decimal(0);
  } else {
    visibleWidth = width;
    visibleHeight = ySpan.times(width).div(xSpan);
    startX = new Decimal(0);
    startY = height.minus(visibleHeight).div(2);
  }

  const deltaX = xSpan.div(visibleWidth);
  const deltaY = ySpan.div(visibleHeight);
  const selectedXMin = xMin.plus(
    new Decimal(selection[0].toString()).minus(startX).times(deltaX)
  );
  const selectedXMax = xMin.plus(
    new Decimal(selection[2].toString()).minus(startX).times(deltaX)
  );
  const selectedYMin = yMax.minus(
    new Decimal(selection[3].toString()).minus(startY).times(deltaY)
  );
  const selectedYMax = yMax.minus(
    new Decimal(selection[1].toString()).minus(startY).times(deltaY)
  );

  return {
    xMin: selectedXMin.toString(),
    xMax: selectedXMax.toString(),
    yMin: selectedYMin.toString(),
    yMax: selectedYMax.toString()
  };
}

export function getCoordinateCenter(min: string, max: string): string {
  return new Decimal(min).plus(max).div(2).toString();
}

function trimTrailingZeros(value: string): string {
  const exponentIndex = value.indexOf("e");
  const mantissa = exponentIndex === -1 ? value : value.substring(0, exponentIndex);
  const exponent = exponentIndex === -1 ? "" : value.substring(exponentIndex);
  const trimmedMantissa = mantissa.indexOf(".") === -1
    ? mantissa
    : mantissa.replace(/0+$/, "").replace(/\.$/, "");
  return trimmedMantissa + exponent;
}
