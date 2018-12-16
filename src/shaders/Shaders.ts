import ShaderProgram from "./ShaderProgram";
import { AttributeName, UniformName } from "./ShaderDescription";
import ShaderMaker from "./ShaderMaker";

export default class Shaders {

    static makeVertexColorShader(gl: WebGL2RenderingContext) {
        const vsSource =
            `#version 300 es
            in vec4 aVertexPosition;
            in vec4 aVertexColor;

            uniform mat4 uWorldMatrix;
            uniform mat4 uProjectionViewMatrix;

            out lowp vec4 vColor;

            void main() {
                gl_Position = uProjectionViewMatrix * uWorldMatrix * aVertexPosition;
                vColor = aVertexColor;
            }`;

        const fsSource =
            `#version 300 es
            precision highp float;

            in lowp vec4 vColor;

            out vec4 fragColor;

            void main() {
                fragColor = vColor;
            }`;

        const attributes = [AttributeName.VertexPosition, AttributeName.VertexColor];
        const uniforms = [UniformName.ProjectionViewMatrix, UniformName.WorldMatrix];
        return ShaderMaker.makeShaderProgram(gl, vsSource, fsSource, attributes, uniforms);
    }

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
                fragColor = texture(uTextureSampler0, vTexCoord0);
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
        const uniforms = [UniformName.ProjectionViewMatrix, UniformName.WorldMatrix, UniformName.TextureSampler0];
        return ShaderMaker.makeShaderProgram(gl, vsSource, depthMode ? fsDepthSource : fsSource, attributes, uniforms);
    }

    static makeGBufferShader(gl: WebGL2RenderingContext) {
        const vsSource =
            `#version 300 es

            in vec4 aVertexPosition;
            in vec4 aVertexColor;
            in vec3 aVertexNormal;

            uniform mat4 uWorldMatrix;
            uniform mat4 uProjectionViewMatrix;

            out vec4 vWorldPosition;
            out vec4 vDiffuse;
            out vec4 vNormal;
            out vec3 vEmissive;
            out float specularIntensity;
            out float specularPower;

            void main() {
                gl_Position = uProjectionViewMatrix * uWorldMatrix * aVertexPosition;
                vWorldPosition = uWorldMatrix * aVertexPosition;
                vNormal = uWorldMatrix * vec4(aVertexNormal, 0.0);
                vDiffuse = aVertexColor;
                vEmissive = vec3(0.0, 0.0, 0.0);
                specularIntensity = 0.5;
                specularPower = 1.0;
            }`;

        const fsSource =
            `#version 300 es
            precision highp float;

            in vec4 vWorldPosition;
            in vec4 vDiffuse;
            in vec4 vNormal;
            in vec3 vEmissive;

            layout(location=0) out vec4 fragPosition;
            layout(location=1) out vec4 fragNormal;
            layout(location=2) out vec4 fragDiffuse;
            layout(location=3) out vec4 fragAccumulation;

            void main() {
                fragPosition = vWorldPosition;
                fragDiffuse = vDiffuse;
                fragNormal = vNormal;
                fragAccumulation = vec4(vEmissive, 1.0);
            }`;

        const attributes = [AttributeName.VertexPosition, AttributeName.VertexColor, AttributeName.VertexNormal];
        const uniforms = [UniformName.ProjectionViewMatrix, UniformName.WorldMatrix];//, UniformName.TextureSampler0];
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

            //layout(location=0) out vec4 accumulationTarget;

            void main() {
                ivec2 fragCoord = ivec2(gl_FragCoord.xy);
                vec3 position = texelFetch(uTextureSampler0, fragCoord, 0).xyz;
                vec3 normal = normalize(texelFetch(uTextureSampler1, fragCoord, 0).xyz);
                vec4 diffuse = vec4(texelFetch(uTextureSampler2, fragCoord, 0).xyz, 1.0);

                float diffuseFactor = max(0.0, dot(normal, -uLightDirectional.direction));
                vec4 diffuseLightColor = vec4(uLightDirectional.color * uLightDirectional.intensity * diffuseFactor, 1.0f);

                fragColor = diffuse * diffuseLightColor;
                //accumulationTarget = diffuse * diffuseLightColor;
            }`;

        const attributes = [AttributeName.VertexPosition];
        const uniforms = [UniformName.ProjectionViewMatrix,
        UniformName.WorldMatrix,
        UniformName.TextureSampler0,
        UniformName.TextureSampler1,
        UniformName.TextureSampler2,
        UniformName.LightDirectional_Direction,
        UniformName.LightDirectional_Color,
        UniformName.LightDirectional_Intensity];
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
            uniform mat4 uCameraPosLightSpace;

            struct LightPoint {
                vec3 color;
                float intensity;
            };

            uniform LightPoint uLightPoint;

            out vec4 fragColor;

            void main() {
                ivec2 fragCoord = ivec2(gl_FragCoord.xy);
                vec4 position = vec4(texelFetch(uTextureSampler0, fragCoord, 0).xyz, 1.0);
                vec3 normal = normalize(texelFetch(uTextureSampler1, fragCoord, 0).xyz);
                vec4 diffuse = vec4(texelFetch(uTextureSampler2, fragCoord, 0).xyz, 1.0);

                // Determine normals, position, direction in light space.
                // The light is at 0,0,0 in light space, so the direction is the same as the surface's
                // position in light space.
                vec3 lightDirection = (uInverseWorldMatrix * position).xyz;
                float lightDistanceSq = dot(lightDirection, lightDirection);
                vec3 normalLightSpace = normalize((uInverseWorldMatrix * vec4(normal, 0.0)).xyz);

                // Calculate attenuation.
                float attenuation = max(0.0, 1.0 - lightDistanceSq);
                attenuation *= attenuation;

                // Diffuse
                float diffuseFactor = max(0.0, dot(normalLightSpace, normalize(-lightDirection)));
                vec3 diffuseLightColor = uLightPoint.color * uLightPoint.intensity * diffuseFactor * attenuation;



                // Specular



                // Combine everything.
                fragColor = diffuse * vec4(diffuseLightColor, 1.0);// + vec4(0.0, 0.08, 0.0, 1.0);




            }`;

        const attributes = [AttributeName.VertexPosition];
        const uniforms = [UniformName.ProjectionViewMatrix,
        UniformName.WorldMatrix,
        UniformName.InverseWorldMatrix,
        UniformName.TextureSampler0,
        UniformName.TextureSampler1,
        UniformName.TextureSampler2,
        UniformName.LightPoint_Color,
        UniformName.LightPoint_Intensity];
        return ShaderMaker.makeShaderProgram(gl, vsSource, fsSource, attributes, uniforms);
    }
}