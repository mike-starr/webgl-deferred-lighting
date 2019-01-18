import { mat4, vec3 } from "gl-matrix";
import SceneGraphVisitor from "../scenegraph/SceneGraphVisitor";
import SceneGraphNode from "../scenegraph/SceneGraphNode";
import { UniformName } from "../shaders/ShaderDescription";
import Renderable from "./Renderable";
import GBuffer from "./GBuffer";
import DirectionalLightVolume from "../lighting/DirectionalLightVolume";
import LightVolume from "../lighting/LightVolume";
import ShaderProgram from "../shaders/ShaderProgram";
import Shaders from "../shaders/Shaders";
import Camera from "../camera/Camera";
import TextureConstant from "./TextureConstant";
import RenderQueue from "./RenderQueue";

export default class Renderer implements SceneGraphVisitor {
    private worldMatrixStack: mat4[] = [];
    private cameraStack: Camera[] = [];
    private currentWorldMatrix: mat4 = mat4.create();
    private stencilPassShader: ShaderProgram;
    private activeRenderQueue: RenderQueue = RenderQueue.Opaque;
    private gBuffer: GBuffer;
    private lightPassFramebuffer: WebGLFramebuffer;

    constructor(private readonly gl: WebGL2RenderingContext) {
        if (!this.gl.getExtension("EXT_color_buffer_float")) {
            throw new Error("Extension EXT_color_buffer_float is not available.");
        }

        this.stencilPassShader = Shaders.makeStencilPassShader(gl);
        this.gBuffer = this.createGBuffer();
        this.lightPassFramebuffer = this.createLightPassFrameBuffer(this.gBuffer);

        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.clearStencil(0);
    }

    render(sceneGraphRoot: SceneGraphNode): void {
        this.beginGPass();
        sceneGraphRoot.accept(this);
        this.endGPass();

        this.beginLightPass();
        sceneGraphRoot.accept(this);
        this.endLightPass();

        this.beginOverlayPass();
        sceneGraphRoot.accept(this);
        this.endOverlayPass();
    }

    pushCamera(camera: Camera): void {
        this.cameraStack.push(camera);
    }

    popCamera(): void {
        this.cameraStack.pop();
    }

    pushWorldMatrix(worldMatrix: mat4): void {
        this.worldMatrixStack.push(worldMatrix);
    }

    popWorldMatrix(): void {
        this.worldMatrixStack.pop();
    }

    renderLight(renderable: Renderable): void {
        if (this.activeRenderQueue !== renderable.renderQueue) {
            return;
        }

        // Disable culling and depth-test so the stencil op works.
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.CULL_FACE);

        // Enable stencil writes and set function to always suceed.
        this.gl.stencilMask(1);
        this.gl.clear(this.gl.STENCIL_BUFFER_BIT);
        this.gl.stencilFunc(this.gl.ALWAYS, 0, 1);

        // Disable color writes.
        this.gl.colorMask(false, false, false, false);

        // Render to stencil buffer.
        this.renderRenderable(renderable, this.stencilPassShader);

        // Disable depth reads for rendering to color buffer.
        this.gl.disable(this.gl.DEPTH_TEST);

        // Enable front-face culling.
        this.gl.enable(this.gl.CULL_FACE);

        // Disable stencil writes, set test to succeed on non-zero values.
        this.gl.stencilFunc(this.gl.NOTEQUAL, 0, 1);
        this.gl.stencilMask(0);

        // Enable color writes.
        this.gl.colorMask(true, true, true, true);

