import ShaderDescription from "./ShaderDescription";

export default interface ShaderProgram {
    program: WebGLProgram,
    description: ShaderDescription
}