import Mesh from "../mesh/Mesh";
import { mat4 } from "gl-matrix";
import ShaderProgram from "../shaders/ShaderProgram";
import Material from "../material/Material";
import RenderQueue from "./RenderQueue";
import TextureConstant from "./TextureConstant";

export default interface Renderable {
    readonly mesh: Mesh;
    readonly localTransform: mat4;
    readonly material: Material;
    readonly textures: (WebGLTexture|TextureConstant)[];
    readonly shaderProgram: ShaderProgram;
    readonly renderQueue: RenderQueue;
}