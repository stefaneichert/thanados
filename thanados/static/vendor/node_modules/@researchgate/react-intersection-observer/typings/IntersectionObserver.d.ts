import React from 'react';
import { ChangeHandler, Options, Instance, TargetNode } from './types';
export declare const getOptions: (props: Props) => IntersectionObserverInit;
interface Props extends Options {
    /**
     * The element that is used as the target to observe.
     */
    children?: React.ReactElement | null;
    /**
     * Function that will be invoked whenever the intersection value for this element changes.
     */
    onChange: ChangeHandler;
}
export default class ReactIntersectionObserver extends React.Component<Props, {}> implements Instance {
    static displayName: string;
    private targetNode?;
    private prevTargetNode?;
    target?: TargetNode;
    observer?: IntersectionObserver;
    handleChange: (event: IntersectionObserverEntry) => void;
    handleNode: <T extends Element | React.Component<any, {}, any> | null | undefined>(target: T) => void;
    observe: () => boolean;
    unobserve: (target: TargetNode) => void;
    externalUnobserve: () => void;
    getSnapshotBeforeUpdate(prevProps: Props): boolean;
    componentDidUpdate(_: any, __: any, relatedPropsChanged: boolean): void;
    componentDidMount(): void;
    componentWillUnmount(): void;
    render(): React.ReactElement<any, string | ((props: any) => React.ReactElement<any, string | any | (new (props: any) => React.Component<any, any, any>)> | null) | (new (props: any) => React.Component<any, any, any>)> | null;
}
export * from './types';
