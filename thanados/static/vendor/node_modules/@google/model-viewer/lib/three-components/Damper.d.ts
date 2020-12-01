export declare const SETTLING_TIME = 10000;
declare const $velocity: unique symbol;
/**
 * The Damper class is a generic second-order critically damped system that does
 * one linear step of the desired length of time. The only parameter is
 * DECAY_MILLISECONDS, which should be adjustable: TODO(#580). This common
 * parameter makes all states converge at the same rate regardless of scale.
 * xNormalization is a number to provide the rough scale of x, such that
 * NIL_SPEED clamping also happens at roughly the same convergence for all
 * states.
 */
export declare class Damper {
    private [$velocity];
    update(x: number, xGoal: number, timeStepMilliseconds: number, xNormalization: number): number;
}
export {};
