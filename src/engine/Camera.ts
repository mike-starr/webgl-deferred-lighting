import { mat4 } from "gl-matrix";

export default class Camera {

    private static readonly defaultFieldOfView = 45 * Math.PI / 180;   // in radians
    private static readonly defaultAspectRatio = 4 / 3;
    private static readonly defaultNearZ = 0.1;
    private static readonly defaultFarZ = 100.0;

    private viewMatrix: mat4;
    private projectionMatrix: mat4;
    private _projectionViewMatrix: mat4;

    constructor() {
        this.projectionMatrix = mat4.create();

        mat4.perspective(this.projectionMatrix,
            Camera.defaultFieldOfView,
            Camera.defaultAspectRatio,
            Camera.defaultNearZ,
            Camera.defaultFarZ);

        this.viewMatrix = mat4.create();

        this._projectionViewMatrix = mat4.create();
        this.updateProjectionView();
    }

    public get projectionViewMatrix(): mat4 {
        return this._projectionViewMatrix;
    }

    private updateProjectionView() {
        mat4.mul(this._projectionViewMatrix, this.projectionMatrix, this.viewMatrix);
    }
}