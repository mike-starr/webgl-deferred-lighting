import * as React from "react";
import Renderer from "../renderer/Renderer";
import Scene from "../content/Scene";
import BasicScene from "../content/BasicScene";
import HolidayScene from "../content/HolidayScene";
import BigBangScene from "../content/BigBangScene";

export default class SceneComponent extends React.Component<{}, {}> {
    private readonly canvasElementId = "webgl-canvas";

    private frameId: number = 0;
    private renderer: Renderer | null = null;
    private scene: Scene = new HolidayScene();
    //private scene: Scene = new BasicScene();
    //private scene: Scene = new BigBangScene();
    private lastFrameTime: DOMHighResTimeStamp = 0;

    constructor(props: any) {
        super(props);
    }

    componentDidMount() {
        const canvas = this.refs[this.canvasElementId] as HTMLCanvasElement;
        const gl = canvas.getContext('webgl2');

        if (!gl) {
            throw new Error("Failed to initialize webgl context.");
        }

        this.renderer = new Renderer(gl);
        this.scene.initialize(gl);
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

        this.scene.update(frameTime);
        this.renderScene();
        this.frameId = requestAnimationFrame((time) => this.onAnimationFrame(time));
    }

    renderScene() {
        (this.renderer as Renderer).render(this.scene.graphRoot);
    }

    render() {
        return <canvas ref={this.canvasElementId} width={1280} height={720} />;
    }
}