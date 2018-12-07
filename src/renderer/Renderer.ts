import { mat4 } from "gl-matrix";
import SceneGraphVisitor from "../scenegraph/SceneGraphVisitor";
import SceneGraphNode from "../scenegraph/SceneGraphNode";
import { UniformName } from "../engine/ShaderDescription";
import ShaderProgram from "../engine/ShaderProgram";
import Mesh from "../Mesh/Mesh";

export default class Renderer implements SceneGraphVisitor {
    private worldMatrixStack: mat4[] = [];
    private projectionViewMatrixStack: mat4[] = [];
    private shaderProgramStack: ShaderProgram[] = [];


    private gBuffer: any;
    private positionTexture: any;
    private normalTexture: any;
    private colorTexture: any;


    constructor(private readonly gl: WebGL2RenderingContext) {
        if (!this.gl.getExtension("EXT_color_buffer_float")) {
            throw new Error("Extension EXT_color_buffer_float is not available.");
        }

        this.gBuffer = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.gBuffer);

        this.positionTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.positionTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.positionTexture, 0);

        this.normalTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.normalTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.normalTexture, 0);

        this.colorTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, this.colorTexture, 0);

        const depthTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT16, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);

        gl.drawBuffers([ gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2 ]);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        console.log(this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER));
    }

    render(sceneGraphRoot: SceneGraphNode): void {
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.enable(this.gl.CULL_FACE);

        sceneGraphRoot.accept(this);
    }

    pushProjectionViewMatrix(projectionViewMatrix: mat4): void {
        this.projectionViewMatrixStack.push(projectionViewMatrix);
    }

    popProjectionViewMatrix(): void {
        this.projectionViewMatrixStack.pop();
    }

    pushWorldMatrix(worldMatrix: mat4): void {
        this.worldMatrixStack.push(worldMatrix);
    }

    popWorldMatrix(): void {
        this.worldMatrixStack.pop();
    }

    pushShaderProgram(shaderProgram: ShaderProgram): void {
        this.shaderProgramStack.push(shaderProgram);
    }

    popShaderProgram(): void {
        this.shaderProgramStack.pop();
    }

    bindTexture(texture: WebGLTexture, index: GLenum): void {
        this.gl.activeTexture(index);
        //this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.normalTexture);
    }

    beginGBufferPass(): void {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.gBuffer);

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
    }

    endGBufferPass(): void {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    renderMesh(mesh: Mesh): void {
        const currentShader = this.shaderProgramStack[this.shaderProgramStack.length - 1];
        this.gl.useProgram(currentShader.program);

        for (const attribute of currentShader.description.attributes) {
            const vertexAttribute = mesh.vertexAttributeMap.get(attribute.name);
            if (!vertexAttribute) {
                throw new Error(`Mesh is missing data for attribute: ${attribute.name}`);
            }

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexAttribute.buffer);
            this.gl.vertexAttribPointer(attribute.location,
                vertexAttribute.componentCount,
                vertexAttribute.type,
                vertexAttribute.normalized,
                vertexAttribute.stride,
                vertexAttribute.offset);
            this.gl.enableVertexAttribArray(attribute.location);
        }

        for (const uniform of currentShader.description.uniforms) {
            switch (uniform.name) {
                case UniformName.ProjectionViewMatrix:
                    this.gl.uniformMatrix4fv(uniform.location,
                        false,
                        this.projectionViewMatrixStack[this.projectionViewMatrixStack.length - 1]);
                    break;

                case UniformName.WorldMatrix:
                    this.gl.uniformMatrix4fv(uniform.location,
                        false,
                        this.worldMatrixStack[this.worldMatrixStack.length - 1]);
                    break;

                case UniformName.TextureSampler0:
                    this.gl.uniform1i(uniform.location, 0);
                    break;

                default:
                    throw new Error("Unknown uniform name.");
            }
        }

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, mesh.indexBufferDescription.buffer);

        this.gl.drawElements(this.gl.TRIANGLES,
            mesh.indexBufferDescription.vertexCount,
            mesh.indexBufferDescription.type,
            mesh.indexBufferDescription.offset);
    }
}