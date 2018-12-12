import { mat4, quat, vec3 } from "gl-matrix";
import Camera from "../camera/Camera";
import Scene from "./Scene";
import SceneGraphNode from "../scenegraph/SceneGraphNode";
import SceneGraphCameraNode from "../scenegraph/SceneGraphCameraNode";
import MeshLoader from "../mesh/MeshLoader";
import SceneGraphShaderProgramNode from "../scenegraph/SceneGraphShaderProgramNode";
import SceneGraphMeshNode from "../scenegraph/SceneGraphMeshNode";
import SceneGraphLightNode from "../scenegraph/SceneGraphLightNode";
import Shaders from "../shaders/Shaders";
import SceneGraphLightPassNode from "../scenegraph/SceneGraphLightPassNode";
import DirectionalLightVolume from "../lighting/DirectionalLightVolume";
import PointLightVolume from "../lighting/PointLightVolume";

export default class BasicScene extends Scene {

    private cubeWorldTransform: mat4 = mat4.create();
    private pointLight2Transform: mat4 = mat4.create();
    private rootNode: SceneGraphNode = new SceneGraphNode([]);

    get graphRoot() : SceneGraphNode {
        return this.rootNode;
    }

    initialize(gl: WebGL2RenderingContext): void {
        mat4.translate(this.cubeWorldTransform, this.cubeWorldTransform, [0.0, 0.0, -10.0]);

        const cubeNode = new SceneGraphMeshNode({
            mesh: MeshLoader.loadCube(gl, 0.5),
            localTransform: this.cubeWorldTransform,
            textures: [] });

        const sphereTransform = mat4.create();
        mat4.translate(sphereTransform, sphereTransform, [1.75, 0.0, -10.5]);

        const sphereNode = new SceneGraphMeshNode({
            mesh: MeshLoader.loadSphere(gl, 20, 20),
            localTransform: sphereTransform,
            textures: [] });

        const cubeGShaderNode = new SceneGraphShaderProgramNode(Shaders.makeGBufferShader(gl), [sphereNode, cubeNode]);
        const gPassNode = this.createGBufferNode(gl, [cubeGShaderNode]);
        const lightPassTextures = [gPassNode.gBufferTextures.positionTexture, gPassNode.gBufferTextures.normalTexture, gPassNode.gBufferTextures.diffuseTexture];

        const directionalLightVolumeTransform = mat4.create();
        mat4.fromRotationTranslationScale(directionalLightVolumeTransform, quat.create(), [0.0, 0.0, -50.2], [100.0, 100.0, 100.0]);

        const directionalLightVolumeNode = new SceneGraphLightNode(<DirectionalLightVolume> {
            color: vec3.fromValues(1.0, 1.0, 1.0),
            direction: vec3.fromValues(1.0, 0.0, -1.0),
            intensity: 0.2,
            ambientIntensity: 0.0,
            mesh: MeshLoader.loadCube(gl, 0.5),
            localTransform: directionalLightVolumeTransform,
            textures: lightPassTextures
        });

        const pointLightVolumeTransform = mat4.create();
        mat4.fromTranslation(pointLightVolumeTransform, [-0.5, 0.0, -9.0]);

        const pointLightVolumeNode = new SceneGraphLightNode(<PointLightVolume> {
            color: vec3.fromValues(1.0, 0.0, 0.0),
            intensity: 1.0,
            ambientIntensity: 0.0,
            mesh: MeshLoader.loadSphere(gl, 10, 10),
            localTransform: pointLightVolumeTransform,
            textures: lightPassTextures
        });

        mat4.fromRotationTranslationScale(this.pointLight2Transform, quat.create(), [1.5, 0.0, -9.0], [1.0, 3.0, 2.0]);

        const pointLightVolumeNode2 = new SceneGraphLightNode(<PointLightVolume> {
            color: vec3.fromValues(1.0, 0.0, 1.0),
            intensity: 1.0,
            ambientIntensity: 0.0,
            mesh: MeshLoader.loadSphere(gl, 10, 10),
            localTransform: this.pointLight2Transform,
            textures: lightPassTextures
        });

        const lightPassDirectionalShaderNode = new SceneGraphShaderProgramNode(Shaders.makeDirectionalLightVolumeShader(gl), [directionalLightVolumeNode]);
        const lightPassPointShaderNode = new SceneGraphShaderProgramNode(Shaders.makePointLightVolumeShader(gl), [pointLightVolumeNode, pointLightVolumeNode2]);
        const lightPassNode = new SceneGraphLightPassNode([lightPassDirectionalShaderNode, lightPassPointShaderNode]);

        const cameraNodeMain = new SceneGraphCameraNode(new Camera(), [gPassNode, lightPassNode]);

        const overlayNode = this.createOverlayNode(gl, gPassNode.gBufferTextures);
        this.rootNode = new SceneGraphNode([cameraNodeMain, overlayNode]);
    }

    update(elapsedMs: number): void {
        mat4.rotateX(this.cubeWorldTransform, this.cubeWorldTransform, (Math.PI / 7000) * elapsedMs);
        mat4.rotateY(this.cubeWorldTransform, this.cubeWorldTransform, (Math.PI / 3000) * elapsedMs);
        mat4.rotateZ(this.cubeWorldTransform, this.cubeWorldTransform, (Math.PI / 13000) * elapsedMs);

        const rotation = mat4.create();
        mat4.fromRotation(rotation, (Math.PI / 7000) * elapsedMs, [0.0, 0.0, 1.0]);

        mat4.mul(this.pointLight2Transform,  rotation, this.pointLight2Transform);
    }
}