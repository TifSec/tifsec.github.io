export function quadraticState({ a, b, c }, x) {
    if (![a, b, c, x].every(Number.isFinite) || a === 0) throw new Error('invalid_quadratic');
    return { x, value: a * x * x + b * x + c, slope: 2 * a * x + b };
}
