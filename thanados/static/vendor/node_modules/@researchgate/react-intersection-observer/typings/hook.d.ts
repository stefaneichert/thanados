import { ChangeHandler, Options, Unobserve } from './types';
/**
 * useIntersectionObserver hook that has almost the same api as <Observer />
 *
 * @param {ChangeHandler} onChange Function that will be invoked whenever the intersection value for this element changes.
 * @param {Options} options Option to customize instersction observer instance or disable it
 *
 * @example
 * const App = () => {
 *   const onChange = ({ isIntersecting }) => console.log({ isIntersecting })
 *   const ref = useIntersectionObserver(onChange)
 *
 *   return <div ref={ref} />
 * }
 */
export declare const useIntersectionObserver: (onChange: ChangeHandler, { root, rootMargin, threshold, disabled }?: Options) => [React.RefCallback<any>, Unobserve];
