export default interface MeshIndexBufferDescription {
    buffer: WebGLBuffer;
    primitiveType: GLenum;
    vertexCount: number;
    type: GLenum;
    offset: number;
}