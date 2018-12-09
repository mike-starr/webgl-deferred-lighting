import Mesh from "../Mesh/Mesh";

export default interface Renderable {
    readonly mesh: Mesh;
    readonly textures: WebGLTexture[];
}