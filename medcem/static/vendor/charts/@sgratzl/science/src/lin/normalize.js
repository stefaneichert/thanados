import len from './length';

export default function normalize(p) {
  var length = len(p);
  return p.map(function(d) { return d / length; });
};
