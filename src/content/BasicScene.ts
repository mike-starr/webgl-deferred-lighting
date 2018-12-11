import { mat4, quat, vec3 } from "gl-matrix";
import Camera from "../camera/Camera";
import Scene from "./Scene";
import SceneGraphTransformNode from "../scenegraph/SceneGraphTransformNode";
import SceneGraphNode from "../scenegraph/SceneGraphNode";
import SceneGraphCameraNode from "../scenegraph/SceneGraphCameraNode";
import MeshLoader from "../mesh/MeshLoader";
import SceneGraphShaderProgramNode from "../scenegraph/SceneGraphShaderProgramNode";
import SceneGraphRenderableNode from "../scenegraph/SceneGraphRenderableNode";
import Shaders from "../shaders/Shaders";
import SceneGraphLightPassNode from "../scenegraph/SceneGraphLightPassNode";
import LightVolumeLoader from "../lighting/LightVolumeLoader";

export default class BasicScene extends Scene {

    private cubeWorldTransform: mat4 = mat4.create();
    private rootNode: SceneGraphNode = new SceneGraphNode([]);


    get graphRoot() : SceneGraphNode {
        return this.rootNode;
    }

    initialize(gl: WebGL2RenderingContext): void {
        const cubeNode = new SceneGraphRenderableNode({ mesh: MeshLoader.loadCube(gl, 0.5), textures: [] });
        const cubeNode2 = new SceneGraphRenderableNode({ mesh: MeshLoader.loadSphere(gl, 20, 20), textures: [] });

        mat4.translate(this.cubeWorldTransform, this.cubeWorldTransform, [0.0, 0.0, -10.0]);
        const cubeTransformNode = new SceneGraphTransformNode(this.cubeWorldTransform, [cubeNode]);

        const cube2Transform = mat4.create();
        mat4.translate(cube2Transform, cube2Transform, [2.0, 2.0, -10.0]);
        const cube2TransformNode = new SceneGraphTransformNode(cube2Transform, [cubeNode2]);

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

        const pointLightVolume2 = LightVolumeLoader.createPoint(gl, vec3.fromValues(1.0, 0.0, 1.0), 1.0, 0.0, 1.0, gBufferNode.positionTarget, gBufferNode.normalTarget, gBufferNode.diffuseTarget);
        const pointLightVolumeNode2 = new SceneGraphRenderableNode(pointLightVolume2);
        const pointLightVolumeTransform2 = mat4.create();
        mat4.fromRotationTranslationScale(pointLightVolumeTransform2, quat.create(), [1.5, 0.0, -9.0], [1.0, 3.0, 2.0]);
        //mat4.fromTranslation(pointLightVolumeTransform2, [0.5, 0.0, -9.0]);
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

        this.rootNode = new SceneGraphNode([cameraNodeMain, cameraNode2d]);
    }

    update(elapsedMs: number): void {
        mat4.rotateX(this.cubeWorldTransform, this.cubeWorldTransform, (Math.PI / 7000) * elapsedMs);
        mat4.rotateY(this.cubeWorldTransform, this.cubeWorldTransform, (Math.PI / 3000) * elapsedMs);
        mat4.rotateZ(this.cubeWorldTransform, this.cubeWorldTransform, (Math.PI / 13000) * elapsedMs);
    }


}