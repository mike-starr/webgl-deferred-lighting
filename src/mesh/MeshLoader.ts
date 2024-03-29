import { AttributeName } from "../shaders/ShaderDescription";
import MeshVertexAttribute from "./MeshVertexAttribute";
import Mesh from "./Mesh";
import MeshIndexBufferDescription from "./MeshIndexBufferDescription";
import { vec3 } from "gl-matrix";

export default class MeshLoader {

    static loadTexturedQuad(gl: WebGL2RenderingContext,
        left: number,
        right: number,
        bottom: number,
        top: number) {
        const texCoordBuffer = gl.createBuffer();

        if (!texCoordBuffer) {
            throw new Error("Unable to create buffer.");
        }

        const vertices = [
            left, bottom, 0.0,
            left, top, 0.0,
            right, top, 0.0,
            right, bottom, 0.0
        ];

        const texCoords = [
            0.0, 0.0,
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
        ];

        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        const indices = [
            0, 3, 2,
            2, 1, 0,
        ];

        const vertexAttributeMap = new Map<AttributeName, MeshVertexAttribute>();

        vertexAttributeMap.set(AttributeName.VertexPosition, this.createPositionAttribute(gl, vertices));

        const texCoordAttribute = {
            name: AttributeName.TexCoord0,
            buffer: texCoordBuffer,
            componentCount: 2,
            type: gl.FLOAT,
            normalized: false,
            stride: 0,
            offset: 0
        };

        vertexAttributeMap.set(AttributeName.TexCoord0, texCoordAttribute);

        return {
            vertexAttributeMap: vertexAttributeMap,
            indexBufferDescription: this.createIndexBufferDescription(gl, indices)
        };
    }

    static loadPyramid(gl: WebGL2RenderingContext, halfExtent: number): Mesh {
        const vertices = [
            // Front face.
            -halfExtent, -halfExtent, halfExtent,
            halfExtent, -halfExtent, halfExtent,
            0.0, halfExtent, 0.0,

            // Back face.
            halfExtent, -halfExtent, -halfExtent,
            -halfExtent, -halfExtent, -halfExtent,
            0.0, halfExtent, 0.0,

            // Bottom face.
            halfExtent, -halfExtent, halfExtent,
            -halfExtent, -halfExtent, halfExtent,
            -halfExtent, -halfExtent, -halfExtent,
            halfExtent, -halfExtent, -halfExtent,

            // Left face.
            -halfExtent, -halfExtent, halfExtent,
            0.0, halfExtent, 0.0,
            -halfExtent, -halfExtent, -halfExtent,

            // Right face.
            halfExtent, -halfExtent, -halfExtent,
            0.0, halfExtent, 0.0,
            halfExtent, -halfExtent, halfExtent,
        ];

        const frontNormal = vec3.create();
        vec3.cross(frontNormal, [1.0, 0.0, 0.0], [-0.5, 1.0, -0.5]);
        vec3.normalize(frontNormal, frontNormal);

        const backNormal = vec3.create();
        vec3.cross(backNormal, [-1.0, 0.0, 0.0], [0.5, 1.0, 0.5]);
        vec3.normalize(backNormal, backNormal);

        const leftNormal = vec3.create();
        vec3.cross(leftNormal, [0.0, 0.0, 1.0], [0.5, 1.0, -0.5]);
        vec3.normalize(leftNormal, leftNormal);

        const rightNormal = vec3.create();
        vec3.cross(rightNormal, [0.0, 0.0, -1.0], [-0.5, 1.0, 0.5]);
        vec3.normalize(rightNormal, rightNormal);

        const normals = [
            ...frontNormal,
            ...frontNormal,
            ...frontNormal,

            ...backNormal,
            ...backNormal,
            ...backNormal,

            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,

            ...leftNormal,
            ...leftNormal,
            ...leftNormal,

            ...rightNormal,
            ...rightNormal,
            ...rightNormal,
        ];

        const indices = [
            // front face
            0, 1, 2,

            // back face
            3, 4, 5,

            // bottom face
            6, 7, 8,
            8, 9, 6,

            // left face
            10, 11, 12,

            // right face
            13, 14, 15
        ];

        const vertexAttributeMap = new Map<AttributeName, MeshVertexAttribute>();
        vertexAttributeMap.set(AttributeName.VertexPosition, this.createPositionAttribute(gl, vertices));
        vertexAttributeMap.set(AttributeName.VertexNormal, this.createNormalAttribute(gl, normals));

        return {
            vertexAttributeMap: vertexAttributeMap,
            indexBufferDescription: this.createIndexBufferDescription(gl, indices)
        };

    }

