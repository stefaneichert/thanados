import quantilesF from './quantiles';

export default function iqr(x) {
  var quartiles = quantilesF(x, [.25, .75]);
  return quartiles[1] - quartiles[0];
};
