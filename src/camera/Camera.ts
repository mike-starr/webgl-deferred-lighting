import { mat4, vec3 } from "gl-matrix";

export default class Camera {

    private static readonly defaultFieldOfView = 45 * Math.PI / 180;
    private static readonly defaultAspectRatio = 1280 / 720;
    private static readonly defaultNearZ = 0.1;
    private static readonly defaultFarZ = 100.0;

    private viewMatrix: mat4;
    private projectionMatrix: mat4;
    private _projectionViewMatrix: mat4;

    constructor() {
        this.projectionMatrix = mat4.create();
        this.viewMatrix = mat4.create();
        this._projectionViewMatrix = mat4.create();

        this.setLookAt(vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.0, 0.0, -1.0),
            vec3.fromValues(0.0, 1.0, 0.0));

        this.setProjectionPerspective(
            Camera.defaultFieldOfView,
            Camera.defaultAspectRatio,
            Camera.defaultNearZ,
            Camera.defaultFarZ);
    }

    public get projectionViewMatrix(): mat4 {
        return this._projectionViewMatrix;
    }

    public get eyePoint(): vec3 {
        const eyePoint = vec3.create();
        mat4.getTranslation(eyePoint, this.viewMatrix);
        vec3.negate(eyePoint, eyePoint);
        return eyePoint;
    }

    setProjectionOrthographic(left: number, right: number, bottom: number,
        top: number, near: number, far: number) {
        mat4.ortho(this.projectionMatrix, left, right, bottom, top, near, far);
        this.updateProjectionView();
    }

    setProjectionPerspective(fov: number, aspectRatio: number, nearZ: number, farZ: number) {
        mat4.perspective(this.projectionMatrix, fov, aspectRatio, nearZ, farZ);
        this.updateProjectionView();
    }

    setLookAt(eye: vec3, center: vec3, up: vec3) {
        mat4.lookAt(this.viewMatrix, eye, center, up);
        this.updateProjectionView();
    }

    private updateProjectionView() {
        mat4.mul(this._projectionViewMatrix, this.projectionMatrix, this.viewMatrix);
    }
}