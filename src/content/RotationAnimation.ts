import { mat4 } from "gl-matrix";

export default class RotationAnimation {

    constructor(private readonly transform: mat4, private readonly rotationRateRadPerSec: number) {

    }

    update(stepMs: number): void {
        mat4.rotateY(this.transform, this.transform, this.rotationRateRadPerSec * stepMs / 1000);
    }
}