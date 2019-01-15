import { mat4, quat, vec3 } from "gl-matrix";
import Camera from "../camera/Camera";
import Scene from "./Scene";
import SceneGraphNode from "../scenegraph/SceneGraphNode";
import SceneGraphCameraNode from "../scenegraph/SceneGraphCameraNode";
import MeshLoader from "../mesh/MeshLoader";
import SceneGraphMeshNode from "../scenegraph/SceneGraphMeshNode";
import SceneGraphLightNode from "../scenegraph/SceneGraphLightNode";
import Shaders from "../shaders/Shaders";
import DirectionalLightVolume from "../lighting/DirectionalLightVolume";
import MaterialBuilder from "../material/MaterialBuilder";
import ShaderProgram from "../shaders/ShaderProgram";
import Mesh from "../Mesh/Mesh";
import SceneGraphTransformNode from "../scenegraph/SceneGraphTransformNode";
import Material from "../material/Material";
import Renderable from "../renderer/Renderable";
import LightIntensityAnimation from "./LightIntensityAnimation";
import BoundedTranslationAnimation from "./BoundedTranslationAnimation";
import XYScaleAnimation from "./XYScaleAnimation";
import RenderQueue from "../renderer/RenderQueue";
import TextureConstant from "../renderer/TextureConstant";

export default class NonUniformScene extends Scene {
    private gPassShader: ShaderProgram | null = null;
    private directionalLightShader: ShaderProgram | null = null;
    private pointLightShader: ShaderProgram | null = null;
    private lightPassTextures: WebGLTexture[] = [];
    private pointLightSphere: Mesh | null = null;
    private lightColors: vec3[] = [];

    private rootNode: SceneGraphNode = new SceneGraphNode([]);

    get graphRoot(): SceneGraphNode {
        return this.rootNode;
    }

    initialize(gl: WebGL2RenderingContext): void {
        this.initLightColors();

        this.gPassShader = Shaders.makeGBufferShader(gl);
        this.directionalLightShader = Shaders.makeDirectionalLightVolumeShader(gl);
        this.pointLightShader = Shaders.makePointLightVolumeShader(gl);
        this.pointLightSphere = MeshLoader.loadSphere(gl, 10, 10, 1.04);
        this.lightPassTextures = [
            TextureConstant.GBufferPositionTarget,
            TextureConstant.GBufferNormalTarget,
            TextureConstant.GBufferDiffuseTarget
        ];

        const background = this.makeRoom(gl);

        const directionalLightVolumeTransform = mat4.create();
        mat4.fromRotationTranslationScale(directionalLightVolumeTransform, quat.create(), [0.0, 0.0, 0.0], [100.0, 100.0, 50.0]);

        const directionalLightVolumeNode = new SceneGraphLightNode(<DirectionalLightVolume> {
            color: vec3.fromValues(1.0, 1.0, 1.0),
            direction: vec3.fromValues(0.0, -0.0, -1.0),
            intensity: 0.0,
            mesh: MeshLoader.loadCube(gl, 0.5),
            localTransform: directionalLightVolumeTransform,
            textures: this.lightPassTextures,
            shaderProgram: this.directionalLightShader
        });

        const pointLightTransform = mat4.create();
        mat4.fromTranslation(pointLightTransform, [0.0, 0.0, 0.0]);

        const lights = this.generateLights(gl, 100);

        const pointLightTransformNode = new SceneGraphTransformNode(pointLightTransform, [lights]);

        const rootTransform = mat4.create();
        const rootTransformNode = new SceneGraphTransformNode(rootTransform, [pointLightTransformNode, directionalLightVolumeNode, background]);

        const mainCamera = new Camera();
        mainCamera.setLookAt(vec3.fromValues(-0.7, 0.0, 3.75), vec3.fromValues(-0.7, 0.0, 0.0), vec3.fromValues(0.0, 1.0, 0.0));
        const cameraNodeMain = new SceneGraphCameraNode(mainCamera, [rootTransformNode]);

        const overlayNode = this.createOverlayNode(gl);

        this.rootNode = new SceneGraphNode([cameraNodeMain, overlayNode]);
    }

    private makeRoom(gl: WebGL2RenderingContext): SceneGraphNode {
        const cubeMesh = MeshLoader.loadCube(gl, 0.5);

        const backWallTransform = mat4.create();
        mat4.fromRotationTranslationScale(backWallTransform, quat.create(), [0.0, 0.0, -0.04], [4.0, 3.0, 0.01]);

        return new SceneGraphMeshNode(this.makeCubeRenderable(backWallTransform, cubeMesh));
    }

    private generateLights(gl: WebGL2RenderingContext, count: number): SceneGraphNode {
        const minInitialVelocity = 0.1;
        const maxInitialVelocity = 0.8;

        const lights: SceneGraphNode[] = [];

        const initialVelocity = vec3.fromValues(1.0, 0.0, 0.0);
        const velocity = vec3.create();

        for (let i = 0; i < count; ++i) {
            const scale = minInitialVelocity + Math.random() * (maxInitialVelocity - minInitialVelocity);
            const color = this.lightColors[Math.floor(Math.random() * this.lightColors.length)];

            const pointLight = this.makePointLight(gl, 0.25, color, 1.0, false, false);
            vec3.rotateZ(velocity, initialVelocity, [0.0, 0.0, 0.0], Math.random() * Math.PI * 2);
            vec3.scale(velocity, velocity, scale);

            const pointLightTranslationTransform = mat4.create();
            const pointLightScaleTransform = mat4.create();

            const scaleTransformNode = new SceneGraphTransformNode(pointLightScaleTransform, [pointLight]);

            lights.push(new SceneGraphTransformNode(pointLightTranslationTransform, [scaleTransformNode]));

            const translationAnimation = new BoundedTranslationAnimation(pointLightTranslationTransform, -2.0, 2.0, 1.5, -1.5, vec3.fromValues(0.0, 0.0, 0.0), velocity);
            const scaleAnimation = new XYScaleAnimation(pointLightScaleTransform, 1.0, 4.0, 2.0 + Math.random() * 1.0);
            this.animations.push(translationAnimation, scaleAnimation);
        }

        return new SceneGraphNode(lights);
    }

    private makePointLight(gl: WebGL2RenderingContext, radius: number, color: vec3, intensity: number, animateIntensity: boolean = false, createSource = true): SceneGraphNode {
        const emitterRadiusScale = 0.03;
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