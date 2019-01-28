import Scene from "./Scene";
import SceneGraphNode from "../scenegraph/SceneGraphNode";
import SceneGraphCameraNode from "../scenegraph/SceneGraphCameraNode";
import MeshLoader from "../mesh/MeshLoader";
import { mat4, vec3, quat } from "gl-matrix";
import Camera from "../camera/Camera";
import SceneGraphTransformNode from "../scenegraph/SceneGraphTransformNode";
import SceneGraphMeshNode from "../scenegraph/SceneGraphMeshNode";
import Shaders from "../shaders/Shaders";
import ShaderProgram from "../shaders/ShaderProgram";
import SceneGraphLightNode from "../scenegraph/SceneGraphLightNode";
import DirectionalLightVolume from "../lighting/DirectionalLightVolume";
import Mesh from "../Mesh/Mesh";
import RotationAnimation from "./RotationAnimation";
import MaterialBuilder from "../material/MaterialBuilder";
import Material from "../material/Material";
import Renderable from "../renderer/Renderable";
import LightIntensityAnimation from "./LightIntensityAnimation";
import RenderQueue from "../renderer/RenderQueue";
import TextureConstant from "../renderer/TextureConstant";
import CameraController from "../camera/CameraController";

export default class HolidayScene extends Scene {

    private rootNode: SceneGraphNode = new SceneGraphNode([]);

    private gPassShader: ShaderProgram | null = null;
    private directionalLightShader: ShaderProgram | null = null;
    private pointLightShader: ShaderProgram | null = null;
    private lightPassTextures: WebGLTexture[] = [];
    private pointLightSphere: Mesh | null = null;
    private lightColors: vec3[] = [];

    get graphRoot(): SceneGraphNode {
        return this.rootNode;
    }

    initialize(gl: WebGL2RenderingContext): void {
        this.gPassShader = Shaders.makeGBufferShader(gl);
        this.directionalLightShader = Shaders.makeDirectionalLightVolumeShader(gl);
        this.pointLightShader = Shaders.makePointLightVolumeShader(gl);
        this.pointLightSphere = MeshLoader.loadSphere(gl, 10, 10, 1.04);
        this.lightPassTextures = [
            TextureConstant.GBufferPositionTarget,
            TextureConstant.GBufferNormalTarget,
            TextureConstant.GBufferDiffuseTarget
        ];

        this.initLightColors();

        const room = this.makeRoom(gl);

        const treeTransform = mat4.create();
        mat4.translate(treeTransform, treeTransform, [2.8, 0.0, -1.7]);
        const tree = new SceneGraphTransformNode(treeTransform, [this.makeTree(gl)]);

        const directionalLightVolumeTransform = mat4.create();
        mat4.fromRotationTranslationScale(directionalLightVolumeTransform, quat.create(), [0.0, 0.0, 0.0], [100.0, 100.0, 7.0]);

        const directionalLightVolumeNode = new SceneGraphLightNode(<DirectionalLightVolume> {
            color: vec3.fromValues(1.0, 1.0, 0.8),
            direction: vec3.fromValues(0.4, -0.5, -1.0),
            intensity: 0.15,
            mesh: MeshLoader.loadCube(gl, 0.5),
            localTransform: directionalLightVolumeTransform,
            textures: this.lightPassTextures,
            shaderProgram: this.directionalLightShader,
            renderQueue: RenderQueue.Lighting
        });

        const rootTransform = mat4.create();
        const rootTransformNode = new SceneGraphTransformNode(rootTransform, [room, tree, directionalLightVolumeNode]);

        const mainCamera = new Camera();
        mainCamera.setLookAt(vec3.fromValues(-0.6, 1.5, 2.2), vec3.fromValues(3.5, 0.8, -4.0), vec3.fromValues(0.0, 1.0, 0.0));
        const cameraNodeMain = new SceneGraphCameraNode(mainCamera, [rootTransformNode]);

        const overlayNode = this.createOverlayNode(gl);

        this.rootNode = new SceneGraphNode([cameraNodeMain, overlayNode]);

        const cameraController = new CameraController(mainCamera, gl.canvas, vec3.fromValues(-0.6, 1.5, 2.2));
    }

