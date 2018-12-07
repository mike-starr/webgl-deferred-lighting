import * as React from "react";
import { mat4 } from "gl-matrix";
import Camera from "../engine/Camera";
import Renderer from "../renderer/Renderer";
import SceneGraphTransformNode from "../scenegraph/SceneGraphTransformNode";
import SceneGraphNode from "../scenegraph/SceneGraphNode";
import SceneGraphCameraNode from "../scenegraph/SceneGraphCameraNode";
import MeshLoader from "../Mesh/MeshLoader";
import SceneGraphShaderProgramNode from "../scenegraph/SceneGraphShaderProgramNode";
import ShaderMaker from "../engine/ShaderMaker";
import { AttributeName, UniformName } from "../engine/ShaderDescription";
import SceneGraphMeshNode from "../scenegraph/SceneGraphMeshNode";
import SceneGraphTextureNode from "../scenegraph/SceneGraphTextureNode";
import SceneGraphGBufferNode from "../scenegraph/SceneGraphGBufferNode";

export default class Scene extends React.Component<{}, {}> {
    private readonly canvasElementId = "webgl-canvas";

    private frameId: number = 0;
    private renderer: Renderer | null = null;
    private sceneGraphRoot: SceneGraphNode | null = null;
    private meshLoader: MeshLoader = new MeshLoader();
    private shaderMaker: ShaderMaker = new ShaderMaker();
    private cubeWorldTransform: mat4 = mat4.create();
    private lastFrameTime: DOMHighResTimeStamp = 0;

    constructor(props: any) {
        super(props);
    }

    componentDidMount() {
        const canvas = this.refs[this.canvasElementId] as HTMLCanvasElement;
        const gl = canvas.getContext('webgl2');

        if (!gl) {
            throw new Error("Failed to initialize webgl context.");
        }

        this.sceneGraphRoot = this.createScene(gl);
        this.renderer = new Renderer(gl);
        this.start();
    }

    componentWillUnmount() {
        this.stop();
    }

    start() {
        this.frameId = window.requestAnimationFrame((time) => this.onAnimationFrame(time));
    }

    stop() {
        if (this.frameId !== 0) {
            window.cancelAnimationFrame(this.frameId);
        }
    }

    onAnimationFrame(time: DOMHighResTimeStamp) {
        let frameTime = (1 / 60) * 1000;

        if (this.lastFrameTime > 0) {
            frameTime = time - this.lastFrameTime;
        }

        this.lastFrameTime = time;

        mat4.rotateX(this.cubeWorldTransform, this.cubeWorldTransform, (Math.PI / 7000) * frameTime);
        mat4.rotateY(this.cubeWorldTransform, this.cubeWorldTransform, (Math.PI / 3000) * frameTime);
        mat4.rotateZ(this.cubeWorldTransform, this.cubeWorldTransform, (Math.PI / 13000) * frameTime);

        this.renderScene();
        this.frameId = requestAnimationFrame((time) => this.onAnimationFrame(time));
    }

    renderScene() {
        (this.renderer as Renderer).render(this.sceneGraphRoot as SceneGraphNode);
    }

    render() {
        return <canvas ref={this.canvasElementId} width={800} height={600} />;
    }

    private createScene(gl: WebGL2RenderingContext): SceneGraphNode {
        const cubeNode = new SceneGraphMeshNode(this.meshLoader.loadCube(gl, 0.5));
        const cubeShaderNode = new SceneGraphShaderProgramNode(this.makeDefaultShader(gl), [cubeNode]);

        const cubeGShaderNode = new SceneGraphShaderProgramNode(this.makeGBufferShader(gl), [cubeNode]);
        const gBufferNode = new SceneGraphGBufferNode([cubeGShaderNode]);

        mat4.translate(this.cubeWorldTransform, this.cubeWorldTransform, [0.0, 0.0, -10.0]);
        const cubeTransformNode = new SceneGraphTransformNode(this.cubeWorldTransform, [gBufferNode, cubeShaderNode]);
        const cameraNodeMain = new SceneGraphCameraNode(new Camera(), [cubeTransformNode]);

        const quadNode = new SceneGraphMeshNode(this.meshLoader.loadTexturedQuad(gl, -1.0, -0.5, 0.5, 1.0));
        const textureNode = new SceneGraphTextureNode(this.createTestTexture(gl), gl.TEXTURE0, [quadNode]);
        const quadShaderNode = new SceneGraphShaderProgramNode(this.makeTextureShader(gl), [textureNode]);
        const quadTransform = mat4.create();
        const quadTransformNode = new SceneGraphTransformNode(quadTransform, [quadShaderNode]);
        const camera2d = new Camera();
        camera2d.setProjectionOrthographic(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0);
        const cameraNode2d = new SceneGraphCameraNode(camera2d, [quadTransformNode]);

        const rootNode = new SceneGraphNode([cameraNodeMain, cameraNode2d]);

        return rootNode;
    }

    private makeDefaultShader(gl: WebGL2RenderingContext) {
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
        return this.shaderMaker.makeShaderProgram(gl, vsSource, fsSource, attributes, uniforms);
    }

    private makeTextureShader(gl: WebGL2RenderingContext) {
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

        const attributes = [AttributeName.VertexPosition, AttributeName.TexCoord0];
        const uniforms = [UniformName.ProjectionViewMatrix, UniformName.WorldMatrix, UniformName.TextureSampler0];
        return this.shaderMaker.makeShaderProgram(gl, vsSource, fsSource, attributes, uniforms);
    }

    private makeGBufferShader(gl: WebGL2RenderingContext) {
        const vsSource =
            `#version 300 es

            in vec4 aVertexPosition;
            in vec4 aVertexColor;
            in vec3 aVertexNormal;
            //in vec2 aTexCoord0;

            uniform mat4 uWorldMatrix;
            uniform mat4 uProjectionViewMatrix;

            //out vec2 vTexCoord0;
            out vec4 vWorldPosition;
            out vec4 vDiffuse;
            out vec4 vNormal;

            void main() {
                gl_Position = uProjectionViewMatrix * uWorldMatrix * aVertexPosition;
                vWorldPosition = uWorldMatrix * aVertexPosition;
                vNormal = uWorldMatrix * vec4(aVertexNormal, 0.0);
                vDiffuse = aVertexColor;
                //vTexCoord0 = aTexCoord0;
            }`;

        const fsSource =
            `#version 300 es
            precision highp float;

            //uniform sampler2D uTextureSampler0;

            //in vec2 vTexCoord0;
            in vec4 vWorldPosition;
            in vec4 vDiffuse;
            in vec4 vNormal;

            layout(location=0) out vec4 fragPosition;
            layout(location=1) out vec4 fragNormal;
            layout(location=2) out vec4 fragDiffuse;

            void main() {
                fragPosition = vWorldPosition;
                fragDiffuse = vDiffuse;
                fragNormal = vec4(vNormal.xyz, 1.0);
            }`;

        const attributes = [AttributeName.VertexPosition, AttributeName.VertexColor, AttributeName.VertexNormal];
        const uniforms = [UniformName.ProjectionViewMatrix, UniformName.WorldMatrix];//, UniformName.TextureSampler0];
        return this.shaderMaker.makeShaderProgram(gl, vsSource, fsSource, attributes, uniforms);
    }

    private createTestTexture(gl: WebGL2RenderingContext): WebGLTexture {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        if (!texture) {
            throw new Error("Unable to create texture.");
        }

        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([0, 0, 255, 255]);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                      width, height, border, srcFormat, srcType,
                      pixel);

        return texture;
    }
}