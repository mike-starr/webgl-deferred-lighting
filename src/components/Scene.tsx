import * as React from "react";
import { mat4 } from "gl-matrix";
import Camera from "../engine/Camera";
import Renderer from "../renderer/Renderer";
import SceneGraphTransformNode from "../scenegraph/SceneGraphTransformNode";
import SceneGraphNode from "../scenegraph/SceneGraphNode";
import SceneGraphCameraNode from "../scenegraph/SceneGraphCameraNode";
import MeshLoader from "../Mesh/MeshLoader";
import SceneGraphShaderProgramNode from "../scenegraph/SceneGraphShaderProgramNode";
import ShaderMaker from "../engine/ShaderMaker";
import { AttributeName, UniformName } from "../engine/ShaderDescription";
import SceneGraphMeshNode from "../scenegraph/SceneGraphMeshNode";

export default class Scene extends React.Component<{}, {}> {
    private readonly canvasElementId = "webgl-canvas";

    private frameId: number = 0;
    private renderer: Renderer | null = null;
    private sceneGraphRoot: SceneGraphNode | null = null;
    private meshLoader: MeshLoader = new MeshLoader();
    private shaderMaker: ShaderMaker = new ShaderMaker();
    private cubeWorldTransform: mat4 = mat4.create();
    private lastFrameTime: DOMHighResTimeStamp = 0;

    constructor(props: any) {
        super(props);
    }

    componentDidMount() {
        const canvas = this.refs[this.canvasElementId] as HTMLCanvasElement
        const gl = canvas.getContext('webgl2');

        if (!gl) {
            throw new Error("Failed to initialize webgl context.");
        }

        this.sceneGraphRoot = this.createScene(gl);
        this.renderer = new Renderer(gl);
        this.start();
    }

    componentWillUnmount() {
        this.stop();
    }

    start() {
        this.frameId = window.requestAnimationFrame((time) => this.onAnimationFrame(time));
    }

    stop() {
        if (this.frameId !== 0) {
            window.cancelAnimationFrame(this.frameId);
        }
    }

    onAnimationFrame(time: DOMHighResTimeStamp) {
        let frameTime = (1 / 60) * 1000;

        if (this.lastFrameTime > 0) {
            frameTime = time - this.lastFrameTime;
        }

        this.lastFrameTime = time;

        mat4.rotateX(this.cubeWorldTransform, this.cubeWorldTransform, (Math.PI / 7000) * frameTime);
        mat4.rotateY(this.cubeWorldTransform, this.cubeWorldTransform, (Math.PI / 3000) * frameTime);
        mat4.rotateZ(this.cubeWorldTransform, this.cubeWorldTransform, (Math.PI / 13000) * frameTime);

        this.renderScene();
        this.frameId = requestAnimationFrame((time) => this.onAnimationFrame(time));
    }

    renderScene() {
        (this.renderer as Renderer).render(this.sceneGraphRoot as SceneGraphNode);
    }

    render() {
        return <canvas ref={this.canvasElementId} width={800} height={600} />;
    }

    private createScene(gl: WebGL2RenderingContext): SceneGraphNode {
        const meshNode = new SceneGraphMeshNode(this.meshLoader.loadCube(gl, 1.0));

        const shaderNode = new SceneGraphShaderProgramNode(this.makeDefaultShader(gl), [meshNode]);

        mat4.translate(this.cubeWorldTransform, this.cubeWorldTransform, [0.0, 0.0, -10.0]);
        const worldTransformNode = new SceneGraphTransformNode(this.cubeWorldTransform, [shaderNode]);

        const cameraNode = new SceneGraphCameraNode(new Camera(), [worldTransformNode]);

        return cameraNode;
    }

    private makeDefaultShader(gl: WebGL2RenderingContext) {
        const vsSource = `
            attribute vec4 aVertexPosition;
            attribute vec4 aVertexColor;

            uniform mat4 uWorldMatrix;
            uniform mat4 uProjectionViewMatrix;

            varying lowp vec4 vColor;

            void main() {
                gl_Position = uProjectionViewMatrix * uWorldMatrix * aVertexPosition;
                vColor = aVertexColor;
            }`;

        const fsSource = `
            varying lowp vec4 vColor;

            void main() {
                gl_FragColor = vColor;
            }`;

        const attributes = [AttributeName.VertexPosition, AttributeName.VertexColor];
        const uniforms = [UniformName.ProjectionViewMatrix, UniformName.WorldMatrix];
        return this.shaderMaker.makeShaderProgram(gl, vsSource, fsSource, attributes, uniforms);
    }
}