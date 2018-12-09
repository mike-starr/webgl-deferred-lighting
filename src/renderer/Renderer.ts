import { mat4 } from "gl-matrix";
import SceneGraphVisitor from "../scenegraph/SceneGraphVisitor";
import SceneGraphNode from "../scenegraph/SceneGraphNode";
import { UniformName } from "../engine/ShaderDescription";
import ShaderProgram from "../engine/ShaderProgram";
import SceneGraphGBufferNode from "../scenegraph/SceneGraphGBufferNode";
import SceneGraphLightPassNode from "../scenegraph/SceneGraphLightPassNode";
import Renderable from "./Renderable";
import DirectionalLightVolume from "../lighting/DirectionalLightVolume";
import LightVolume from "../lighting/LightVolume";

export default class Renderer implements SceneGraphVisitor {
    private worldMatrixStack: mat4[] = [];
    private projectionViewMatrixStack: mat4[] = [];
    private shaderProgramStack: ShaderProgram[] = [];

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

    beginGBufferPass(node: SceneGraphGBufferNode): void {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, node.frameBuffer);

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.CULL_FACE);
    }

    endGBufferPass(): void {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    beginLightPass(node: SceneGraphLightPassNode): void {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    endLightPass(): void {

    }

    renderRenderable(renderable: Renderable) {
        const mesh = renderable.mesh;
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

                case UniformName.LightDirectional_Direction:
                    this.gl.uniform3fv(uniform.location, (renderable as DirectionalLightVolume).direction);
                    break;

                case UniformName.LightDirectional_Color:
                    this.gl.uniform3fv(uniform.location, (renderable as LightVolume).color);
                    break;

                case UniformName.LightDirectional_Intensity:
                    this.gl.uniform1f(uniform.location, (renderable as DirectionalLightVolume).intensity);
                    break;

                case UniformName.LightDirectional_AmbientIntensity:
                    this.gl.uniform1f(uniform.location, (renderable as DirectionalLightVolume).ambientIntensity);
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