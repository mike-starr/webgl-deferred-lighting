import { mat4 } from "gl-matrix";
import Camera from "../camera/Camera";
import SceneGraphNode from "../scenegraph/SceneGraphNode";
import SceneGraphCameraNode from "../scenegraph/SceneGraphCameraNode";
import Animation from "./Animation";
import SceneGraphMeshNode from "../scenegraph/SceneGraphMeshNode";
import MeshLoader from "../mesh/MeshLoader";
import Shaders from "../shaders/Shaders";
import GBuffer from "../renderer/GBuffer";
import SceneGraphNormalPassNode from "../scenegraph/SceneGraphNormalPassNode";


export default abstract class Scene {

    protected animations: Animation[] = [];

    abstract get graphRoot(): SceneGraphNode;

    abstract initialize(gl: WebGL2RenderingContext): void;

    update(elapsedMs: number): void {
        for (const animation of this.animations) {
            animation.update(elapsedMs);
        }
    }

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

        const quadNodeFullScreen = new SceneGraphMeshNode({
            mesh: MeshLoader.loadTexturedQuad(gl, -1.0, 1.0, -1.0, 1.0),
            localTransform: mat4.create(),
            textures: [gBufferTextures.accumulationTexture],
            shaderProgram: texturedShader
        });

        const camera2d = new Camera();
        camera2d.setProjectionOrthographic(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0);

        const cameraNode = new SceneGraphCameraNode(camera2d, [quadNodeFullScreen, quadNodeUpperLeft, quadNodeLowerLeft, quadNodeUpperRight, quadNodeLowerRight]);
        return new SceneGraphNormalPassNode([cameraNode]);
    }

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