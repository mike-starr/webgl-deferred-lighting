import { mat4 } from "gl-matrix";
import ShaderProgram from "../engine/ShaderProgram";

export default interface SceneGraphVisitor {
    pushProjectionViewMatrix(projectionViewMatrix: mat4): void;
    popProjectionViewMatrix(): void;
    pushWorldMatrix(worldMatrix: mat4): void;
    popWorldMatrix(): void;
    setShaderProgram(shaderProgram: ShaderProgram): void;
    renderMesh(): void;
}