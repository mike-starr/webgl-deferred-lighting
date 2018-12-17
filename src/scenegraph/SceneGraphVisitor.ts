import { mat4 } from "gl-matrix";
import SceneGraphGPassNode from "./SceneGraphGPassNode";
import SceneGraphLightPassNode from "./SceneGraphLightPassNode";
import Renderable from "../renderer/Renderable";

export default interface SceneGraphVisitor {
    pushProjectionViewMatrix(projectionViewMatrix: mat4): void;
    popProjectionViewMatrix(): void;
    pushWorldMatrix(worldMatrix: mat4): void;
    popWorldMatrix(): void;
    beginGPass(node: SceneGraphGPassNode): void;
    endGPass(): void;
    beginLightPass(node: SceneGraphLightPassNode): void;
    endLightPass(): void;
    beginNormalPass(): void;
    endNormalPass(): void;
    renderMesh(renderable: Renderable): void;
    renderLight(renderable: Renderable): void;
}