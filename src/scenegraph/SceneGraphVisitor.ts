import { mat4 } from "gl-matrix";

export default interface SceneGraphVisitor {
    onProjectionViewUpdate(projectionViewMatrix: mat4): void;
    onWorldTransformUpdate(worldMatrix: mat4): void;
    onLightAdded(): void;
    onLightRemoved(): void;
    onRenderable(): void;
}