import ShaderProgram from "./ShaderProgram";
import { AttributeName, UniformName } from "./ShaderDescription";
import ShaderMaker from "./ShaderMaker";

export default class Shaders {

    static makeTextureShader(gl: WebGL2RenderingContext, depthMode: boolean = false): ShaderProgram {
        const vsSource =
            `#version 300 es

            in vec4 aVertexPosition;
            in vec2 aTexCoord0;

            uniform mat4 uWorldMatrix;
            uniform mat4 uProjectionViewMatrix;

            out vec2 vTexCoord0;

            void main() {
                gl_Position = uProjectionViewMatrix * uWorldMatrix * aVertexPosition;
                vTexCoord0 = aTexCoord0;
            }`;

        const fsSource =
            `#version 300 es
            precision highp float;

            uniform sampler2D uTextureSampler0;

            in vec2 vTexCoord0;

            out vec4 fragColor;

            void main() {
                fragColor = vec4(texture(uTextureSampler0, vTexCoord0).xyz, 1.0);
            }`;

        const fsDepthSource =
            `#version 300 es
            precision highp float;

            uniform sampler2D uTextureSampler0;

            in vec2 vTexCoord0;

            out vec4 fragColor;

            float LinearizeDepth(in vec2 uv) {
                float zNear = 0.1;
                float zFar  = 100.0;
                float depth = texture(uTextureSampler0, uv).x;

                return (2.0 * zNear) / (zFar + zNear - depth * (zFar - zNear));
            }

            void main() {
                float linearDepthValue = LinearizeDepth(vTexCoord0);
                fragColor = vec4(linearDepthValue, linearDepthValue, linearDepthValue, 1.0);
            }`;

        const attributes = [AttributeName.VertexPosition, AttributeName.TexCoord0];
        const uniforms = [
            UniformName.ProjectionViewMatrix,
            UniformName.WorldMatrix,
            UniformName.TextureSampler0
        ];
        return ShaderMaker.makeShaderProgram(gl, vsSource, depthMode ? fsDepthSource : fsSource, attributes, uniforms);
    }

    static makeGBufferShader(gl: WebGL2RenderingContext) {
        const vsSource =
            `#version 300 es

            in vec4 aVertexPosition;
            in vec3 aVertexNormal;

            uniform mat4 uWorldMatrix;
            uniform mat4 uProjectionViewMatrix;

            out vec4 vWorldPosition;
            out vec4 vNormal;

            void main() {
                gl_Position = uProjectionViewMatrix * uWorldMatrix * aVertexPosition;
                vWorldPosition = uWorldMatrix * aVertexPosition;
                vNormal = uWorldMatrix * vec4(aVertexNormal, 0.0);
            }`;

        const fsSource =
            `#version 300 es
            precision highp float;

            struct Material {
                vec3 diffuseColor;
                vec3 emissiveColor;
                float specularIntensity;
                float specularPower;
            };

            uniform Material uMaterial;

            in vec4 vWorldPosition;
            in vec4 vNormal;

            layout(location=0) out vec4 fragPosition;
            layout(location=1) out vec4 fragNormal;
            layout(location=2) out vec4 fragDiffuse;
            layout(location=3) out vec4 fragAccumulation;

            void main() {
                fragPosition = vec4(vWorldPosition.xyz, uMaterial.specularIntensity);
                fragNormal = vec4(vNormal.xyz, uMaterial.specularPower);
                fragDiffuse = vec4(uMaterial.diffuseColor.xyz, 1.0);
                fragAccumulation = vec4(uMaterial.emissiveColor.xyz, 1.0);
            }`;

        const attributes = [
            AttributeName.VertexPosition,
            AttributeName.VertexNormal
        ];
        const uniforms = [
            UniformName.ProjectionViewMatrix,
            UniformName.WorldMatrix,
            UniformName.MaterialDiffuseColor,
            UniformName.MaterialEmissiveColor,
            UniformName.MaterialSpecularIntensity,
            UniformName.MaterialSpecularPower
        ];
        return ShaderMaker.makeShaderProgram(gl, vsSource, fsSource, attributes, uniforms);
    }

    static makeDirectionalLightVolumeShader(gl: WebGL2RenderingContext) {
        const vsSource =
            `#version 300 es

            in vec4 aVertexPosition;

            uniform mat4 uWorldMatrix;
            uniform mat4 uProjectionViewMatrix;

            void main() {
                gl_Position = uProjectionViewMatrix * uWorldMatrix * aVertexPosition;
            }`;

        const fsSource =
            `#version 300 es
            precision highp float;

            uniform sampler2D uTextureSampler0; // position
            uniform sampler2D uTextureSampler1; // normal
            uniform sampler2D uTextureSampler2; // diffuse

            struct LightDirectional {
                vec3 color;
                float intensity;
                vec3 direction;
            };

            uniform LightDirectional uLightDirectional;

            out vec4 fragColor;

            void main() {
                ivec2 fragCoord = ivec2(gl_FragCoord.xy);
                vec3 position = texelFetch(uTextureSampler0, fragCoord, 0).xyz;
                vec3 normal = normalize(texelFetch(uTextureSampler1, fragCoord, 0).xyz);
                vec4 diffuse = vec4(texelFetch(uTextureSampler2, fragCoord, 0).xyz, 1.0);

                float diffuseFactor = max(0.0, dot(normal, -uLightDirectional.direction));
                vec4 diffuseLightColor = vec4(uLightDirectional.color * uLightDirectional.intensity * diffuseFactor, 1.0f);

                fragColor = diffuse * diffuseLightColor;
            }`;

        const attributes = [AttributeName.VertexPosition];
        const uniforms = [
            UniformName.ProjectionViewMatrix,
            UniformName.WorldMatrix,
            UniformName.TextureSampler0,
            UniformName.TextureSampler1,
            UniformName.TextureSampler2,
            UniformName.LightDirectional_Direction,
            UniformName.LightDirectional_Color,
            UniformName.LightDirectional_Intensity
        ];
        return ShaderMaker.makeShaderProgram(gl, vsSource, fsSource, attributes, uniforms);
    }

