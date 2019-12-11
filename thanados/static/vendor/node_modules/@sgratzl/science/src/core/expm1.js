/**
Compute exp(x) - 1 accurately for small x.
 */
export default function expm1(x) {
  return (x < 1e-5 && x > -1e-5) ? x + .5 * x * x : Math.exp(x) - 1;
};
