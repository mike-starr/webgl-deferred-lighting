export enum AttributeName {
    VertexPosition = "aVertexPosition",
    VertexColor = "aVertexColor"
};

export interface AttributeDescription {
    name: AttributeName
    location: GLint
};

export enum UniformName {
    ProjectionViewMatrix = "uProjectionViewMatrix",
    WorldMatrix = "uWorldMatrix"
};

export interface UniformDescription {
    name: UniformName
    location: WebGLUniformLocation
};

export default interface ShaderDescription {
    attributes: AttributeDescription[],
    uniforms: UniformDescription[]
};