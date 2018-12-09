import { mat4 } from "gl-matrix";
import ShaderProgram from "../engine/ShaderProgram";
import SceneGraphGBufferNode from "./SceneGraphGBufferNode";
import SceneGraphLightPassNode from "./SceneGraphLightPassNode";
import Renderable from "../renderer/Renderable";

export default interface SceneGraphVisitor {
    pushProjectionViewMatrix(projectionViewMatrix: mat4): void;
    popProjectionViewMatrix(): void;
    pushWorldMatrix(worldMatrix: mat4): void;
    popWorldMatrix(): void;
    pushShaderProgram(shaderProgram: ShaderProgram): void;
    popShaderProgram(): void;
    beginGBufferPass(node: SceneGraphGBufferNode): void;
    endGBufferPass(): void;
    beginLightPass(node: SceneGraphLightPassNode): void;
    endLightPass(): void;
    renderRenderable(renderable: Renderable): void;
}