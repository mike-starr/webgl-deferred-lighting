import Scene from "./Scene";
import SceneGraphNode from "../scenegraph/SceneGraphNode";
import SceneGraphCameraNode from "../scenegraph/SceneGraphCameraNode";
import Renderable from "../renderer/Renderable";
import MeshLoader from "../mesh/MeshLoader";
import { mat4, vec3, quat } from "gl-matrix";
import Camera from "../camera/Camera";
import SceneGraphTransformNode from "../scenegraph/SceneGraphTransformNode";
import SceneGraphMeshNode from "../scenegraph/SceneGraphMeshNode";
import Shaders from "../shaders/Shaders";
import Renderer from "../renderer/Renderer";
import SceneGraphGPassNode from "../scenegraph/SceneGraphGPassNode";
import ShaderProgram from "../shaders/ShaderProgram";
import GBuffer from "../renderer/GBuffer";
import SceneGraphLightNode from "../scenegraph/SceneGraphLightNode";
import DirectionalLightVolume from "../lighting/DirectionalLightVolume";
import SceneGraphLightPassNode from "../scenegraph/SceneGraphLightPassNode";
import Mesh from "../Mesh/Mesh";
import PointLightVolume from "../lighting/PointLightVolume";

export default class HolidayScene extends Scene {

    private rootNode: SceneGraphNode = new SceneGraphNode([]);

    private gPassShader: ShaderProgram | null = null;
    private directionalLightShader: ShaderProgram | null = null;
    private pointLightShader: ShaderProgram | null = null;
    private gBuffer: GBuffer | null = null;
    private lightPassTextures: WebGLTexture[] = [];

    get graphRoot(): SceneGraphNode {
        return this.rootNode;
    }

    initialize(gl: WebGL2RenderingContext): void {
        this.gPassShader = Shaders.makeGBufferShader(gl);
        this.directionalLightShader = Shaders.makeDirectionalLightVolumeShader(gl);
        this.pointLightShader = Shaders.makePointLightVolumeShader(gl);
        this.gBuffer = Renderer.createGBuffer(gl);
        this.lightPassTextures = [this.gBuffer.positionTexture, this.gBuffer.normalTexture, this.gBuffer.diffuseTexture];


        const room = this.makeRoom(gl);
        const tree = this.makeTree(gl);

        const treeTransform = mat4.create();


        const directionalLightVolumeTransform = mat4.create();
        mat4.fromRotationTranslationScale(directionalLightVolumeTransform, quat.create(), [0.0, 0.0, 0.0], [100.0, 100.0, 7.0]);

        const directionalLightVolumeNode = new SceneGraphLightNode(<DirectionalLightVolume> {
            color: vec3.fromValues(1.0, 1.0, 1.0),
            direction: vec3.fromValues(0.4, -0.5, -1.0),
            intensity: 0.3,
            ambientIntensity: 0.0,
            mesh: MeshLoader.loadCube(gl, 0.5),
            localTransform: directionalLightVolumeTransform,
            textures: this.lightPassTextures,
            shaderProgram: this.directionalLightShader
        });

        const pointLightVolumeTransform = mat4.create();

        mat4.fromRotationTranslationScale(pointLightVolumeTransform, quat.create(), [-0.0, 3.5, 1.0], [5.5, 5.5, 5.5]);

        const pointLightVolumeNode = new SceneGraphLightNode(<PointLightVolume> {
            color: vec3.fromValues(1.0, 0.8, 0.2),
            intensity: 1.0,
            ambientIntensity: 0.0,
            mesh: MeshLoader.loadSphere(gl, 10, 10),
            localTransform: pointLightVolumeTransform,
            textures: this.lightPassTextures,
            shaderProgram: this.pointLightShader
        });

        const rootTransform = mat4.create();
        const rootTransformNode = new SceneGraphTransformNode(rootTransform, [room, tree, directionalLightVolumeNode, pointLightVolumeNode]);

        const mainCamera = new Camera();
        mainCamera.setLookAt(vec3.fromValues(0.0, 2.5, 8.0), vec3.fromValues(0.0, 1.5, -4.0), vec3.fromValues(0.0, 1.0, 0.0));
        const cameraNodeMain = new SceneGraphCameraNode(mainCamera, [rootTransformNode]);

        const gBufferPass = new SceneGraphGPassNode(this.gBuffer, [cameraNodeMain]);
        const lightPass = new SceneGraphLightPassNode([cameraNodeMain]);
        const overlayPass = this.createOverlayNode(gl, gBufferPass.gBuffer);


        this.rootNode = new SceneGraphNode([lightPass, gBufferPass, overlayPass]);
    }