    static loadCube(gl: WebGL2RenderingContext, halfExtent: number): Mesh {
        const vertices = [
            // Front face.
            -halfExtent, -halfExtent, halfExtent,
            halfExtent, -halfExtent, halfExtent,
            halfExtent, halfExtent, halfExtent,
            -halfExtent, halfExtent, halfExtent,

            // Back face.
            halfExtent, -halfExtent, -halfExtent,
            -halfExtent, -halfExtent, -halfExtent,
            -halfExtent, halfExtent, -halfExtent,
            halfExtent, halfExtent, -halfExtent,

            // Top face.
            -halfExtent, halfExtent, halfExtent,
            halfExtent, halfExtent, halfExtent,
            halfExtent, halfExtent, -halfExtent,
            -halfExtent, halfExtent, -halfExtent,

            // Bottom face.
            halfExtent, -halfExtent, halfExtent,
            -halfExtent, -halfExtent, halfExtent,
            -halfExtent, -halfExtent, -halfExtent,
            halfExtent, -halfExtent, -halfExtent,

            // Left face.
            -halfExtent, -halfExtent, halfExtent,
            -halfExtent, halfExtent, halfExtent,
            -halfExtent, halfExtent, -halfExtent,
            -halfExtent, -halfExtent, -halfExtent,

            // Right face.
            halfExtent, -halfExtent, -halfExtent,
            halfExtent, halfExtent, -halfExtent,
            halfExtent, halfExtent, halfExtent,
            halfExtent, -halfExtent, halfExtent,
        ];

        const normals = [
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,

            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,

            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,

            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,

            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,

            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0
        ];

        const indices = [
            // front face
            0, 1, 2,
            2, 3, 0,

            // back face
            4, 5, 6,
            6, 7, 4,

            // top face
            8, 9, 10,
            10, 11, 8,

            // bottom face
            12, 13, 14,
            14, 15, 12,

            // left face
            16, 17, 18,
            18, 19, 16,

            // right face
            20, 21, 22,
            22, 23, 20
        ];

        const vertexAttributeMap = new Map<AttributeName, MeshVertexAttribute>();
        vertexAttributeMap.set(AttributeName.VertexPosition, this.createPositionAttribute(gl, vertices));
        vertexAttributeMap.set(AttributeName.VertexNormal, this.createNormalAttribute(gl, normals));

        return {
            vertexAttributeMap: vertexAttributeMap,
            indexBufferDescription: this.createIndexBufferDescription(gl, indices)
        };
    }

    static loadSphere(gl: WebGL2RenderingContext,
        stacks: number,
        slices: number,
        radius: number = 1.0): Mesh {

        const vertices = [];
        const indices = [];
        const normals = [];

        for (let stackIndex = 0; stackIndex <= stacks; ++stackIndex) {
            const stackAngle = stackIndex * Math.PI / stacks;
            const stackAngleSin = Math.sin(stackAngle);
            const stackAngleCos = Math.cos(stackAngle);

            for (let sliceIndex = 0; sliceIndex <= slices; ++sliceIndex) {
                const sliceAngle = sliceIndex * 2 * Math.PI / slices;
                const sliceAngleSin = Math.sin(sliceAngle);
                const sliceAngleCos = Math.cos(sliceAngle);

                const x = sliceAngleSin * stackAngleSin * radius;
                const y = stackAngleCos * radius;
                const z = sliceAngleCos * stackAngleSin * radius;

                vertices.push(x, y, z);
                normals.push(x, y, z);
            }
        }

        for (let stackIndex = 0; stackIndex < stacks; ++stackIndex) {
            for (let sliceIndex = 0; sliceIndex < slices; ++sliceIndex) {
                const firstIndex = stackIndex * (slices + 1) + sliceIndex;
                const secondIndex = firstIndex + (slices + 1);

                indices.push(firstIndex, secondIndex, firstIndex + 1);
                indices.push(firstIndex + 1, secondIndex, secondIndex + 1);
            }
        }

        const vertexAttributeMap = new Map<AttributeName, MeshVertexAttribute>();
        vertexAttributeMap.set(AttributeName.VertexPosition, this.createPositionAttribute(gl, vertices));
        vertexAttributeMap.set(AttributeName.VertexNormal, this.createNormalAttribute(gl, normals));

        return {
            vertexAttributeMap: vertexAttributeMap,
            indexBufferDescription: this.createIndexBufferDescription(gl, indices)
        };
    }

    private static createPositionAttribute(gl: WebGL2RenderingContext, positions: number[]): MeshVertexAttribute {
        const buffer = gl.createBuffer();
        if (!buffer) {
            throw new Error("Unable to create buffer.");
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        return {
            name: AttributeName.VertexPosition,
            buffer: buffer,
            componentCount: 3,
            type: gl.FLOAT,
            normalized: false,
            stride: 0,
            offset: 0
        };
    }

    private static createNormalAttribute(gl: WebGL2RenderingContext, normals: number[]): MeshVertexAttribute {
        const buffer = gl.createBuffer();
        if (!buffer) {
            throw new Error("Unable to create buffer.");
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        return {
            name: AttributeName.VertexNormal,
            buffer: buffer,
            componentCount: 3,
            type: gl.FLOAT,
            normalized: false,
            stride: 0,
            offset: 0
        };
    }

    private static createIndexBufferDescription(gl: WebGL2RenderingContext, indices: number[]): MeshIndexBufferDescription {
        const elementBuffer = gl.createBuffer();
        if (!elementBuffer) {
            throw new Error("Unable to create buffer.");
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        return {
            buffer: elementBuffer,
            primitiveType: gl.TRIANGLES,
            vertexCount: indices.length,
            type: gl.UNSIGNED_SHORT,
            offset: 0
        };
    }

}