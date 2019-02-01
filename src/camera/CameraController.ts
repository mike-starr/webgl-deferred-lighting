import Camera from "./Camera";
import { quat, vec3 } from "gl-matrix";

export default class CameraController {

    private readonly anglePerPixel: number = Math.PI / 400;
    private readonly translationPerSecond: number = 1.0;
    private readonly initialForwardVec: vec3 = vec3.fromValues(0.0, 0.0, -1.0);
    private readonly upVec: vec3 = vec3.fromValues(0.0, 1.0, 0.0);
    private readonly epsilon: number = 0.001;

    private keyDownSet = new Set();
    private rotationX: number = 0;
    private rotationY: number = 0;
    private eyePoint: vec3 = vec3.create();

    private lookAt: vec3 = vec3.create();
    private forwardVec: vec3 = vec3.create();
    private rightVec: vec3 = vec3.create();
    private rotation = quat.create();

    constructor(private readonly camera: Camera, element: HTMLElement, initialEye: vec3) {
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);

        vec3.copy(this.eyePoint, initialEye);
        vec3.copy(this.forwardVec, this.initialForwardVec);

        element.addEventListener("mousemove", this.onMouseMove);
        document.addEventListener("keydown", this.onKeyDown);
        document.addEventListener("keyup", this.onKeyUp);
    }

    update(elapsedMs: number) {
        vec3.transformQuat(this.forwardVec, this.initialForwardVec, this.rotation);
        vec3.cross(this.rightVec, this.forwardVec, this.upVec);
        vec3.normalize(this.rightVec, this.rightVec);

        if (this.keyDownSet.has("KeyW")) {
            vec3.scaleAndAdd(this.eyePoint, this.eyePoint, this.forwardVec, this.translationPerSecond * elapsedMs / 1000.0);
        }

        if (this.keyDownSet.has("KeyS")) {
            vec3.scaleAndAdd(this.eyePoint, this.eyePoint, this.forwardVec, -this.translationPerSecond * elapsedMs / 1000.0);
        }

        if (this.keyDownSet.has("KeyA")) {
            vec3.scaleAndAdd(this.eyePoint, this.eyePoint, this.rightVec, -this.translationPerSecond * elapsedMs / 1000.0);
        }

        if (this.keyDownSet.has("KeyD")) {
            vec3.scaleAndAdd(this.eyePoint, this.eyePoint, this.rightVec, this.translationPerSecond * elapsedMs / 1000.0);
        }

        vec3.add(this.lookAt, this.eyePoint, this.forwardVec);
        this.camera.setLookAt(this.eyePoint, this.lookAt, this.upVec);
    }

    private onMouseMove(event: MouseEvent) {
        if (event.buttons === 1) {
            this.rotationX += -event.movementY * this.anglePerPixel;
            this.rotationY += event.movementX * this.anglePerPixel;

            this.rotationX = Math.min(Math.PI / 2 - this.epsilon, Math.max(-Math.PI / 2 + this.epsilon, this.rotationX));
            this.rotationY = this.rotationY % (Math.PI * 2);

            quat.identity(this.rotation);
            quat.rotateY(this.rotation, this.rotation, -this.rotationY);
            quat.rotateX(this.rotation, this.rotation, this.rotationX);
        }
    }

    private onKeyDown(event: KeyboardEvent) {
        this.keyDownSet.add(event.code);
    }

    private onKeyUp(event: KeyboardEvent) {
        this.keyDownSet.delete(event.code);
    }
}