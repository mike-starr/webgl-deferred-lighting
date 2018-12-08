import { mat4 } from "gl-matrix";
import ShaderProgram from "../engine/ShaderProgram";
import Mesh from "../Mesh/Mesh";
import SceneGraphGBufferNode from "./SceneGraphGBufferNode";

export default interface SceneGraphVisitor {
    pushProjectionViewMatrix(projectionViewMatrix: mat4): void;
    popProjectionViewMatrix(): void;
    pushWorldMatrix(worldMatrix: mat4): void;
    popWorldMatrix(): void;
    pushShaderProgram(shaderProgram: ShaderProgram): void;
    popShaderProgram(): void;
    bindTexture(texture: WebGLTexture, index: number): void;
    beginGBufferPass(node: SceneGraphGBufferNode): void;
    endGBufferPass(): void;
    renderMesh(mesh: Mesh): void;
}