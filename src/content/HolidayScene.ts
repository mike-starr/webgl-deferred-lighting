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
import RotationAnimation from "./RotationAnimation";

export default class HolidayScene extends Scene {

    private rootNode: SceneGraphNode = new SceneGraphNode([]);

    private gPassShader: ShaderProgram | null = null;
    private directionalLightShader: ShaderProgram | null = null;
    private pointLightShader: ShaderProgram | null = null;
    private gBuffer: GBuffer | null = null;
    private lightPassTextures: WebGLTexture[] = [];
    private pointLightSphere: Mesh | null = null;

    get graphRoot(): SceneGraphNode {
        return this.rootNode;
    }

    initialize(gl: WebGL2RenderingContext): void {
        this.gPassShader = Shaders.makeGBufferShader(gl);
        this.directionalLightShader = Shaders.makeDirectionalLightVolumeShader(gl);
        this.pointLightShader = Shaders.makePointLightVolumeShader(gl);
        this.gBuffer = Renderer.createGBuffer(gl);
        this.pointLightSphere = MeshLoader.loadSphere(gl, 10, 10);
        this.lightPassTextures = [this.gBuffer.positionTexture, this.gBuffer.normalTexture, this.gBuffer.diffuseTexture];

        const room = this.makeRoom(gl);
        const tree = this.makeTree(gl);

        const pointLight = this.makePointLight(gl, 0.5, vec3.fromValues(1.0, 0.0, 0.0), 1.0);
        const orbit = this.makeOrbit(2.0, [pointLight, pointLight, pointLight,pointLight,pointLight,pointLight]);
        const orbitTransform = mat4.create();
        mat4.translate(orbitTransform, orbitTransform, [0.0, 0.2, 0.0]);
        this.animations.push(new RotationAnimation(orbitTransform, Math.PI / 4));
        const orbitTransformNode = new SceneGraphTransformNode(orbitTransform, [orbit]);

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

        /*const pointLightVolumeTransform = mat4.create();

        mat4.fromRotationTranslationScale(pointLightVolumeTransform, quat.create(), [-0.0, 3.5, 1.0], [5.5, 5.5, 5.5]);

        const pointLightVolumeNode = new SceneGraphLightNode(<PointLightVolume> {
            color: vec3.fromValues(1.0, 0.8, 0.2),
            intensity: 0.0,
            ambientIntensity: 0.0,
            mesh: MeshLoader.loadSphere(gl, 10, 10),
            localTransform: pointLightVolumeTransform,
            textures: this.lightPassTextures,
            shaderProgram: this.pointLightShader
        });*/

        const rootTransform = mat4.create();
        const rootTransformNode = new SceneGraphTransformNode(rootTransform, [room, tree, orbitTransformNode, directionalLightVolumeNode]);

        const mainCamera = new Camera();
        mainCamera.setLookAt(vec3.fromValues(0.0, 2.5, 8.0), vec3.fromValues(0.0, 1.5, -4.0), vec3.fromValues(0.0, 1.0, 0.0));
        const cameraNodeMain = new SceneGraphCameraNode(mainCamera, [rootTransformNode]);

        const gBufferPass = new SceneGraphGPassNode(this.gBuffer, [cameraNodeMain]);
        const lightPass = new SceneGraphLightPassNode([cameraNodeMain]);
        const overlayPass = this.createOverlayNode(gl, gBufferPass.gBuffer);


        this.rootNode = new SceneGraphNode([lightPass, gBufferPass, overlayPass]);
    }

    update(elapsedMs: number): void {
        super.update(elapsedMs);
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

        const starNode = this.makeStar(gl);
        const starTransform = mat4.create();
        const starRot = quat.create();
        quat.fromEuler(starRot, 0.0, 22.5, 0.0);
        mat4.fromRotationTranslation(starTransform, starRot, [0.0, treeHeight + stumpHeight + 0.04, 0.0]);

        return new SceneGraphNode([stumpNode, treeNode, treeNode2, new SceneGraphTransformNode(starTransform, [starNode])]);
    }

