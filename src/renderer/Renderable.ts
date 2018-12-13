import Mesh from "../mesh/Mesh";
import { mat4 } from "gl-matrix";
import ShaderProgram from "../shaders/ShaderProgram";

export default interface Renderable {
    readonly mesh: Mesh;
    readonly localTransform: mat4;
    readonly textures: WebGLTexture[];
    readonly shaderProgram: ShaderProgram;
}