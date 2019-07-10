
import * as distribution_ from './distribution/index';
import * as bandwidth_ from './bandwidth';
import * as distance_ from './distance';
export {default as erf} from './erf';
export {default as hcluster} from './hcluster';
export {default as iqr} from './iqr';
export {default as kde} from './kde';
import * as kernel_ from './kernel';
export {default as kmeans} from './kmeans';
export {default as loess} from './loess';
export {default as mean} from './mean';
export {default as median} from './median';
export {default as mode} from './mode';
export {default as phi} from './phi';
export {default as quantiles} from './quantiles';
export {default as variance} from './variance';

export const distance = distance_;
export const kernel = kernel_;
export const distribution = distribution_;
export const bandwidth = bandwidth_;