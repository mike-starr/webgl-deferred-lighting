import { mat4 } from "gl-matrix";
import SceneGraphVisitor from "../scenegraph/SceneGraphVisitor";
import SceneGraphNode from "../scenegraph/SceneGraphNode";
import { UniformName } from "../shaders/ShaderDescription";
import ShaderProgram from "../shaders/ShaderProgram";
import SceneGraphGPassNode from "../scenegraph/SceneGraphGPassNode";
import SceneGraphLightPassNode from "../scenegraph/SceneGraphLightPassNode";
import Renderable from "./Renderable";
import GBuffer from "./GBuffer";
import DirectionalLightVolume from "../lighting/DirectionalLightVolume";
import LightVolume from "../lighting/LightVolume";
import PointLightVolume from "../lighting/PointLightVolume";

enum PassType {
    None,
    GPass,
    LightPass,
    NormalPass
}

export default class Renderer implements SceneGraphVisitor {
    private worldMatrixStack: mat4[] = [];
    private projectionViewMatrixStack: mat4[] = [];
    private shaderProgramStack: ShaderProgram[] = [];
    private currentWorldMatrix: mat4 = mat4.create();
    private passType: PassType = PassType.None;

    constructor(private readonly gl: WebGL2RenderingContext) {
        if (!this.gl.getExtension("EXT_color_buffer_float")) {
            throw new Error("Extension EXT_color_buffer_float is not available.");
        }
    }

    static createGBuffer(gl: WebGL2RenderingContext): GBuffer {
        const frameBuffer = gl.createFramebuffer();
        if (!frameBuffer) {
            throw new Error("Failed to create framebuffer.");
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

        const positionTarget = this.createRenderTargetTexture(gl, gl.RGBA32F);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, positionTarget, 0);

        const normalTarget = this.createRenderTargetTexture(gl, gl.RGBA32F);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, normalTarget, 0);