    private makeStar(gl: WebGL2RenderingContext) {
        const goldPyramid = MeshLoader.loadCube(gl, 0.5, vec3.fromValues(.81, .71, .23), true);

        const pointHeight = 0.17;
        const baseWidth = 0.06;

        const bottomTransform = mat4.create();
        const bottomRot = quat.create();
        quat.fromEuler(bottomRot, 180.0, 0.0, 0.0);
        mat4.fromRotationTranslationScale(bottomTransform, bottomRot, [0.0, -pointHeight / 2.0, 0.0], [baseWidth, pointHeight, baseWidth]);

        const topTransform = mat4.create();
        mat4.fromRotationTranslationScale(topTransform, quat.create(), [0.0, 0.5 * pointHeight + baseWidth, 0.0], [baseWidth, pointHeight, baseWidth]);

        const leftTransform = mat4.create();
        const leftRot = quat.create();
        quat.fromEuler(leftRot, 0.0, 0.0, 90.0);
        mat4.fromRotationTranslationScale(leftTransform, leftRot, [-(baseWidth + pointHeight) / 2.0, baseWidth / 2.0, 0.0], [baseWidth, pointHeight, baseWidth]);

        const rightTransform = mat4.create();
        const rightRot = quat.create();
        quat.fromEuler(rightRot, 0.0, 0.0, -90.0);
        mat4.fromRotationTranslationScale(rightTransform, rightRot, [(baseWidth + pointHeight) / 2.0, baseWidth / 2.0, 0.0], [baseWidth, pointHeight, baseWidth]);

        const backTransform = mat4.create();
        const backRot = quat.create();
        quat.fromEuler(backRot, -90.0, 0.0, 0.0);
        mat4.fromRotationTranslationScale(backTransform, backRot, [0.0, baseWidth / 2.0, -(baseWidth + pointHeight) / 2.0], [baseWidth, pointHeight, baseWidth]);

        const frontTransform = mat4.create();
        const frontRot = quat.create();
        quat.fromEuler(frontRot, 90.0, 0.0, 0.0);
        mat4.fromRotationTranslationScale(frontTransform, frontRot, [0.0, baseWidth / 2.0, (baseWidth + pointHeight) / 2.0], [baseWidth, pointHeight, baseWidth]);

        const bottomNode = new SceneGraphMeshNode(this.makeCubeRenderable(bottomTransform, goldPyramid));
        const topNode = new SceneGraphMeshNode(this.makeCubeRenderable(topTransform, goldPyramid));
        const leftNode = new SceneGraphMeshNode(this.makeCubeRenderable(leftTransform, goldPyramid));
        const rightNode = new SceneGraphMeshNode(this.makeCubeRenderable(rightTransform, goldPyramid));
        const backNode = new SceneGraphMeshNode(this.makeCubeRenderable(backTransform, goldPyramid));
        const frontNode = new SceneGraphMeshNode(this.makeCubeRenderable(frontTransform, goldPyramid));

        const pointLight = this.makePointLight(gl, 0.3, vec3.fromValues(1.0, 1.0, 1.0), 1.0);
        const orbit = this.makeOrbit(0.15, [pointLight, pointLight, pointLight]);
        const orbitTransform = mat4.create();
        mat4.translate(orbitTransform, orbitTransform, [0.0, 0.1, 0.0]);
        this.animations.push(new RotationAnimation(orbitTransform, Math.PI / 2));
        const orbitTransformNode = new SceneGraphTransformNode(orbitTransform, [orbit]);

        return new SceneGraphNode([bottomNode, topNode, leftNode, rightNode, backNode, frontNode, orbitTransformNode]);
    }

    private makePointLight(gl: WebGL2RenderingContext, radius: number, color: vec3, intensity: number): SceneGraphNode {
        const emitterRadiusScale = 0.05;
        const pointLightTransform = mat4.create();
        mat4.fromScaling(pointLightTransform, [radius, radius, radius]);

        const pointLightVolumeNode = new SceneGraphLightNode(<PointLightVolume> {
            color: color,
            intensity: intensity,
            ambientIntensity: 0.0,
            mesh: this.pointLightSphere as Mesh,
            localTransform: mat4.create(),
            textures: this.lightPassTextures,
            shaderProgram: this.pointLightShader
        });

        const emitterTransform = mat4.create();
        mat4.fromScaling(emitterTransform, [emitterRadiusScale, emitterRadiusScale, emitterRadiusScale]);

        const emitterSphere = {
            mesh: MeshLoader.loadSphere(gl, 10, 10, color),
            localTransform: emitterTransform,
            textures: [],
            shaderProgram: this.gPassShader as ShaderProgram
        }

        return new SceneGraphTransformNode(pointLightTransform, [pointLightVolumeNode, new SceneGraphMeshNode(emitterSphere)]);
    }

    private makeOrbit(radius: number, nodes: SceneGraphNode[]): SceneGraphNode {
        const angleIncrement = 2 * Math.PI / nodes.length;
        const transformNodes = [];

        let angle = 0;

        for (let i = 0; i < nodes.length; ++i) {
            angle = i * angleIncrement;

            const transform = mat4.create();
            mat4.fromTranslation(transform, [Math.cos(angle) * radius, 0.0, Math.sin(angle) * radius]);
            transformNodes.push(new SceneGraphTransformNode(transform, [nodes[i]]));
        }

        return new SceneGraphNode(transformNodes);
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