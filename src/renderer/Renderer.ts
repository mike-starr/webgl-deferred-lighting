export default class Renderer {

    private gl: WebGL2RenderingContext | null;

    constructor(private readonly element: HTMLCanvasElement) {
        this.gl = element.getContext('webgl2');

        if (!this.gl) {
            throw new Error("Failed to initialize webgl context.");
        }
    }

    render() {
        if (!this.gl) {
            return;
        }

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
}