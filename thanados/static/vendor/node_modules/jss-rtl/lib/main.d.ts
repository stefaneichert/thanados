export interface JssRTLOptions {
    enabled?: boolean;
    opt?: 'in' | 'out';
}
export default function jssRTL({ enabled, opt }?: JssRTLOptions): {
    onProcessStyle(style: any, rule: any, sheet: any): any;
};
