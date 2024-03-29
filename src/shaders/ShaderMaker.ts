import ShaderProgram from "./ShaderProgram";
import { AttributeName, UniformName, AttributeDescription, UniformDescription } from "./ShaderDescription";

export default class ShaderMaker {

    static makeShaderProgram(gl: WebGL2RenderingContext,
        vertexShaderSource: string,
        fragmentShaderSource: string,
        attributeNames: AttributeName[],
        uniformNames: UniformName[]): ShaderProgram {

        const vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

        const shaderProgram = gl.createProgram();
        if (!shaderProgram) {
            throw new Error(`Failed to create shader program.`);
        }

        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            throw new Error(`Failed to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
        }

        const attributeDescriptions: AttributeDescription[] = [];
        for (const attribute of attributeNames) {
            const location = gl.getAttribLocation(shaderProgram, attribute);

            if (location < 0) {
                throw new Error("Shader attribute not found.");
            }

            attributeDescriptions.push({
                name: attribute,
                location: location
            });
        }

        const uniformDescriptions: UniformDescription[] = [];
        for (const uniform of uniformNames) {
            const location = gl.getUniformLocation(shaderProgram, uniform);

            if (!location) {
                throw new Error("Shader attribute not found.");
            }

            uniformDescriptions.push({
                name: uniform,
                location: location
            });
        }

        return {
            program: shaderProgram,
            description: {
                attributes: attributeDescriptions,
                uniforms: uniformDescriptions
            }
        }
    }

    private static loadShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
        const shader = gl.createShader(type);

        if (!shader) {
            throw new Error(`Failed to create shader.`);
        }

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(`Shader compilation error: ${gl.getShaderInfoLog(shader)}`);
        }

        return shader;
    }
}