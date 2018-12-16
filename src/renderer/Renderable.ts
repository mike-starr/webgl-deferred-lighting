import Mesh from "../mesh/Mesh";
import { mat4 } from "gl-matrix";
import ShaderProgram from "../shaders/ShaderProgram";
import Material from "../material/Material";

export default interface Renderable {
    readonly mesh: Mesh;
    readonly localTransform: mat4;
    readonly material: Material;
    readonly textures: WebGLTexture[];
    readonly shaderProgram: ShaderProgram;
}