    static makePointLightVolumeShader(gl: WebGL2RenderingContext) {
        const vsSource =
            `#version 300 es

            in vec4 aVertexPosition;

            uniform mat4 uWorldMatrix;
            uniform mat4 uProjectionViewMatrix;

            void main() {
                gl_Position = uProjectionViewMatrix * uWorldMatrix * aVertexPosition;
            }`;

        const fsSource =
            `#version 300 es
            precision highp float;

            uniform sampler2D uTextureSampler0; // position
            uniform sampler2D uTextureSampler1; // normal
            uniform sampler2D uTextureSampler2; // diffuse

            uniform mat4 uWorldMatrix;
            uniform mat4 uInverseWorldMatrix;
            uniform vec3 uCameraPosLocalSpace;

            struct LightPoint {
                vec3 color;
                float intensity;
            };

            uniform LightPoint uLightPoint;

            out vec4 fragColor;

            void main() {
                ivec2 fragCoord = ivec2(gl_FragCoord.xy);
                vec4 positionTexel = texelFetch(uTextureSampler0, fragCoord, 0);
                vec4 normalTexel = texelFetch(uTextureSampler1, fragCoord, 0);

                vec4 position = vec4(positionTexel.xyz, 1.0);
                vec3 normal = normalize(normalTexel.xyz);
                vec4 diffuse = vec4(texelFetch(uTextureSampler2, fragCoord, 0).xyz, 1.0);

                // Determine normals, position, direction in light space.
                // The light is at (0, 0, 0) in light space, so the direction is the same as the surface's
                // position in light space.
                vec3 lightDirection = (uInverseWorldMatrix * position).xyz;
                float lightDistanceSq = dot(lightDirection, lightDirection);
                vec3 lightDirectionNormalized = normalize(lightDirection);
                vec3 normalLightSpace = normalize((uInverseWorldMatrix * vec4(normal, 0.0)).xyz);

                // Calculate attenuation.
                float attenuation = max(0.0, 1.0 - lightDistanceSq);
                attenuation *= attenuation;

                // Diffuse
                float diffuseFactor =  max(0.0, dot(normalLightSpace, -lightDirectionNormalized));
                vec3 diffuseLightColor = uLightPoint.color * uLightPoint.intensity * diffuseFactor * attenuation;

                // Specular
                float specularIntensity = positionTexel.w;
                float specularPower = normalTexel.w;

                vec3 lightReflect = reflect(lightDirectionNormalized, normalLightSpace);
                vec3 surfaceToEye = normalize(uCameraPosLocalSpace - lightDirection);
                float specularFactor = clamp(dot(surfaceToEye, lightReflect), 0.0, 1.0);
                vec3 specularColor = uLightPoint.color * uLightPoint.intensity * specularIntensity * pow(specularFactor, specularPower) * attenuation;

                // Total
                fragColor = diffuse * vec4(diffuseLightColor, 1.0) + vec4(specularColor, 1.0);// + vec4(0.0, 0.00, 0.05, 1.0);
                //fragColor = vec4(1.0, 0.08, 0.0, 1.0);
            }`;

        const attributes = [AttributeName.VertexPosition];
        const uniforms = [
            UniformName.ProjectionViewMatrix,
            UniformName.WorldMatrix,
            UniformName.InverseWorldMatrix,
            UniformName.CameraPositionLocalSpace,
            UniformName.TextureSampler0,
            UniformName.TextureSampler1,
            UniformName.TextureSampler2,
            UniformName.LightPoint_Color,
            UniformName.LightPoint_Intensity
        ];
        return ShaderMaker.makeShaderProgram(gl, vsSource, fsSource, attributes, uniforms);
    }

    static makeStencilPassShader(gl: WebGL2RenderingContext) {
        const vsSource =
            `#version 300 es

            in vec4 aVertexPosition;

            uniform mat4 uWorldMatrix;
            uniform mat4 uProjectionViewMatrix;

            void main() {
                gl_Position = uProjectionViewMatrix * uWorldMatrix * aVertexPosition;
            }`;

        const fsSource =
            `#version 300 es

            void main() {

            }`;

        const attributes = [AttributeName.VertexPosition];
        const uniforms = [
            UniformName.ProjectionViewMatrix,
            UniformName.WorldMatrix
        ];
        return ShaderMaker.makeShaderProgram(gl, vsSource, fsSource, attributes, uniforms);
    }
}