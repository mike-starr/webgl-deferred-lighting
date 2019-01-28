import Camera from "./Camera";
import { quat, vec3 } from "gl-matrix";

export default class CameraController {

    private readonly anglePerPixel: number = Math.PI / 400;
    private rotationX: number = 0;
    private rotationY: number = 0;

    private eyePoint: vec3 = vec3.create();
    private upVec: vec3 = vec3.fromValues(0.0, 1.0, 0.0);
    private initialForwardVec: vec3 = vec3.fromValues(0.0, 0.0, -1.0);

    private lookAt: vec3 = vec3.create();
    private forwardVec: vec3 = vec3.create();
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

        this.update();
    }

    private update() {
        vec3.transformQuat(this.forwardVec, this.initialForwardVec, this.rotation);
        vec3.add(this.lookAt, this.eyePoint, this.forwardVec);
        this.camera.setLookAt(this.eyePoint, this.lookAt, this.upVec);
    }

    private onMouseMove(event: MouseEvent) {
        console.log(`mousemove: ${event.buttons}`);

        if (event.buttons === 1) {
            this.rotationX += -event.movementY * this.anglePerPixel;
            this.rotationY += event.movementX * this.anglePerPixel;

            quat.identity(this.rotation);
            quat.rotateY(this.rotation, this.rotation, -this.rotationY);
            quat.rotateX(this.rotation, this.rotation, this.rotationX);
        }

        this.update();
    }

    private onKeyDown(event: KeyboardEvent) {
        console.log(`keydown ${event.key}`);
    }

    private onKeyUp(event: KeyboardEvent) {
        console.log(`keyup ${event.key}`);
    }
}