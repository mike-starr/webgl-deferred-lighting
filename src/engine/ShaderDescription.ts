export enum AttributeName {
    VertexPosition = "aVertexPosition",
    VertexColor = "aVertexColor",
    TexCoord0 = "aTexCoord0"
};

export interface AttributeDescription {
    name: AttributeName
    location: GLint
};

export enum UniformName {
    ProjectionViewMatrix = "uProjectionViewMatrix",
    WorldMatrix = "uWorldMatrix",
    TextureSampler0 = "uTextureSampler0"
};

export interface UniformDescription {
    name: UniformName
    location: WebGLUniformLocation
};

export default interface ShaderDescription {
    attributes: AttributeDescription[],
    uniforms: UniformDescription[]
};