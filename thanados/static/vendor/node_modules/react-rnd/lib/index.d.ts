import * as React from "react";
import { DraggableEventHandler } from "react-draggable";
import { Resizable, ResizeDirection } from "re-resizable";
declare type $TODO = any;
export declare type Grid = [number, number];
export declare type Position = {
    x: number;
    y: number;
};
export declare type DraggableData = {
    node: HTMLElement;
    deltaX: number;
    deltaY: number;
    lastX: number;
    lastY: number;
} & Position;
export declare type RndDragCallback = DraggableEventHandler;
export declare type RndDragEvent = React.MouseEvent<HTMLElement | SVGElement> | React.TouchEvent<HTMLElement | SVGElement> | MouseEvent | TouchEvent;
export declare type RndResizeStartCallback = (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>, dir: ResizeDirection, elementRef: HTMLElement) => void | boolean;
export declare type ResizableDelta = {
    width: number;
    height: number;
};
export declare type RndResizeCallback = (e: MouseEvent | TouchEvent, dir: ResizeDirection, elementRef: HTMLElement, delta: ResizableDelta, position: Position) => void;
declare type Size = {
    width: string | number;
    height: string | number;
};
declare type State = {
    resizing: boolean;
    bounds: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    maxWidth?: number | string;
    maxHeight?: number | string;
};
declare type MaxSize = {
    maxWidth: number | string;
    maxHeight: number | string;
};
export declare type ResizeEnable = {
    bottom?: boolean;
    bottomLeft?: boolean;
    bottomRight?: boolean;
    left?: boolean;
    right?: boolean;
    top?: boolean;
    topLeft?: boolean;
    topRight?: boolean;
} | boolean;
export declare type HandleClasses = {
    bottom?: string;
    bottomLeft?: string;
    bottomRight?: string;
    left?: string;
    right?: string;
    top?: string;
    topLeft?: string;
    topRight?: string;
};
export declare type HandleStyles = {
    bottom?: React.CSSProperties;
    bottomLeft?: React.CSSProperties;
    bottomRight?: React.CSSProperties;
    left?: React.CSSProperties;
    right?: React.CSSProperties;
    top?: React.CSSProperties;
    topLeft?: React.CSSProperties;
    topRight?: React.CSSProperties;
};
export declare type HandleComponent = {
    top?: React.ReactElement<any>;
    right?: React.ReactElement<any>;
    bottom?: React.ReactElement<any>;
    left?: React.ReactElement<any>;
    topRight?: React.ReactElement<any>;
    bottomRight?: React.ReactElement<any>;
    bottomLeft?: React.ReactElement<any>;
    topLeft?: React.ReactElement<any>;
};
export interface Props {
    dragGrid?: Grid;
    default?: {
        x: number;
        y: number;
    } & Size;
    position?: {
        x: number;
        y: number;
    };
    size?: Size;
    resizeGrid?: Grid;
    bounds?: string | Element;
    onMouseDown?: (e: MouseEvent) => void;
    onMouseUp?: (e: MouseEvent) => void;
    onResizeStart?: RndResizeStartCallback;
    onResize?: RndResizeCallback;
    onResizeStop?: RndResizeCallback;
    onDragStart?: RndDragCallback;
    onDrag?: RndDragCallback;
    onDragStop?: RndDragCallback;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    enableResizing?: ResizeEnable;
    resizeHandleClasses?: HandleClasses;
    resizeHandleStyles?: HandleStyles;
    resizeHandleWrapperClass?: string;
    resizeHandleWrapperStyle?: React.CSSProperties;
    resizeHandleComponent?: HandleComponent;
    lockAspectRatio?: boolean | number;
    lockAspectRatioExtraWidth?: number;
    lockAspectRatioExtraHeight?: number;
    maxHeight?: number | string;
    maxWidth?: number | string;
    minHeight?: number | string;
    minWidth?: number | string;
    dragAxis?: "x" | "y" | "both" | "none";
    dragHandleClassName?: string;
    disableDragging?: boolean;
    cancel?: string;
    enableUserSelectHack?: boolean;
    allowAnyClick?: boolean;
    scale?: number;
    [key: string]: any;
}
interface DefaultProps {
    maxWidth: number;
    maxHeight: number;
    onResizeStart: RndResizeStartCallback;
    onResize: RndResizeCallback;
    onResizeStop: RndResizeCallback;
    onDragStart: RndDragCallback;
    onDrag: RndDragCallback;
    onDragStop: RndDragCallback;
    scale: number;
}
export declare class Rnd extends React.PureComponent<Props, State> {
    static defaultProps: DefaultProps;
    resizable: Resizable;
    draggable: $TODO;
    resizingPosition: {
        x: number;
        y: number;
    };
    offsetFromParent: {
        left: number;
        top: number;
    };
    resizableElement: {
        current: HTMLElement | null;
    };
    originalPosition: {
        x: number;
        y: number;
    };
    constructor(props: Props);
    componentDidMount(): void;
    getDraggablePosition(): {
        x: number;
        y: number;
    };
    getParent(): any;
    getParentSize(): {
        width: number;
        height: number;
    };
    getMaxSizesFromProps(): MaxSize;
    getSelfElement(): HTMLElement | null;
    getOffsetHeight(boundary: HTMLElement): number;
    getOffsetWidth(boundary: HTMLElement): number;
    onDragStart(e: RndDragEvent, data: DraggableData): void;
    onDrag(e: RndDragEvent, data: DraggableData): false | void;
    onDragStop(e: RndDragEvent, data: DraggableData): false | void;
    onResizeStart(e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>, dir: ResizeDirection, elementRef: HTMLElement): void;
    onResize(e: MouseEvent | TouchEvent, direction: ResizeDirection, elementRef: HTMLElement, delta: {
        height: number;
        width: number;
    }): void;
    onResizeStop(e: MouseEvent | TouchEvent, direction: ResizeDirection, elementRef: HTMLElement, delta: {
        height: number;
        width: number;
    }): void;
    updateSize(size: {
        width: number | string;
        height: number | string;
    }): void;
    updatePosition(position: Position): void;
    updateOffsetFromParent(): {
        top: number;
        left: number;
    } | undefined;
    refDraggable: (c: $TODO) => void;
    refResizable: (c: Resizable | null) => void;
    render(): JSX.Element;
}
export {};
