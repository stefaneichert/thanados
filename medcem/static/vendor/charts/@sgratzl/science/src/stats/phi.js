import erf from './erf';

export default function phi(x) {
  return .5 * (1 + erf(x / Math.SQRT2));
};
