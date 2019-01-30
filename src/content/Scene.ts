import { mat4 } from "gl-matrix";
import Camera from "../camera/Camera";
import SceneGraphNode from "../scenegraph/SceneGraphNode";
import SceneGraphCameraNode from "../scenegraph/SceneGraphCameraNode";
import Animation from "./Animation";
import SceneGraphMeshNode from "../scenegraph/SceneGraphMeshNode";
import MeshLoader from "../mesh/MeshLoader";
import Shaders from "../shaders/Shaders";
import MaterialBuilder from "../material/MaterialBuilder";
import RenderQueue from "../renderer/RenderQueue";
import TextureConstant from "../renderer/TextureConstant";

export default abstract class Scene {

    protected animations: Animation[] = [];

    abstract get graphRoot(): SceneGraphNode;

    abstract initialize(gl: WebGL2RenderingContext): void;

    update(elapsedMs: number): void {
        for (const animation of this.animations) {
            animation.update(elapsedMs);
        }
    }

    protected createOverlayNode(gl: WebGL2RenderingContext): SceneGraphNode {
        const texturedShader = Shaders.makeTextureShader(gl);
        const texturedDepthShader = Shaders.makeTextureShader(gl, true);

        const quadNodeTop = new SceneGraphMeshNode({
            mesh: MeshLoader.loadTexturedQuad(gl, -1.0, -0.5, 0.5, 1.0),
            localTransform: mat4.create(),
            textures: [TextureConstant.GBufferDiffuseTarget],
            material: MaterialBuilder.default,
            shaderProgram: texturedShader,
            renderQueue: RenderQueue.Overlay
        });

        const quadNodeMidUpper = new SceneGraphMeshNode({
            mesh: MeshLoader.loadTexturedQuad(gl, -1.0, -0.5, 0.0, 0.5),
            localTransform: mat4.create(),
            textures: [TextureConstant.GBufferPositionTarget],
            material: MaterialBuilder.default,
            shaderProgram: texturedShader,
            renderQueue: RenderQueue.Overlay
        });

        const quadNodeMidBottom = new SceneGraphMeshNode({
            mesh: MeshLoader.loadTexturedQuad(gl, -1.0, -0.5, -0.5, 0.0),
            localTransform: mat4.create(),
            textures: [TextureConstant.GBufferNormalTarget],
            material: MaterialBuilder.default,
            shaderProgram: texturedShader,
            renderQueue: RenderQueue.Overlay
        });

        const quadNodeBottom = new SceneGraphMeshNode({
            mesh: MeshLoader.loadTexturedQuad(gl, -1.0, -0.5, -1.0, -0.5),
            localTransform: mat4.create(),
            textures: [TextureConstant.GBufferDepthTarget],
            material: MaterialBuilder.default,
            shaderProgram: texturedDepthShader,
            renderQueue: RenderQueue.Overlay
        });

        const quadNodeFullScreen = new SceneGraphMeshNode({
            mesh: MeshLoader.loadTexturedQuad(gl, -1.0, 1.0, -1.0, 1.0),
            localTransform: mat4.create(),
            textures: [TextureConstant.GBufferAccumulationTarget],
            material: MaterialBuilder.default,
            shaderProgram: texturedShader,
            renderQueue: RenderQueue.Overlay
        });

        const camera2d = new Camera();
        camera2d.setProjectionOrthographic(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0);

        return new SceneGraphCameraNode(camera2d, [quadNodeFullScreen, quadNodeTop, quadNodeMidUpper, quadNodeMidBottom, quadNodeBottom]);
    }
}