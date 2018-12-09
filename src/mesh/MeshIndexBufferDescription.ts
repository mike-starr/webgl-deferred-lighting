export default interface MeshIndexBufferDescription {
    buffer: WebGLBuffer;
    vertexCount: number;
    type: GLenum;
    offset: number;
}