    update(elapsedMs: number): void {
        super.update(elapsedMs);
    }

    private makeRoom(gl: WebGL2RenderingContext): SceneGraphNode {
        const cubeMesh = MeshLoader.loadCube(gl, 0.5);

        const width = 7.0;
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
        const cube = MeshLoader.loadCube(gl, 0.5);
        const pyramid = MeshLoader.loadPyramid(gl, 0.5);
        const brownMaterial = new MaterialBuilder().withDiffuseColor(vec3.fromValues(.4, .26, .13)).build();
        const greenMaterial = new MaterialBuilder().withDiffuseColor(vec3.fromValues(0.3, 0.5, 0.3)).build();

        const stumpWidth = 0.3;
        const stumpHeight = 0.4;

        const stumpTransform = mat4.create();
        mat4.fromRotationTranslationScale(stumpTransform, quat.create(), [0.0, stumpHeight / 2.0, 0.0], [stumpWidth, stumpHeight, stumpWidth]);
        const stumpNode = new SceneGraphMeshNode(this.makeCubeRenderable(stumpTransform, cube, brownMaterial));

        const treeHeight = 2.2;
        const treeWidth = 1.1;

        const treeTransform = mat4.create();
        mat4.fromRotationTranslationScale(treeTransform, quat.create(), [0.0, (treeHeight / 2.0) + stumpHeight, 0.0], [treeWidth, treeHeight, treeWidth]);
        const treeNode = new SceneGraphMeshNode(this.makeCubeRenderable(treeTransform, pyramid, greenMaterial));

        const treeTransform2 = mat4.create();
        const treeRot = quat.create();
        quat.fromEuler(treeRot, 0.0, 45.0, 0.0);
        mat4.fromRotationTranslationScale(treeTransform2, treeRot, [0.0, (treeHeight / 2.0) + stumpHeight, 0.0], [treeWidth, treeHeight, treeWidth]);
        const treeNode2 = new SceneGraphMeshNode(this.makeCubeRenderable(treeTransform2, pyramid, greenMaterial));

        const starNode = this.makeStar(gl);
        const starTransform = mat4.create();
        const starRot = quat.create();
        quat.fromEuler(starRot, 0.0, 0.0, 0.0);
        mat4.fromRotationTranslation(starTransform, starRot, [0.0, treeHeight + stumpHeight + 0.04, 0.0]);

        const lightTransform = mat4.create();
        mat4.fromTranslation(lightTransform, [0.0, (treeHeight / 2.0) + stumpHeight, 0.0]);
        const treeLights = new SceneGraphTransformNode(lightTransform, [this.makeTreeLights(gl, treeHeight, treeWidth)]);

        const present1 = this.makePresent(gl, vec3.fromValues(0.3, 0.3, 0.9), vec3.fromValues(0.8, 0.1, 0.1), 0.8, .3, .4);
        const presentTransform1 = mat4.create();
        const presentRotation1 = quat.create();
        quat.fromEuler(presentRotation1, 0.0, 110.0, 0.0);
        mat4.fromRotationTranslation(presentTransform1, presentRotation1, [-0.7, 0.15, 0.0]);
        const presentNode1 = new SceneGraphTransformNode(presentTransform1, [present1]);

        const present2 = this.makePresent(gl, vec3.fromValues(0.2, 0.6, 0.2), vec3.fromValues(0.75, 0.75, 0.75), .4, .3, .4);
        const presentTransform2 = mat4.create();
        const presentRotation2 = quat.create();
        mat4.fromRotationTranslation(presentTransform2, presentRotation2, [0.3, 0.15, 0.5]);
        const presentNode2 = new SceneGraphTransformNode(presentTransform2, [present2]);

        const present3 = this.makePresent(gl, vec3.fromValues(1.0, 1.0, 1.0), vec3.fromValues(0.8, 0.0, 0.8), .3, .2, .3);
        const presentTransform3 = mat4.create();
        const presentRotation3 = quat.create();
        mat4.fromRotationTranslation(presentTransform3, presentRotation3, [-0.2, 0.1, 0.5]);
        const presentNode3 = new SceneGraphTransformNode(presentTransform3, [present3]);

        return new SceneGraphNode([treeLights, stumpNode, treeNode, treeNode2, presentNode1, presentNode2, presentNode3, new SceneGraphTransformNode(starTransform, [starNode])]);
    }

