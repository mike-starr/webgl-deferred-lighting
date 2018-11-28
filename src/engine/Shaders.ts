// Temporary, replace with file-based loading.

const vs_basic = `
    attribute vec4 aVertexPosition;

    uniform mat4 uWorldMatrix;
    uniform mat4 uProjectionViewMatrix;

    void main() {
        gl_Position = uProjectionViewMatrix * uWorldMatrix * aVertexPosition;
    }`;

const fs_white = `
    void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }`;

export interface ShaderDef {
    name: string,
    source: string
}

export default class Shaders {

    static get vertexShaders(): ShaderDef[] {
        return [{ name: "vs_basic", source: vs_basic }];
    }

    static get pixelShaders(): ShaderDef[] {
        return [{ name: "fs_white", source: fs_white }];
    }
}