import Scene from "./Scene";
import SceneGraphNode from "../scenegraph/SceneGraphNode";
import SceneGraphCameraNode from "../scenegraph/SceneGraphCameraNode";
import Renderable from "../renderer/Renderable";
import MeshLoader from "../mesh/MeshLoader";
import { mat4, vec3 } from "gl-matrix";
import Camera from "../camera/Camera";
import SceneGraphTransformNode from "../scenegraph/SceneGraphTransformNode";
import SceneGraphMeshNode from "../scenegraph/SceneGraphMeshNode";

export default class HolidayScene extends Scene {

    private rootNode: SceneGraphNode = new SceneGraphNode([]);

    get graphRoot(): SceneGraphNode {
        return this.rootNode;
    }

    initialize(gl: WebGL2RenderingContext): void {

        const floorWorldMatrix = mat4.create();
        mat4.fromScaling(floorWorldMatrix, [7.0, 0.01, 7.0]);

        const cubeMesh = MeshLoader.loadCube(gl, 0.5);

        const floor: Renderable = {
            mesh: cubeMesh,
            localTransform: floorWorldMatrix,
            textures: []
        };

        const floorNode = new SceneGraphMeshNode(floor);

        const rootTransform = mat4.create();
        mat4.translate(rootTransform, rootTransform, [0.0, 0.0, -10.0]);

        const rootTransformNode = new SceneGraphTransformNode(rootTransform, [floorNode]);

        const gBufferPass = this.createGBufferNode(gl, [rootTransformNode]);
        const overlayPass = this.createOverlayNode(gl, gBufferPass.gBufferTextures);

        const mainCamera = new Camera();
        mainCamera.setLookAt(vec3.fromValues(0.0, 2.0, 0.0), vec3.fromValues(0.0, 2.0, -50.0), vec3.fromValues(0.0, 1.0, 0.0));
        const cameraNodeMain = new SceneGraphCameraNode(mainCamera, [gBufferPass]);


        this.rootNode = new SceneGraphNode([cameraNodeMain, overlayPass]);
    }

    update(elapsedMs: number): void {

    }

}