    private makeTreeLights(gl: WebGL2RenderingContext, treeHeight: number, treeWidth: number) {
        const lightNodes = [];

        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4.0) {
            const transform = mat4.create();
            mat4.rotateY(transform, transform, angle);
            lightNodes.push(new SceneGraphTransformNode(transform,
                [this.makeTreeLightsForOneSide(gl, treeHeight, treeWidth)]))
        }

        return new SceneGraphNode(lightNodes);
    }

    private makeTreeLightsForOneSide(gl: WebGL2RenderingContext, treeHeight: number, treeWidth: number) {
        const lightNodes = [];
        const lightSpacing = 0.21;
        const jitterMax = 0.09;
        const deadRadiusPct = 0.3;

        for (let x = -treeWidth / 2.0; x < treeWidth / 2.0; x += lightSpacing) {
            for (let y = -treeHeight / 2.0; y < treeHeight / 2.0; y += lightSpacing) {
                const pctToTop = ((y + treeHeight / 2.0) / treeHeight);
                const maxWidth = (treeWidth / 2.0) * (1 - pctToTop);
                const minWidth = maxWidth * deadRadiusPct;
                const zOffset = pctToTop * (treeWidth / 2.0);

                if (Math.abs(x) > maxWidth || Math.abs(x) < minWidth)  {
                    continue;
                }

                x += (Math.max(0.0, (0.5 - pctToTop)) * (Math.random() * jitterMax - (jitterMax / 2)));
                y += Math.random() * jitterMax - (jitterMax / 2);

                y = Math.max(y, -treeHeight / 2.0);

                const transform = mat4.create();
                const rotation = quat.create();
                quat.fromEuler(rotation, 0.0, Math.random() * 180, Math.random() * 180);
                mat4.fromRotationTranslationScale(transform, rotation, [x, y, treeWidth / 2.0 + 0.06 - zOffset], [1.6, 1.0, 1.0]);

                const color = this.lightColors[Math.floor(Math.random() * this.lightColors.length)];

                let radius = 0.3;
                if (y <= -treeHeight / 2.0 + jitterMax) {
                    radius = 0.4;
                }

                const light = this.makePointLight(gl, radius, color, 0.9, true);
                lightNodes.push(new SceneGraphTransformNode(transform, [light]));
            }
        }

        return new SceneGraphNode(lightNodes);
    }

    private makeStar(gl: WebGL2RenderingContext) {
        const goldMaterial = new MaterialBuilder()
            .withDiffuseColor(vec3.fromValues(.81, .71, .23))
            .withSpecularIntensity(1.0)
            .withSpecularPower(10)
            .build();
        const goldPyramid = MeshLoader.loadPyramid(gl, 0.5);
        const goldCube = MeshLoader.loadCube(gl, 0.5);

        const pointHeight = 0.17;
        const baseWidth = 0.06;

        const bottomTransform = mat4.create();
        const bottomRot = quat.create();
        quat.fromEuler(bottomRot, 180.0, 0.0, 0.0);
        mat4.fromRotationTranslationScale(bottomTransform, bottomRot, [0.0, -(pointHeight + baseWidth) / 2.0, 0.0], [baseWidth, pointHeight, baseWidth]);

        const topTransform = mat4.create();
        mat4.fromRotationTranslationScale(topTransform, quat.create(), [0.0, (pointHeight + baseWidth) / 2.0, 0.0], [baseWidth, pointHeight, baseWidth]);

        const leftTransform = mat4.create();
        const leftRot = quat.create();
        quat.fromEuler(leftRot, 0.0, 0.0, 90.0);
        mat4.fromRotationTranslationScale(leftTransform, leftRot, [-(baseWidth + pointHeight) / 2.0, 0.0, 0.0], [baseWidth, pointHeight, baseWidth]);

        const rightTransform = mat4.create();
        const rightRot = quat.create();
        quat.fromEuler(rightRot, 0.0, 0.0, -90.0);
        mat4.fromRotationTranslationScale(rightTransform, rightRot, [(baseWidth + pointHeight) / 2.0, 0.0, 0.0], [baseWidth, pointHeight, baseWidth]);

        const backTransform = mat4.create();
        const backRot = quat.create();
        quat.fromEuler(backRot, -90.0, 0.0, 0.0);
        mat4.fromRotationTranslationScale(backTransform, backRot, [0.0, 0.0, -(baseWidth + pointHeight) / 2.0], [baseWidth, pointHeight, baseWidth]);

        const frontTransform = mat4.create();
        const frontRot = quat.create();
        quat.fromEuler(frontRot, 90.0, 0.0, 0.0);
        mat4.fromRotationTranslationScale(frontTransform, frontRot, [0.0, 0.0, (baseWidth + pointHeight) / 2.0], [baseWidth, pointHeight, baseWidth]);

        const centerTransform = mat4.create();
        mat4.fromScaling(centerTransform, [baseWidth, baseWidth, baseWidth]);

        const bottomNode = new SceneGraphMeshNode(this.makeCubeRenderable(bottomTransform, goldPyramid, goldMaterial));
        const topNode = new SceneGraphMeshNode(this.makeCubeRenderable(topTransform, goldPyramid, goldMaterial));
        const leftNode = new SceneGraphMeshNode(this.makeCubeRenderable(leftTransform, goldPyramid, goldMaterial));
        const rightNode = new SceneGraphMeshNode(this.makeCubeRenderable(rightTransform, goldPyramid, goldMaterial));
        const backNode = new SceneGraphMeshNode(this.makeCubeRenderable(backTransform, goldPyramid, goldMaterial));
        const frontNode = new SceneGraphMeshNode(this.makeCubeRenderable(frontTransform, goldPyramid, goldMaterial));
        const centerNode = new SceneGraphMeshNode(this.makeCubeRenderable(centerTransform, goldCube, goldMaterial));

        const pointLight = this.makePointLight(gl, 0.3, vec3.fromValues(1.0, 1.0, 1.0), 1.0);

        const orbit = this.makeOrbit(pointHeight + .1, [pointLight, pointLight, pointLight, pointLight]);
        const orbitTransform = mat4.create();
        this.animations.push(new RotationAnimation(orbitTransform, .5 * Math.PI ));

        const orbit2 = this.makeOrbit(0.1, [pointLight, pointLight, pointLight]);
        const orbitTransform2 = mat4.create();
        mat4.translate(orbitTransform2, orbitTransform2, [0.0, pointHeight, 0.0]);
        this.animations.push(new RotationAnimation(orbitTransform2, .8 * Math.PI));

        const orbitTransform3 = mat4.create();
        mat4.translate(orbitTransform3, orbitTransform3, [0.0, -pointHeight / 1.5, 0.0]);
        this.animations.push(new RotationAnimation(orbitTransform3, .8 * Math.PI));

        const orbitTransformNode = new SceneGraphTransformNode(orbitTransform, [orbit]);
        const orbitTransformNode2 = new SceneGraphTransformNode(orbitTransform2, [orbit2]);
        const orbitTransformNode3 = new SceneGraphTransformNode(orbitTransform3, [orbit2]);

        return new SceneGraphNode([bottomNode, topNode, leftNode, frontNode, backNode, rightNode, centerNode, orbitTransformNode, orbitTransformNode2, orbitTransformNode3]);
    }

    private makePointLight(gl: WebGL2RenderingContext, radius: number, color: vec3, intensity: number, animateIntensity: boolean = false, createSource = true): SceneGraphNode {
        const emitterRadiusScale = 0.05;
        const pointLightTransform = mat4.create();
        mat4.fromScaling(pointLightTransform, [radius, radius, radius]);

        const pointLightVolume = {
            color: color,
            intensity: intensity,
            mesh: this.pointLightSphere as Mesh,
            localTransform: mat4.create(),
            textures: this.lightPassTextures,
            shaderProgram: this.pointLightShader as ShaderProgram,
            material: MaterialBuilder.default,
            renderQueue: RenderQueue.Lighting
        };

        if (animateIntensity) {
            this.animations.push(new LightIntensityAnimation(pointLightVolume, 1.0));
        }

        const pointLightVolumeNode = new SceneGraphLightNode(pointLightVolume);

        const emitterTransform = mat4.create();
        mat4.fromScaling(emitterTransform, [emitterRadiusScale, emitterRadiusScale, emitterRadiusScale]);

        const sphereMaterial = new MaterialBuilder()
            .withDiffuseColor(vec3.fromValues(0.0, 0.0, 0.0))
            .withEmissiveColor(color)
            .build();
        const emitterSphere = {
            mesh: this.pointLightSphere as Mesh,
            localTransform: emitterTransform,
            textures: [],
            material: sphereMaterial,
            shaderProgram: this.gPassShader as ShaderProgram,
            renderQueue: RenderQueue.Opaque
        }

        const children: SceneGraphNode[] = [pointLightVolumeNode];

        if (createSource) {
            children.push(new SceneGraphMeshNode(emitterSphere));
        }

        return new SceneGraphTransformNode(pointLightTransform, children);
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

    private makePresent(gl: WebGL2RenderingContext, boxColor: vec3, ribbonColor: vec3, width: number, height: number, depth: number): SceneGraphNode {
        const ribbonWidth = depth / 3;

        const boxMaterial = new MaterialBuilder().withDiffuseColor(boxColor).build();
        const ribbonMaterial = new MaterialBuilder()
            .withDiffuseColor(ribbonColor)
            .withSpecularIntensity(0.8)
            .withSpecularPower(16.0)
            .build();

        const cube = MeshLoader.loadCube(gl, 0.5);

        const boxTransform = mat4.create();
        mat4.fromScaling(boxTransform, [width, height, depth]);
        const box = new SceneGraphMeshNode(this.makeCubeRenderable(boxTransform, cube, boxMaterial));

        const widthRibbonTransform1 = mat4.create();
        mat4.fromScaling(widthRibbonTransform1, [width + .01, height + .01, ribbonWidth]);
        const ribbon1 = new SceneGraphMeshNode(this.makeCubeRenderable(widthRibbonTransform1, cube, ribbonMaterial));

        const depthRibbonTransform2 = mat4.create();
        mat4.fromScaling(depthRibbonTransform2, [ribbonWidth, height + .01, depth + .01]);
        const ribbon2 = new SceneGraphMeshNode(this.makeCubeRenderable(depthRibbonTransform2, cube, ribbonMaterial));

        return new SceneGraphNode([box, ribbon1, ribbon2]);
    }

    private makeCubeRenderable(transform: mat4, mesh: Mesh, material: Material = MaterialBuilder.default): Renderable {
        return {
            mesh: mesh,
            localTransform: transform,
            textures: [],
            material: material,
            shaderProgram: this.gPassShader as ShaderProgram,
            renderQueue: RenderQueue.Opaque
        };
    }

    private initLightColors() {
        this.lightColors.push(vec3.fromValues(1.0, 0.1, 0.1));
        this.lightColors.push(vec3.fromValues(0.1, 0.6, 0.1));
        this.lightColors.push(vec3.fromValues(0.2, 0.2, 1.0));
        this.lightColors.push(vec3.fromValues(1.0, 0.5, 0.0));
        this.lightColors.push(vec3.fromValues(0.6, 0.6, 0.6));
    }
}