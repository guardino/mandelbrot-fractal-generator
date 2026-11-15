import {
  formatCoordinateRange,
  getCoordinateForSubmission,
  getCoordinateCenter,
  getSelectedBounds
} from './coordinate-math';

describe('coordinate math', () => {
  it('preserves coordinate differences smaller than JavaScript number precision when zooming', () => {
    expect(Number('0.123456789012345678901'))
      .toBe(Number('0.123456789012345678902'));

    const selectedBounds = getSelectedBounds(
      {
        xMin: '0.123456789012345678901',
        xMax: '0.123456789012345678902',
        yMin: '-0.123456789012345678902',
        yMax: '-0.123456789012345678901'
      },
      [50, 0, 100, 100],
      100,
      100
    );

    expect(selectedBounds).toEqual({
      xMin: '0.1234567890123456789015',
      xMax: '0.123456789012345678902',
      yMin: '-0.123456789012345678902',
      yMax: '-0.123456789012345678901'
    });
  });

  it('calculates Julia centers without converting coordinates to numbers', () => {
    expect(getCoordinateCenter(
      '0.123456789012345678901',
      '0.123456789012345678902'
    )).toBe('0.1234567890123456789015');
  });

  it('keeps the previous number display unless the bounds would collapse', () => {
    expect(formatCoordinateRange('-2.5', '1.0')).toEqual({
      min: '-2.5',
      max: '1'
    });
    expect(formatCoordinateRange(
      '0.123456789012345678901',
      '0.123456789012345678902'
    )).toEqual({
      min: '0.123456789012345678901',
      max: '0.123456789012345678902'
    });
  });

  it('submits the exact coordinate while its shortened display is unchanged', () => {
    expect(getCoordinateForSubmission(
      '0.12345678901234568',
      '0.123456789012345678901',
      '0.12345678901234568'
    )).toBe('0.123456789012345678901');
    expect(getCoordinateForSubmission(
      '0.12345678901234569',
      '0.123456789012345678901',
      '0.12345678901234568'
    )).toBe('0.12345678901234569');
  });
});
