import { mat4 } from "gl-matrix";
import SceneGraphVisitor from "../scenegraph/SceneGraphVisitor";
import SceneGraphNode from "../scenegraph/SceneGraphNode";
import { UniformName } from "../shaders/ShaderDescription";
import ShaderProgram from "../shaders/ShaderProgram";
import SceneGraphGPassNode from "../scenegraph/SceneGraphGPassNode";
import SceneGraphLightPassNode from "../scenegraph/SceneGraphLightPassNode";
import Renderable from "./Renderable";
import DirectionalLightVolume from "../lighting/DirectionalLightVolume";
import LightVolume from "../lighting/LightVolume";
import PointLightVolume from "../lighting/PointLightVolume";

export default class Renderer implements SceneGraphVisitor {
    private worldMatrixStack: mat4[] = [];
    private projectionViewMatrixStack: mat4[] = [];
    private shaderProgramStack: ShaderProgram[] = [];
    private currentWorldMatrix: mat4 = mat4.create();

    constructor(private readonly gl: WebGL2RenderingContext) {
        if (!this.gl.getExtension("EXT_color_buffer_float")) {
            throw new Error("Extension EXT_color_buffer_float is not available.");
        }
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
        this.updateCurrentWorldMatrix();
    }

    popWorldMatrix(): void {
        this.worldMatrixStack.pop();
        this.updateCurrentWorldMatrix();
    }

    pushShaderProgram(shaderProgram: ShaderProgram): void {
        this.shaderProgramStack.push(shaderProgram);
    }

    popShaderProgram(): void {
        this.shaderProgramStack.pop();
    }

    beginGPass(node: SceneGraphGPassNode): void {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, node.frameBuffer);

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.disable(this.gl.BLEND);
        this.gl.enable(this.gl.DEPTH_TEST); this.gl.disable(this.gl.BLEND);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.CULL_FACE);
    }

    endGPass(): void {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    beginLightPass(node: SceneGraphLightPassNode): void {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.ONE, this.gl.ONE);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.enable(this.gl.CULL_FACE);
    }

    endLightPass(): void {
        this.gl.disable(this.gl.BLEND);
    }

    renderLight(renderable: Renderable): void {
        this.renderRenderable(renderable);
    }

    renderMesh(renderable: Renderable): void {
        this.renderRenderable(renderable);
    }

    renderRenderable(renderable: Renderable) {
        const currentShader = this.shaderProgramStack[this.shaderProgramStack.length - 1];
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

                case UniformName.LightDirectional_Color:
                case UniformName.LightPoint_Color:
                    this.gl.uniform3fv(uniform.location, (renderable as LightVolume).color);
                    break;

                case UniformName.LightDirectional_AmbientIntensity:
                case UniformName.LightPoint_AmbientIntensity:
                    this.gl.uniform1f(uniform.location, (renderable as LightVolume).ambientIntensity);
                    break;

                case UniformName.LightDirectional_Intensity:
                    this.gl.uniform1f(uniform.location, (renderable as DirectionalLightVolume).intensity);
                    break;

                case UniformName.LightDirectional_Direction:
                    this.gl.uniform3fv(uniform.location, (renderable as DirectionalLightVolume).direction);
                    break;

                case UniformName.LightPoint_Intensity:
                    this.gl.uniform1f(uniform.location, (renderable as PointLightVolume).intensity);
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
}