import { mat4 } from "gl-matrix";
import SceneGraphVisitor from "../scenegraph/SceneGraphVisitor";
import SceneGraphNode from "../scenegraph/SceneGraphNode";

export default class Renderer implements SceneGraphVisitor {

    private gl: WebGL2RenderingContext;
    private shaderProgramInfo: any;
    private positionBuffer: any;

    private readonly vsSource = `
        attribute vec4 aVertexPosition;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        void main() {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        }`;

    private readonly fsSource = `
        void main() {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }`;

    constructor(element: HTMLCanvasElement) {
        const gl = element.getContext('webgl2');

        if (gl) {
            this.gl = gl;
        } else {
            throw new Error("Failed to initialize webgl context.");
        }


        const shaderProgram = this.initShaderProgram(this.vsSource, this.fsSource);
        if (!shaderProgram) {
            return;
        }

        this.shaderProgramInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            },
        };

        this.positionBuffer = this.initBuffers();
    }

    render(sceneGraphRoot: SceneGraphNode) {
        if (!this.gl) {
            return;
        }

        this.drawScene(sceneGraphRoot);
    }

    pushProjectionViewMatrix(projectionViewMatrix: mat4): void {

    }

    popProjectionViewMatrix(): void {

    }

    pushWorldMatrix(worldMatrix: mat4): void {

    }

    popWorldMatrix(): void {

    }

    renderMesh(): void {

    }

    private drawScene(sceneGraphRoot: SceneGraphNode) {


        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gl.enable(this.gl.DEPTH_TEST);           // Enable depth testing
        this.gl.depthFunc(this.gl.LEQUAL);            // Near things obscure far things

        sceneGraphRoot.accept(this);

        // Create a perspective matrix, a special matrix that is
        // used to simulate the distortion of perspective in a camera.
        // Our field of view is 45 degrees, with a width/height
        // ratio that matches the display size of the canvas
        // and we only want to see objects between 0.1 units
        // and 100 units away from the camera.

        const fieldOfView = 45 * Math.PI / 180;   // in radians
        const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
        const zNear = 0.1;
        const zFar = 100.0;

        const projectionMatrix = mat4.create();

        // note: glmatrix.js always has the first argument
        // as the destination to receive the result.
        mat4.perspective(projectionMatrix,
                         fieldOfView,
                         aspect,
                         zNear,
                         zFar);

        // Set the drawing position to the "identity" point, which is
        // the center of the scene.
        const modelViewMatrix = mat4.create();

        // Now move the drawing position a bit to where we want to
        // start drawing the square.

        mat4.translate(modelViewMatrix,     // destination matrix
                       modelViewMatrix,     // matrix to translate
                       [-0.0, 0.0, -6.0]);  // amount to translate

        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute.
        {
          const numComponents = 2;  // pull out 2 values per iteration
          const type = this.gl.FLOAT;    // the data in the buffer is 32bit floats
          const normalize = false;  // don't normalize
          const stride = 0;         // how many bytes to get from one set of values to the next
                                    // 0 = use type and numComponents above
          const offset = 0;         // how many bytes inside the buffer to start from
          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
          this.gl.vertexAttribPointer(
              this.shaderProgramInfo.attribLocations.vertexPosition,
              numComponents,
              type,
              normalize,
              stride,
              offset);
          this.gl.enableVertexAttribArray(
            this.shaderProgramInfo.attribLocations.vertexPosition);
        }

        // Tell WebGL to use our program when drawing

        this.gl.useProgram(this.shaderProgramInfo.program);

        // Set the shader uniforms

        this.gl.uniformMatrix4fv(
            this.shaderProgramInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix);
        this.gl.uniformMatrix4fv(
            this.shaderProgramInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix);

        {
          const offset = 0;
          const vertexCount = 4;
          this.gl.drawArrays(this.gl.TRIANGLE_STRIP, offset, vertexCount);
        }
      }


    private initBuffers(): WebGLBuffer | null {
        // Create a buffer for the square's positions.
        const positionBuffer = this.gl.createBuffer();
        if (!positionBuffer) {
            return null;
        }

        // Select the positionBuffer as the one to apply buffer
        // operations to from here out.
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);

        // Now create an array of positions for the square.
        const positions = [
            -1.0, 1.0,
            1.0, 1.0,
            -1.0, -1.0,
            1.0, -1.0,
        ];

        // Now pass the list of positions into WebGL to build the
        // shape. We do this by creating a Float32Array from the
        // JavaScript array, then use it to fill the current buffer.
        this.gl.bufferData(this.gl.ARRAY_BUFFER,
            new Float32Array(positions),
            this.gl.STATIC_DRAW);

        return positionBuffer;
    }


    //
    // Initialize a shader program, so WebGL knows how to draw our data
    //
    private initShaderProgram(vsSource: string, fsSource: string): WebGLProgram | null {
        const vertexShader = this.loadShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.loadShader(this.gl.FRAGMENT_SHADER, fsSource);

        if (!vertexShader || !fragmentShader) {
            return null;
        }

        // Create the shader program
        const shaderProgram = this.gl.createProgram();
        if (!shaderProgram) {
            return null;
        }

        this.gl.attachShader(shaderProgram, vertexShader);
        this.gl.attachShader(shaderProgram, fragmentShader);
        this.gl.linkProgram(shaderProgram);

        // If creating the shader program failed, alert
        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(shaderProgram));
            return null;
        }

        return shaderProgram;
    }



    //
    // creates a shader of the given type, uploads the source and
    // compiles it.
    //
    private loadShader(type: number, source: string): WebGLShader | null {
        const shader = this.gl.createShader(type);

        if (!shader) {
            return null;
        }

        // Send the source to the shader object
        this.gl.shaderSource(shader, source);

        // Compile the shader program
        this.gl.compileShader(shader);

        // See if it compiled successfully
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

}