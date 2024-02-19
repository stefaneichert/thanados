import { Instance, TargetNode } from './types';
export declare const observerElementsMap: Map<IntersectionObserver | undefined, Set<Instance>>;
export declare function getPooled(options?: IntersectionObserverInit): any;
export declare function findObserverElement(observer: IntersectionObserver, entry: IntersectionObserverEntry): Instance | null;
/**
 * The Intersection Observer API callback that is called whenever one element
 * – namely the target – intersects either the device viewport or a specified element.
 * Also will get called whenever the visibility of the target element changes and
 * crosses desired amounts of intersection with the root.
 */
export declare function callback(entries: IntersectionObserverEntry[], observer: IntersectionObserver): void;
export declare function createObserver(options: IntersectionObserverInit): IntersectionObserver;
export declare function observeElement(element: Instance): void;
export declare function unobserveElement(element: Instance, target: TargetNode): void;
