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
        const cubeNode2 = new SceneGraphMeshNode(this.meshLoader.loadCube(gl, 1.5));

        mat4.translate(this.cubeWorldTransform, this.cubeWorldTransform, [0.0, 0.0, -10.0]);
        const cubeTransformNode = new SceneGraphTransformNode(this.cubeWorldTransform, [cubeNode]);

        const cube2Transform = mat4.create();
        mat4.translate(cube2Transform, cube2Transform, [5.0, 5.0, -40.0]);
        const cube2TransformNode = new SceneGraphTransformNode(cube2Transform, [cubeNode2]);

        const cubeShaderNode = new SceneGraphShaderProgramNode(this.makeDefaultShader(gl), [cube2TransformNode, cubeTransformNode]);

        const cubeGShaderNode = new SceneGraphShaderProgramNode(this.makeGBufferShader(gl), [cube2TransformNode, cubeTransformNode]);
        const gBufferNode = this.createGBufferNode(gl, [cubeGShaderNode]);

        const cameraNodeMain = new SceneGraphCameraNode(new Camera(), [cubeShaderNode, gBufferNode]);

        // 2D overlays
        const quadNodeUpperLeft = new SceneGraphMeshNode(this.meshLoader.loadTexturedQuad(gl, -1.0, -0.5, 0.5, 1.0));
        const textureNodeDiffuseG = new SceneGraphTextureNode(gBufferNode.diffuseTarget, gl.TEXTURE0, [quadNodeUpperLeft]);

        const quadNodeLowerLeft = new SceneGraphMeshNode(this.meshLoader.loadTexturedQuad(gl, -1.0, -0.5, -1.0, -0.5));
        const textureNodePositionG = new SceneGraphTextureNode(gBufferNode.positionTarget, gl.TEXTURE0, [quadNodeLowerLeft]);

        const quadNodeUpperRight = new SceneGraphMeshNode(this.meshLoader.loadTexturedQuad(gl, 0.5, 1.0, 0.5, 1.0));
        const textureNodeNormalG = new SceneGraphTextureNode(gBufferNode.normalTarget, gl.TEXTURE0, [quadNodeUpperRight]);

        const quadNodeLowerRight = new SceneGraphMeshNode(this.meshLoader.loadTexturedQuad(gl, 0.5, 1.0, -1.0, -0.5));
        const textureNodeDepthG = new SceneGraphTextureNode(gBufferNode.depthTarget, gl.TEXTURE0, [quadNodeLowerRight]);
        const depthShaderNode = new SceneGraphShaderProgramNode(this.makeTextureShader(gl, true), [textureNodeDepthG]);

        const quadShaderNode = new SceneGraphShaderProgramNode(this.makeTextureShader(gl), [textureNodeDiffuseG, textureNodePositionG, textureNodeNormalG]);
        const quadTransform = mat4.create();
        const quadTransformNode = new SceneGraphTransformNode(quadTransform, [quadShaderNode, depthShaderNode]);
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

    private makeTextureShader(gl: WebGL2RenderingContext, depthMode: boolean = false) {
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
        return this.shaderMaker.makeShaderProgram(gl, vsSource, depthMode ? fsDepthSource : fsSource, attributes, uniforms);
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

    private createGBufferNode(gl: WebGL2RenderingContext, children: SceneGraphNode[]): SceneGraphGBufferNode {
        const frameBuffer = gl.createFramebuffer();
        if (!frameBuffer) {
            throw new Error("Failed to create framebuffer.");
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

        const positionTarget = this.createRenderTargetTexture(gl, gl.RGBA32F);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, positionTarget, 0);

        const normalTarget = this.createRenderTargetTexture(gl, gl.RGBA32F);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, normalTarget, 0);

        const diffuseTarget = this.createRenderTargetTexture(gl, gl.RGBA8);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, diffuseTarget, 0);

        const depthTarget = this.createRenderTargetTexture(gl, gl.DEPTH_COMPONENT24);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTarget, 0);

        gl.drawBuffers([ gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2 ]);

        console.log(gl.checkFramebufferStatus(gl.FRAMEBUFFER));

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return new SceneGraphGBufferNode(frameBuffer,
            diffuseTarget,
            positionTarget,
            normalTarget,
            depthTarget,
            children);
    }

    private createRenderTargetTexture(gl: WebGL2RenderingContext, format: GLenum): WebGLTexture {
        const texture = gl.createTexture();
        if (!texture) {
            throw new Error("Failed to create texture.");
        }

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texStorage2D(gl.TEXTURE_2D, 1, format, gl.drawingBufferWidth, gl.drawingBufferHeight);

        return texture;

    }
}