        // Render to color buffer.
        this.renderRenderable(renderable);
    }

    renderMesh(renderable: Renderable): void {
        if (this.activeRenderQueue !== renderable.renderQueue) {
            return;
        }

        this.renderRenderable(renderable);
    }

    private renderRenderable(renderable: Renderable, shaderOverride?: ShaderProgram) {
        this.updateCurrentWorldMatrix();

        const shader = shaderOverride ? shaderOverride : renderable.shaderProgram;
        this.gl.useProgram(shader.program);

        const mesh = renderable.mesh;

        const worldMatrix = mat4.create();
        mat4.mul(worldMatrix, this.currentWorldMatrix, renderable.localTransform);

        const inverseWorldMatrix = mat4.create();
        mat4.invert(inverseWorldMatrix, worldMatrix);

        const camera = this.cameraStack[this.cameraStack.length - 1];

        for (const attribute of shader.description.attributes) {
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

        for (const uniform of shader.description.uniforms) {
            switch (uniform.name) {
                case UniformName.ProjectionViewMatrix:
                    this.gl.uniformMatrix4fv(uniform.location,
                        false,
                        camera.projectionViewMatrix);
                    break;

                case UniformName.WorldMatrix:
                    this.gl.uniformMatrix4fv(uniform.location,
                        false,
                        worldMatrix);
                    break;

                case UniformName.InverseWorldMatrix:
                    this.gl.uniformMatrix4fv(uniform.location,
                        false,
                        inverseWorldMatrix);
                    break;

                case UniformName.CameraPositionLocalSpace:
                    {
                        const cameraPosLocalSpace = vec3.create();
                        vec3.transformMat4(cameraPosLocalSpace, camera.eyePoint, inverseWorldMatrix);
                        this.gl.uniform3fv(uniform.location, cameraPosLocalSpace)
                    }
                    break;

                case UniformName.TextureSampler0:
                    this.gl.activeTexture(this.gl.TEXTURE0);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, this.resolveTexture(renderable.textures[0]));
                    this.gl.uniform1i(uniform.location, 0);
                    break;

                case UniformName.TextureSampler1:
                    this.gl.activeTexture(this.gl.TEXTURE1);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, this.resolveTexture(renderable.textures[1]));
                    this.gl.uniform1i(uniform.location, 1);
                    break;

                case UniformName.TextureSampler2:
                    this.gl.activeTexture(this.gl.TEXTURE2);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, this.resolveTexture(renderable.textures[2]));
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

    private beginGPass(): void {
        this.activeRenderQueue = RenderQueue.Opaque;

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.gBuffer.frameBuffer);

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT | this.gl.STENCIL_BUFFER_BIT);

        // Disable blending.
        this.gl.disable(this.gl.BLEND);

        // Enable back-face culling.
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
    }

    private endGPass(): void {

    }

    private beginLightPass(): void {
        this.activeRenderQueue = RenderQueue.Lighting;

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.lightPassFramebuffer);

        // Enable additive blending.
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.ONE, this.gl.ONE);

        // Stencil setup.
        this.gl.enable(this.gl.STENCIL_TEST);
        this.gl.stencilOpSeparate(this.gl.BACK, this.gl.KEEP, this.gl.INCR_WRAP, this.gl.KEEP);
        this.gl.stencilOpSeparate(this.gl.FRONT, this.gl.KEEP, this.gl.DECR_WRAP, this.gl.KEEP);

        // Disable depth writes.
        this.gl.depthMask(false);

        // Cull front faces instead of back to avoid issues when the camera
        // is inside the light volume.
        this.gl.cullFace(this.gl.FRONT);
    }

    private endLightPass(): void {
        this.gl.disable(this.gl.BLEND);
        this.gl.cullFace(this.gl.BACK);
        this.gl.depthMask(true);
        this.gl.disable(this.gl.STENCIL_TEST);
        this.gl.enable(this.gl.DEPTH_TEST);
    }

    private beginOverlayPass(): void {
        this.activeRenderQueue = RenderQueue.Overlay;

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    private endOverlayPass(): void {

    }

    private updateCurrentWorldMatrix() {
        mat4.identity(this.currentWorldMatrix);

        for (const matrix of this.worldMatrixStack) {
            mat4.mul(this.currentWorldMatrix, this.currentWorldMatrix, matrix);
        }
    }

    private resolveTexture(texture:WebGLTexture|TextureConstant): WebGLTexture {
        if (texture instanceof WebGLTexture) {
            return texture;
        }

        switch (texture) {
            case TextureConstant.GBufferAccumulationTarget:
                return this.gBuffer.accumulationTexture;
            case TextureConstant.GBufferDepthTarget:
                return this.gBuffer.depthTexture;
            case TextureConstant.GBufferDiffuseTarget:
                return this.gBuffer.diffuseTexture;
            case TextureConstant.GBufferNormalTarget:
                return this.gBuffer.normalTexture;
            case TextureConstant.GBufferPositionTarget:
                return this.gBuffer.positionTexture;
            default:
                throw new Error("Unkown texture constant.");
        }
    }

    private createGBuffer(): GBuffer {
        const gl = this.gl;

        const frameBuffer = gl.createFramebuffer();
        if (!frameBuffer) {
            throw new Error("Failed to create framebuffer.");
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

        const positionTarget = this.createRenderTargetTexture(gl.RGBA32F);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, positionTarget, 0);

        const normalTarget = this.createRenderTargetTexture(gl.RGBA32F);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, normalTarget, 0);

        const diffuseTarget = this.createRenderTargetTexture(gl.RGBA8);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, diffuseTarget, 0);

        const depthTarget = this.createRenderTargetTexture(gl.DEPTH24_STENCIL8);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, depthTarget, 0);

        const accumulationTarget = this.createRenderTargetTexture(gl.RGBA8);
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

    private createRenderTargetTexture(format: GLenum): WebGLTexture {
        const gl = this.gl;
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

    private createLightPassFrameBuffer(gBuffer: GBuffer): WebGLFramebuffer {
        const gl = this.gl;
        const frameBuffer = gl.createFramebuffer();
        if (!frameBuffer) {
            throw new Error("Failed to create framebuffer.");
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, gBuffer.accumulationTexture, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, gBuffer.depthTexture, 0);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return frameBuffer;
    }
}