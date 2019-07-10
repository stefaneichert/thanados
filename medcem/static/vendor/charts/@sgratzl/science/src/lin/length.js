import dot from './dot';

export default function length(p) {
  return Math.sqrt(dot(p, p));
};
