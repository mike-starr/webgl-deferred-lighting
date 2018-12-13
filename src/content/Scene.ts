import { mat4 } from "gl-matrix";
import Camera from "../camera/Camera";
import SceneGraphNode from "../scenegraph/SceneGraphNode";
import SceneGraphCameraNode from "../scenegraph/SceneGraphCameraNode";
import SceneGraphGPassNode from "../scenegraph/SceneGraphGPassNode";
import SceneGraphMeshNode from "../scenegraph/SceneGraphMeshNode";
import MeshLoader from "../mesh/MeshLoader";
import Shaders from "../shaders/Shaders";
import GBuffer from "../renderer/GBuffer";
import SceneGraphNormalPassNode from "../scenegraph/SceneGraphNormalPassNode";


export default abstract class Scene {

    abstract get graphRoot(): SceneGraphNode;

    abstract initialize(gl: WebGL2RenderingContext): void;

    abstract update(elapsedMs: number): void;

    protected createOverlayNode(gl: WebGL2RenderingContext, gBufferTextures: GBuffer): SceneGraphNode {
        const texturedShader = Shaders.makeTextureShader(gl);
        const texturedDepthShader = Shaders.makeTextureShader(gl, true);

        const quadNodeUpperLeft = new SceneGraphMeshNode({
            mesh: MeshLoader.loadTexturedQuad(gl, -1.0, -0.5, 0.5, 1.0),
            localTransform: mat4.create(),
            textures: [gBufferTextures.diffuseTexture],
            shaderProgram: texturedShader
        });
        const quadNodeLowerLeft = new SceneGraphMeshNode({
            mesh: MeshLoader.loadTexturedQuad(gl, -1.0, -0.5, -1.0, -0.5),
            localTransform: mat4.create(),
            textures: [gBufferTextures.positionTexture],
            shaderProgram: texturedShader
        });
        const quadNodeUpperRight = new SceneGraphMeshNode({
            mesh: MeshLoader.loadTexturedQuad(gl, 0.5, 1.0, 0.5, 1.0),
            localTransform: mat4.create(),
            textures: [gBufferTextures.normalTexture],
            shaderProgram: texturedShader
        });
        const quadNodeLowerRight = new SceneGraphMeshNode({
            mesh: MeshLoader.loadTexturedQuad(gl, 0.5, 1.0, -1.0, -0.5),
            localTransform: mat4.create(),
            textures: [gBufferTextures.depthTexture],
            shaderProgram: texturedDepthShader
        });

        const camera2d = new Camera();
        camera2d.setProjectionOrthographic(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0);

        const cameraNode = new SceneGraphCameraNode(camera2d, [quadNodeUpperLeft, quadNodeLowerLeft, quadNodeUpperRight, quadNodeLowerRight]);
        return new SceneGraphNormalPassNode([cameraNode]);
    }

    /*protected createGBufferNode(gl: WebGL2RenderingContext, children: SceneGraphNode[]): SceneGraphGPassNode {
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

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return new SceneGraphGPassNode( {frameBuffer: frameBuffer,
            diffuseTexture: diffuseTarget,
            positionTexture: positionTarget,
            normalTexture: normalTarget,
            depthTexture: depthTarget
        },
            children);
    }

    protected createRenderTargetTexture(gl: WebGL2RenderingContext, format: GLenum): WebGLTexture {
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
    }*/

    protected createTestTexture(gl: WebGL2RenderingContext): WebGLTexture {
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