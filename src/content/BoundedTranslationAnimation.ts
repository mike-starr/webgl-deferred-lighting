import { mat4, vec3 } from "gl-matrix";

export default class BoundedTranslationAnimation {

    private velocity: vec3 = vec3.create();
    private position: vec3 = vec3.create();
    private tempVector: vec3 = vec3.create();

    private static downVector: vec3 = vec3.fromValues(0.0, -1.0, 0.0);
    private static upVector: vec3 = vec3.fromValues(0.0, 1.0, 0.0);
    private static rightVector: vec3 = vec3.fromValues(1.0, 0.0, 0.0);
    private static leftVector: vec3 = vec3.fromValues(-1.0, 0.0, 0.0);

    constructor(private readonly transform: mat4,
        private readonly leftBound: number,
        private readonly rightBound: number,
        private readonly topBound: number,
        private readonly bottomBound: number,
        initialPosition: vec3,
        initialVelocity: vec3) {
            vec3.copy(this.velocity, initialVelocity);
            vec3.copy(this.position, initialPosition);
    }

    private reflect(out: vec3, v1: vec3, normal: vec3) {
        const v1DotNormal = vec3.dot(v1, normal);
        vec3.subtract(out, v1, vec3.scale(this.tempVector, normal, 2 * v1DotNormal));
    }

    update(stepMs: number): void {
        vec3.scaleAndAdd(this.tempVector, this.position, this.velocity, stepMs / 1000.0);

        if (this.tempVector[1] > this.topBound &&
            vec3.dot(this.velocity, BoundedTranslationAnimation.downVector) < 0) {
            this.reflect(this.velocity, this.velocity, BoundedTranslationAnimation.downVector);
            vec3.scaleAndAdd(this.tempVector, this.position, this.velocity, stepMs / 1000.0);
        }

        if (this.tempVector[1] < this.bottomBound &&
            vec3.dot(this.velocity, BoundedTranslationAnimation.upVector) < 0) {
            this.reflect(this.velocity, this.velocity, BoundedTranslationAnimation.upVector);
            vec3.scaleAndAdd(this.tempVector, this.position, this.velocity, stepMs / 1000.0);
        }

        if (this.tempVector[0] < this.leftBound &&
            vec3.dot(this.velocity, BoundedTranslationAnimation.rightVector) < 0) {
            this.reflect(this.velocity, this.velocity, BoundedTranslationAnimation.rightVector);
            vec3.scaleAndAdd(this.tempVector, this.position, this.velocity, stepMs / 1000.0);
        }

        if (this.tempVector[0] > this.rightBound &&
            vec3.dot(this.velocity, BoundedTranslationAnimation.leftVector) < 0) {
            this.reflect(this.velocity, this.velocity, BoundedTranslationAnimation.leftVector);
            vec3.scaleAndAdd(this.tempVector, this.position, this.velocity, stepMs / 1000.0);
        }

        vec3.copy(this.position, this.tempVector);
        mat4.fromTranslation(this.transform, this.position);
    }
}