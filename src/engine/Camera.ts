import { mat4 } from "gl-matrix";

export default class Camera {

    private viewMatrix: mat4;
    private projectionMatrix: mat4;

    constructor(fieldOfView: number, aspectRatio: number, nearClip: number, farClip: number) {
        this.projectionMatrix = mat4.create();

        mat4.perspective(this.projectionMatrix,
            fieldOfView,
            aspectRatio,
            nearClip,
            farClip);

        this.viewMatrix = mat4.create();

    }

    getViewProjectionMatrix(out: mat4): void {
        mat4.mul(out, this.projectionMatrix, this.viewMatrix);
    }

}