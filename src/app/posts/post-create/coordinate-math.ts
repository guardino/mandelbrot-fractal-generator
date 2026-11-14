import * as Big from 'big.js';

const Decimal = Big();
Decimal.DP = 1000;

export interface CoordinateBounds {
  xMin: string;
  xMax: string;
  yMin: string;
  yMax: string;
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
