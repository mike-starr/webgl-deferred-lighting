import * as React from "react";
import { mat4, quat, vec3 } from "gl-matrix";
import Camera from "../camera/Camera";
import Renderer from "../renderer/Renderer";
import SceneGraphTransformNode from "../scenegraph/SceneGraphTransformNode";
import SceneGraphNode from "../scenegraph/SceneGraphNode";
import SceneGraphCameraNode from "../scenegraph/SceneGraphCameraNode";
import MeshLoader from "../mesh/MeshLoader";
import SceneGraphShaderProgramNode from "../scenegraph/SceneGraphShaderProgramNode";
import SceneGraphGBufferNode from "../scenegraph/SceneGraphGBufferNode";
import SceneGraphRenderableNode from "../scenegraph/SceneGraphRenderableNode";
import Shaders from "../shaders/Shaders";
import SceneGraphLightPassNode from "../scenegraph/SceneGraphLightPassNode";
import LightVolumeLoader from "../lighting/LightVolumeLoader";

export default class Scene extends React.Component<{}, {}> {
    private readonly canvasElementId = "webgl-canvas";

    private frameId: number = 0;
    private renderer: Renderer | null = null;
    private sceneGraphRoot: SceneGraphNode | null = null;
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
        const cubeNode = new SceneGraphRenderableNode({ mesh: MeshLoader.loadCube(gl, 0.5), textures: [] });
        const cubeNode2 = new SceneGraphRenderableNode({ mesh: MeshLoader.loadSphere(gl, 20, 20), textures: [] });

        mat4.translate(this.cubeWorldTransform, this.cubeWorldTransform, [0.0, 0.0, -10.0]);
        const cubeTransformNode = new SceneGraphTransformNode(this.cubeWorldTransform, [cubeNode]);

        const cube2Transform = mat4.create();
        mat4.translate(cube2Transform, cube2Transform, [2.0, 2.0, -10.0]);
        const cube2TransformNode = new SceneGraphTransformNode(cube2Transform, [cubeNode2]);

        //const cubeShaderNode = new SceneGraphShaderProgramNode(Shaders.makeDefaultShader(gl), [cube2TransformNode, cubeTransformNode]);

        const cubeGShaderNode = new SceneGraphShaderProgramNode(Shaders.makeGBufferShader(gl), [cube2TransformNode, cubeTransformNode]);
        const gBufferNode = this.createGBufferNode(gl, [cubeGShaderNode]);

        const directionalLightVolume = LightVolumeLoader.createDirectional(gl,
            vec3.fromValues(1.0, 0.0, 1.0),
            vec3.fromValues(1.0, 0.0, 0.0),
            0.8,
            0.2,
            gBufferNode.positionTarget,
            gBufferNode.normalTarget,
            gBufferNode.diffuseTarget);
        const directionalLightVolumeNode = new SceneGraphRenderableNode(directionalLightVolume);

        const directionalLightVolume2 = LightVolumeLoader.createDirectional(gl,
            vec3.fromValues(1.0, 1.0, 1.0),
            vec3.fromValues(1.0, 0.0, -1.0),
            0.2,
            0.0,
            gBufferNode.positionTarget,
            gBufferNode.normalTarget,
            gBufferNode.diffuseTarget);
        const directionalLightVolumeNode2 = new SceneGraphRenderableNode(directionalLightVolume2);

        const directionalLightVolumeTransform = mat4.create();
        mat4.fromRotationTranslationScale(directionalLightVolumeTransform, quat.create(), [0.0, 0.0, -50.2], [100.0, 100.0, 100.0]);
        const directionalLightVolumeTransformNode = new SceneGraphTransformNode(directionalLightVolumeTransform, [directionalLightVolumeNode2]);

        const pointLightVolume = LightVolumeLoader.createPoint(gl, vec3.fromValues(1.0, 0.0, 0.0), 1.0, 0.0, 1.0, gBufferNode.positionTarget, gBufferNode.normalTarget, gBufferNode.diffuseTarget);
        const pointLightVolumeNode = new SceneGraphRenderableNode(pointLightVolume);
        const pointLightVolumeTransform = mat4.create();
        mat4.fromTranslation(pointLightVolumeTransform, [-0.5, 0.0, -9.0]);
        const pointLightVolumeTransformNode = new SceneGraphTransformNode(pointLightVolumeTransform, [pointLightVolumeNode]);

        const pointLightVolume2 = LightVolumeLoader.createPoint(gl, vec3.fromValues(1.0, 0.0, 1.0), 1.0, 0.0, 2.0, gBufferNode.positionTarget, gBufferNode.normalTarget, gBufferNode.diffuseTarget);
        const pointLightVolumeNode2 = new SceneGraphRenderableNode(pointLightVolume2);
        const pointLightVolumeTransform2 = mat4.create();
        mat4.fromTranslation(pointLightVolumeTransform2, [0.5, 0.0, -9.0]);
        const pointLightVolumeTransformNode2 = new SceneGraphTransformNode(pointLightVolumeTransform2, [pointLightVolumeNode2]);

        const lightPassDirectionalShaderNode = new SceneGraphShaderProgramNode(Shaders.makeDirectionalLightVolumeShader(gl), [directionalLightVolumeTransformNode]);
        const lightPassPointShaderNode = new SceneGraphShaderProgramNode(Shaders.makePointLightVolumeShader(gl), [pointLightVolumeTransformNode, pointLightVolumeTransformNode2]);
        const lightPassNode = new SceneGraphLightPassNode([lightPassDirectionalShaderNode, lightPassPointShaderNode]);

        const cameraNodeMain = new SceneGraphCameraNode(new Camera(), [gBufferNode, lightPassNode]);

        // 2D overlays
        const quadNodeUpperLeft = new SceneGraphRenderableNode({ mesh: MeshLoader.loadTexturedQuad(gl, -1.0, -0.5, 0.5, 1.0), textures: [gBufferNode.diffuseTarget] });
        const quadNodeLowerLeft = new SceneGraphRenderableNode({ mesh: MeshLoader.loadTexturedQuad(gl, -1.0, -0.5, -1.0, -0.5), textures: [gBufferNode.positionTarget] });
        const quadNodeUpperRight = new SceneGraphRenderableNode({ mesh: MeshLoader.loadTexturedQuad(gl, 0.5, 1.0, 0.5, 1.0), textures: [gBufferNode.normalTarget] });

        const quadNodeLowerRight = new SceneGraphRenderableNode({ mesh: MeshLoader.loadTexturedQuad(gl, 0.5, 1.0, -1.0, -0.5), textures: [gBufferNode.depthTarget] });
        const depthShaderNode = new SceneGraphShaderProgramNode(Shaders.makeTextureShader(gl, true), [quadNodeLowerRight]);

        const quadShaderNode = new SceneGraphShaderProgramNode(Shaders.makeTextureShader(gl), [quadNodeUpperLeft, quadNodeLowerLeft, quadNodeUpperRight]);
        const quadTransform = mat4.create();
        const quadTransformNode = new SceneGraphTransformNode(quadTransform, [quadShaderNode, depthShaderNode]);
        const camera2d = new Camera();
        camera2d.setProjectionOrthographic(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0);
        const cameraNode2d = new SceneGraphCameraNode(camera2d, [quadTransformNode]);

        const rootNode = new SceneGraphNode([cameraNodeMain, cameraNode2d]);

        return rootNode;
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

        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2]);

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