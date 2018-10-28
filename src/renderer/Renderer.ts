export default class Renderer {

    private glContext: WebGLRenderingContext | null;

    constructor(private readonly element: HTMLCanvasElement) {
        this.glContext = element.getContext("experimental-webgl");
    }

    render() {

    }





}