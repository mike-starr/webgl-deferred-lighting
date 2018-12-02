import { mat4 } from "gl-matrix";
import ShaderProgram from "../engine/ShaderProgram";
import Mesh from "../Mesh/Mesh";

export default interface SceneGraphVisitor {
    pushProjectionViewMatrix(projectionViewMatrix: mat4): void;
    popProjectionViewMatrix(): void;
    pushWorldMatrix(worldMatrix: mat4): void;
    popWorldMatrix(): void;
    pushShaderProgram(shaderProgram: ShaderProgram): void;
    popShaderProgram(): void;
    renderMesh(mesh: Mesh): void;
}