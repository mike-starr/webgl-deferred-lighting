import * as React from "react";
import { mat4 } from "gl-matrix";
import Camera from "../engine/Camera";
import Renderer from "../renderer/Renderer";
import SceneGraphTransformNode from "../scenegraph/SceneGraphTransformNode";
import SceneGraphNode from "../scenegraph/SceneGraphNode";
import SceneGraphCameraNode from "../scenegraph/SceneGraphCameraNode";

export default class Scene extends React.Component<{}, {}> {
    private readonly canvasElementId = "webgl-canvas";

    private frameId: number = 0;
    private renderer: Renderer | null = null;
    private sceneGraphRoot: SceneGraphNode;

    constructor(props: any) {
        super(props);
        this.loadResources();
        this.sceneGraphRoot = this.createScene();
    }

    componentDidMount() {
        this.renderer = new Renderer(this.refs[this.canvasElementId] as HTMLCanvasElement);
        this.start();
    }

    componentWillUnmount() {
        this.stop();
    }

    start() {
        this.frameId = window.requestAnimationFrame(() => this.onAnimationFrame());
    }

    stop() {
        if (this.frameId !== 0) {
            window.cancelAnimationFrame(this.frameId);
        }
    }

    onAnimationFrame() {
        this.renderScene();
        this.frameId = requestAnimationFrame(() => this.onAnimationFrame());
    }

    renderScene() {
        (this.renderer as Renderer).render(this.sceneGraphRoot);
    }

    render() {
        return <canvas ref={this.canvasElementId} width={800} height={600} />;
    }

    private createScene(): SceneGraphNode {
        const cameraNode = new SceneGraphCameraNode(new Camera());
        return new SceneGraphTransformNode(mat4.create(), [cameraNode]);

        // load shaders
    }

    private loadResources() {

    }
}