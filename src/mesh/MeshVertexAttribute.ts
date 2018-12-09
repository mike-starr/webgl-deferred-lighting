import { AttributeName } from "../shaders/ShaderDescription";

export default interface MeshVertexAttribute {
    readonly name: AttributeName;
    readonly buffer: WebGLBuffer;
    readonly componentCount: GLint;
    readonly type: GLenum;
    readonly normalized: GLboolean;
    readonly stride: GLsizei;
    readonly offset: GLintptr;
}