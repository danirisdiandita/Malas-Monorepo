export function decimalAsFraction(value: number) {
  if (!Number.isFinite(value) || Number.isInteger(value)) return String(value);
  const whole = Math.floor(value);
  const target = value - whole;
  let lowerNumerator = 0;
  let lowerDenominator = 1;
  let upperNumerator = 1;
  let upperDenominator = 1;
  for (let i = 0; i < 12; i += 1) {
    const numerator = lowerNumerator + upperNumerator;
    const denominator = lowerDenominator + upperDenominator;
    if (denominator > 16) break;
    if (Math.abs(target - numerator / denominator) < 0.01) {
      const fraction = `${numerator}/${denominator}`;
      return whole ? `${whole} ${fraction}` : fraction;
    }
    if (target > numerator / denominator) {
      lowerNumerator = numerator;
      lowerDenominator = denominator;
    } else {
      upperNumerator = numerator;
      upperDenominator = denominator;
    }
  }
  return String(value);
}
