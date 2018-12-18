export enum AttributeName {
    VertexPosition = "aVertexPosition",
    VertexNormal = "aVertexNormal",
    TexCoord0 = "aTexCoord0"
};

export interface AttributeDescription {
    readonly name: AttributeName;
    readonly location: GLint;
};

export enum UniformName {
    ProjectionViewMatrix = "uProjectionViewMatrix",
    WorldMatrix = "uWorldMatrix",
    InverseWorldMatrix = "uInverseWorldMatrix",
    CameraPositionLocalSpace = "uCameraPosLocalSpace",
    TextureSampler0 = "uTextureSampler0",
    TextureSampler1 = "uTextureSampler1",
    TextureSampler2 = "uTextureSampler2",
    TextureSampler3 = "uTextureSampler3",

    // material
    MaterialDiffuseColor = "uMaterial.diffuseColor",
    MaterialEmissiveColor = "uMaterial.emissiveColor",
    MaterialSpecularIntensity = "uMaterial.specularIntensity",
    MaterialSpecularPower = "uMaterial.specularPower",

    // directional light
    LightDirectional_Color = "uLightDirectional.color",
    LightDirectional_Direction = "uLightDirectional.direction",
    LightDirectional_Intensity = "uLightDirectional.intensity",

    // point light
    LightPoint_Color = "uLightPoint.color",
    LightPoint_Intensity = "uLightPoint.intensity"
};

export interface UniformDescription {
    readonly name: UniformName;
    readonly location: WebGLUniformLocation;
};

export default interface ShaderDescription {
    readonly attributes: AttributeDescription[];
    readonly uniforms: UniformDescription[];
};