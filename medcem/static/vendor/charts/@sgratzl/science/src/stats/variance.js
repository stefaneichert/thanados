import meanF from './mean';

// Unbiased estimate of a sample's variance.
// Also known as the sample variance, where the denominator is n - 1.
export default function variance(x) {
  var n = x.length;
  if (n < 1) return NaN;
  if (n === 1) return 0;
  var mean = meanF(x),
      i = -1,
      s = 0;
  while (++i < n) {
    var v = x[i] - mean;
    s += v * v;
  }
  return s / (n - 1);
};
