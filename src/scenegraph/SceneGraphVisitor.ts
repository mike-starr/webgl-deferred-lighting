import { mat4 } from "gl-matrix";

export default interface SceneGraphVisitor {
    pushProjectionViewMatrix(projectionViewMatrix: mat4): void;
    popProjectionViewMatrix(): void;
    pushWorldMatrix(worldMatrix: mat4): void;
    popWorldMatrix(): void;
    renderMesh(): void;
}