import { mat4 } from "gl-matrix";
import Renderable from "../renderer/Renderable";
import Camera from "../camera/Camera";

export default interface SceneGraphVisitor {
    pushCamera(camera: Camera): void;
    popCamera(): void;
    pushWorldMatrix(worldMatrix: mat4): void;
    popWorldMatrix(): void;
    renderMesh(renderable: Renderable): void;
    renderLight(renderable: Renderable): void;
}