import { mat4 } from "gl-matrix";

export default class XYScaleAnimation {

    private readonly periodMs: number;
    private timeMs: number = 0.0;

    constructor(private readonly transform: mat4,
        private readonly minScale: number,
        private readonly maxScale: number,
        periodSec: number) {
            this.periodMs = periodSec * 1000.0 * 4;
    }

    update(stepMs: number): void {
        this.timeMs = (this.timeMs + stepMs) % this.periodMs;

        const angle = Math.PI * 2 * (this.timeMs / this.periodMs);
        const xScale = this.minScale + (this.maxScale - this.minScale) * Math.abs(Math.cos(angle));
        const yScale = this.minScale + (this.maxScale - this.minScale) * Math.abs(Math.sin(angle));

        mat4.fromScaling(this.transform, [xScale, yScale, 1.0]);
    }
}