import * as React from "react";
import Renderer from "../renderer/Renderer";

export default class Scene extends React.Component<{}, {}> {
    private readonly canvasElementId = "webgl-canvas";

    private frameId: number = 0;
    private renderer: Renderer | null = null;

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
        (this.renderer as Renderer).render();
    }

    render() {
        return <canvas ref={this.canvasElementId} width={800} height={600} />;
    }
}