        const diffuseTarget = this.createRenderTargetTexture(gl, gl.RGBA8);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, diffuseTarget, 0);

        const depthTarget = this.createRenderTargetTexture(gl, gl.DEPTH_COMPONENT24);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTarget, 0);

        const accumulationTarget = this.createRenderTargetTexture(gl, gl.RGBA8);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT3, gl.TEXTURE_2D, accumulationTarget, 0);

        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2, gl.COLOR_ATTACHMENT3]);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return {
            frameBuffer: frameBuffer,
            diffuseTexture: diffuseTarget,
            positionTexture: positionTarget,
            normalTexture: normalTarget,
            depthTexture: depthTarget,
            accumulationTexture: accumulationTarget
        };
    }

    static createLightPassFrameBuffer(gl: WebGL2RenderingContext,
        accumulationTexture: WebGLTexture,
        depthTexture: WebGLTexture): WebGLFramebuffer {
        const frameBuffer = gl.createFramebuffer();
        if (!frameBuffer) {
            throw new Error("Failed to create framebuffer.");
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, accumulationTexture, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return frameBuffer;
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

    beginGPass(node: SceneGraphGPassNode): void {
        if (this.passType !== PassType.None) {
            throw new Error("Can't start a render pass while in another pass.")
        }

        this.passType = PassType.GPass;

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, node.gBuffer.frameBuffer);

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.disable(this.gl.BLEND);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.CULL_FACE);
    }

    endGPass(): void {
        this.passType = PassType.None;
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    beginLightPass(node: SceneGraphLightPassNode): void {
        if (this.passType !== PassType.None) {
            throw new Error("Can't start a render pass while in another pass.")
        }

        this.passType = PassType.LightPass;

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, node.frameBuffer);

        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.ONE, this.gl.ONE);
        this.gl.enable(this.gl.CULL_FACE);
    }

    endLightPass(): void {
        this.gl.disable(this.gl.BLEND);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        this.passType = PassType.None;
    }

    beginNormalPass(): void {
        if (this.passType !== PassType.None) {
            throw new Error("Can't start a render pass while in another pass.")
        }

        this.passType = PassType.NormalPass;
    }

    endNormalPass(): void {
        this.passType = PassType.None;
    }

    renderLight(renderable: Renderable): void {
        if (this.passType !== PassType.LightPass) {
            return;
        }

        this.renderRenderable(renderable);
    }

    renderMesh(renderable: Renderable): void {
        if (!(this.passType === PassType.GPass ||
            this.passType === PassType.NormalPass)) {
            return;
        }

        this.renderRenderable(renderable);
    }

    private renderRenderable(renderable: Renderable) {
        this.updateCurrentWorldMatrix();

        const currentShader = renderable.shaderProgram;
        this.gl.useProgram(currentShader.program);

        const mesh = renderable.mesh;

        const worldMatrix = mat4.create();
        mat4.mul(worldMatrix, this.currentWorldMatrix, renderable.localTransform);

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
                        worldMatrix);
                    break;

                case UniformName.InverseWorldMatrix:
                    {
                        const inverseWorldMatrix = mat4.create();
                        mat4.invert(inverseWorldMatrix, worldMatrix);

                        this.gl.uniformMatrix4fv(uniform.location,
                            false,
                            inverseWorldMatrix);
                    }
                    break;

                case UniformName.TextureSampler0:
                    this.gl.activeTexture(this.gl.TEXTURE0);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, renderable.textures[0]);
                    this.gl.uniform1i(uniform.location, 0);
                    break;

                case UniformName.TextureSampler1:
                    this.gl.activeTexture(this.gl.TEXTURE1);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, renderable.textures[1]);
                    this.gl.uniform1i(uniform.location, 1);
                    break;

                case UniformName.TextureSampler2:
                    this.gl.activeTexture(this.gl.TEXTURE2);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, renderable.textures[2]);
                    this.gl.uniform1i(uniform.location, 2);
                    break;

                case UniformName.MaterialDiffuseColor:
                    this.gl.uniform3fv(uniform.location, renderable.material.diffuseColor);
                    break;

                case UniformName.MaterialEmissiveColor:
                    this.gl.uniform3fv(uniform.location, renderable.material.emissiveColor);
                    break;

                case UniformName.MaterialSpecularIntensity:
                    this.gl.uniform1f(uniform.location, renderable.material.specularIntensity);
                    break;

                case UniformName.MaterialSpecularPower:
                    this.gl.uniform1f(uniform.location, renderable.material.specularPower);
                    break;

                case UniformName.LightDirectional_Color:
                case UniformName.LightPoint_Color:
                    this.gl.uniform3fv(uniform.location, (renderable as LightVolume).color);
                    break;

                case UniformName.LightDirectional_Intensity:
                case UniformName.LightPoint_Intensity:
                    this.gl.uniform1f(uniform.location, (renderable as LightVolume).intensity);
                    break;

                case UniformName.LightDirectional_Direction:
                    this.gl.uniform3fv(uniform.location, (renderable as DirectionalLightVolume).direction);
                    break;

                default:
                    throw new Error("Unknown uniform name.");
            }
        }

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, mesh.indexBufferDescription.buffer);

        this.gl.drawElements(mesh.indexBufferDescription.primitiveType,
            mesh.indexBufferDescription.vertexCount,
            mesh.indexBufferDescription.type,
            mesh.indexBufferDescription.offset);
    }

    private updateCurrentWorldMatrix() {
        mat4.identity(this.currentWorldMatrix);

        for (const matrix of this.worldMatrixStack) {
            mat4.mul(this.currentWorldMatrix, this.currentWorldMatrix, matrix);
        }
    }

    private static createRenderTargetTexture(gl: WebGL2RenderingContext, format: GLenum): WebGLTexture {
        const texture = gl.createTexture();
        if (!texture) {
            throw new Error("Failed to create texture.");
        }

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texStorage2D(gl.TEXTURE_2D, 1, format, gl.drawingBufferWidth, gl.drawingBufferHeight);

        return texture;
    }
}