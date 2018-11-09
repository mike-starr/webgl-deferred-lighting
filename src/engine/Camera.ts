import { mat4 } from "gl-matrix";

export default class Camera {

    private static readonly defaultFieldOfView = 45 * Math.PI / 180;   // in radians
    private static readonly defaultAspectRatio = 4 / 3;
    private static readonly defaultNearZ = 0.1;
    private static readonly defaultFarZ = 100.0;

    private viewMatrix: mat4;
    private projectionMatrix: mat4;

    constructor() {
        this.projectionMatrix = mat4.create();

        mat4.perspective(this.projectionMatrix,
            Camera.defaultFieldOfView,
            Camera.defaultAspectRatio,
            Camera.defaultNearZ,
            Camera.defaultFarZ);

        this.viewMatrix = mat4.create();

    }

    getViewProjectionMatrix(out: mat4): void {
        mat4.mul(out, this.projectionMatrix, this.viewMatrix);
    }

}