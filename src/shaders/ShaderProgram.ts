import ShaderDescription from "./ShaderDescription";

export default interface ShaderProgram {
    readonly program: WebGLProgram,
    readonly description: ShaderDescription
}