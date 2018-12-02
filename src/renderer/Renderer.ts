import { mat4 } from "gl-matrix";
import SceneGraphVisitor from "../scenegraph/SceneGraphVisitor";
import SceneGraphNode from "../scenegraph/SceneGraphNode";
import { AttributeName, UniformName } from "../engine/ShaderDescription";
import ShaderProgram from "../engine/ShaderProgram";
import Mesh from "../Mesh/Mesh";

export default class Renderer implements SceneGraphVisitor {
    private worldMatrixStack: mat4[] = [];
    private projectionViewMatrixStack: mat4[] = [];
    private shaderProgramStack: ShaderProgram[] = [];

    constructor(private readonly gl: WebGL2RenderingContext) {
    }

    render(sceneGraphRoot: SceneGraphNode) {
        if (!this.gl) {
            return;
        }

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

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

    renderMesh(mesh: Mesh): void {
        const currentShader = this.shaderProgramStack[this.shaderProgramStack.length - 1];
        this.gl.useProgram(currentShader.program);

        for (const attribute of currentShader.description.attributes) {
            switch (attribute.name) {
                case AttributeName.VertexPosition:
                    {
                        const meshVertexPositionAttribute = mesh.vertexAttributeMap.get(attribute.name);
                        if (!meshVertexPositionAttribute) {
                            throw new Error("Mesh has no vertex position data.");
                        }

                        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, meshVertexPositionAttribute.buffer);
                        this.gl.vertexAttribPointer(attribute.location,
                            meshVertexPositionAttribute.componentCount,
                            meshVertexPositionAttribute.type,
                            meshVertexPositionAttribute.normalized,
                            meshVertexPositionAttribute.stride,
                            meshVertexPositionAttribute.offset);
                        this.gl.enableVertexAttribArray(attribute.location);
                    }
                    break;

                default:
                    throw new Error("Unknown attribute name.");
            }
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