    update(elapsedMs: number): void {

    }

    private makeRoom(gl: WebGL2RenderingContext): SceneGraphNode {
        const cubeMesh = MeshLoader.loadCube(gl, 0.5);

        const width = 9.0;
        const height = 4.0;
        const depth = 5.0;
        const wallWidth = 0.01;

        const floorLocalTransform = mat4.create();
        mat4.fromScaling(floorLocalTransform, [width, wallWidth, depth]);
        const floorNode = new SceneGraphMeshNode(this.makeCubeRenderable(floorLocalTransform, cubeMesh));

        const rightWallTransform = mat4.create();
        mat4.fromRotationTranslationScale(rightWallTransform, quat.create(), [width / 2, height / 2, 0], [wallWidth, height, depth]);
        const rightWallNode = new SceneGraphMeshNode(this.makeCubeRenderable(rightWallTransform, cubeMesh));

        const backWallTransform = mat4.create();
        mat4.fromRotationTranslationScale(backWallTransform, quat.create(), [0.0, height / 2, -depth / 2], [width, height, wallWidth]);
        const backWallNode = new SceneGraphMeshNode(this.makeCubeRenderable(backWallTransform, cubeMesh));

        return new SceneGraphNode([floorNode, rightWallNode, backWallNode]);
    }

    private makeTree(gl: WebGL2RenderingContext): SceneGraphNode {
        const brownCube = MeshLoader.loadCube(gl, 0.5, vec3.fromValues(.4, .26, .13));

        const stumpWidth = 0.3;
        const stumpHeight = 0.4;

        const stumpTransform = mat4.create();
        mat4.fromRotationTranslationScale(stumpTransform, quat.create(), [0.0, stumpHeight / 2.0, 0.0], [stumpWidth, stumpHeight, stumpWidth]);
        const stumpNode = new SceneGraphMeshNode(this.makeCubeRenderable(stumpTransform, brownCube));

        const greenCube = MeshLoader.loadCube(gl, 0.5, vec3.fromValues(0.0, .41, .24), true);

        const treeHeight = 2.2;
        const treeWidth = 1.1;

        const treeTransform = mat4.create();
        mat4.fromRotationTranslationScale(treeTransform, quat.create(), [0.0, (treeHeight / 2.0) + stumpHeight, 0.0], [treeWidth, treeHeight, treeWidth]);
        const treeNode = new SceneGraphMeshNode(this.makeCubeRenderable(treeTransform, greenCube));

        const treeTransform2 = mat4.create();
        const treeRot = quat.create();
        quat.fromEuler(treeRot, 0.0, 45.0, 0.0);
        mat4.fromRotationTranslationScale(treeTransform2, treeRot, [0.0, (treeHeight / 2.0) + stumpHeight, 0.0], [treeWidth, treeHeight, treeWidth]);
        const treeNode2 = new SceneGraphMeshNode(this.makeCubeRenderable(treeTransform2, greenCube));

        return new SceneGraphNode([stumpNode, treeNode, treeNode2]);
    }

    private makeCubeRenderable(transform: mat4, mesh: Mesh) {
        return {
            mesh: mesh,
            localTransform: transform,
            textures: [],
            shaderProgram: this.gPassShader as ShaderProgram
        };
    }

}