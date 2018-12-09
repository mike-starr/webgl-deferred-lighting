import Mesh from "../mesh/Mesh";

export default interface Renderable {
    readonly mesh: Mesh;
    readonly textures: WebGLTexture[];
}