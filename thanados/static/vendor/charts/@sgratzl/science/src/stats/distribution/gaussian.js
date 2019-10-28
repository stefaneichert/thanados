import erf from '../erf';

// From http://www.colingodsey.com/javascript-gaussian-random-number-generator/
// Uses the Box-Muller Transform.
export default function gaussian() {
  var random = Math.random,
      mean = 0,
      sigma = 1,
      variance = 1;

  function gaussian() {
    var x1,
        x2,
        rad,
        y1;

    do {
      x1 = 2 * random() - 1;
      x2 = 2 * random() - 1;
      rad = x1 * x1 + x2 * x2;
    } while (rad >= 1 || rad === 0);

    return mean + sigma * x1 * Math.sqrt(-2 * Math.log(rad) / rad);
  }

  gaussian.pdf = function(x) {
    x = (x - mean) / sigma;
    return science_stats_distribution_gaussianConstant * Math.exp(-.5 * x * x) / sigma;
  };

  gaussian.cdf = function(x) {
    x = (x - mean) / sigma;
    return .5 * (1 + erf(x / Math.SQRT2));
  };

  gaussian.mean = function(x) {
    if (!arguments.length) return mean;
    mean = +x;
    return gaussian;
  };

  gaussian.variance = function(x) {
    if (!arguments.length) return variance;
    sigma = Math.sqrt(variance = +x);
    return gaussian;
  };

  gaussian.random = function(x) {
    if (!arguments.length) return random;
    random = x;
    return gaussian;
  };

  return gaussian;
};

const science_stats_distribution_gaussianConstant = 1 / Math.sqrt(2 * Math.PI);
