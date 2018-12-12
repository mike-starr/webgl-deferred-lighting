import Mesh from "../mesh/Mesh";
import { mat4 } from "gl-matrix";

export default interface Renderable {
    readonly mesh: Mesh;
    readonly localTransform: mat4;
    readonly textures: WebGLTexture[];
}