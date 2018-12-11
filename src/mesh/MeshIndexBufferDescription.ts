export default interface MeshIndexBufferDescription {
    readonly buffer: WebGLBuffer;
    readonly primitiveType: GLenum;
    readonly vertexCount: number;
    readonly type: GLenum;
    readonly offset: number;
}