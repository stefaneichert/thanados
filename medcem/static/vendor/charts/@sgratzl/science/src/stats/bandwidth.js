import variance from './variance';
import iqr from './iqr';

// Bandwidth selectors for Gaussian kernels.
// Based on R's implementations in `stats.bw`.

// Silverman, B. W. (1986) Density Estimation. London: Chapman and Hall.
export function nrd0(x) {
    var lo;
    var hi = Math.sqrt(variance(x));
    if (!(lo = Math.min(hi, iqr(x) / 1.34)))
        (lo = hi) || (lo = Math.abs(x[1])) || (lo = 1);
    return .9 * lo * Math.pow(x.length, -.2);
}

// Scott, D. W. (1992) Multivariate Density Estimation: Theory, Practice, and
// Visualization. Wiley.
export function nrd(x) {
    var h = iqr(x) / 1.34;
    return 1.06 * Math.min(Math.sqrt(variance(x)), h)
        * Math.pow(x.length, -1 / 5);
}
