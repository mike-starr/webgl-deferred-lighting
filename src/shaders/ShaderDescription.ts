export enum AttributeName {
    VertexPosition = "aVertexPosition",
    VertexNormal = "aVertexNormal",
    VertexColor = "aVertexColor",
    TexCoord0 = "aTexCoord0"
};

export interface AttributeDescription {
    readonly name: AttributeName;
    readonly location: GLint;
};

export enum UniformName {
    ProjectionViewMatrix = "uProjectionViewMatrix",
    WorldMatrix = "uWorldMatrix",
    TextureSampler0 = "uTextureSampler0",
    TextureSampler1 = "uTextureSampler1",
    TextureSampler2 = "uTextureSampler2",
    TextureSampler3 = "uTextureSampler3",

    // directional light
    LightDirectional_Color = "uLightDirectional.color",
    LightDirectional_Direction = "uLightDirectional.direction",
    LightDirectional_Intensity = "uLightDirectional.intensity",
    LightDirectional_AmbientIntensity = "uLightDirectional.ambientIntensity",

    // point light
    LightPoint_Color = "uLightPoint.color",
    LightPoint_Intensity = "uLightPoint.intensity",
    LightPoint_OneDivRangeSq = "uLightPoint.oneDivRangeSq",
    LightPoint_AmbientIntensity = "uLightPoint.ambientIntensity"
};

export interface UniformDescription {
    readonly name: UniformName;
    readonly location: WebGLUniformLocation;
};

export default interface ShaderDescription {
    readonly attributes: AttributeDescription[];
    readonly uniforms: UniformDescription[];
};