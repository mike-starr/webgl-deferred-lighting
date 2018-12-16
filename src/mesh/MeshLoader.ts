import { AttributeName } from "../shaders/ShaderDescription";
import MeshVertexAttribute from "./MeshVertexAttribute";
import Mesh from "./Mesh";
import { vec3 } from "gl-matrix";
import Material from "./Material";
import MaterialBuilder from "./MaterialBuilder";

export default class MeshLoader {

    static loadTexturedQuad(gl: WebGL2RenderingContext,
        left: number,
        right: number,
        bottom: number,
        top: number) {
        const positionBuffer = gl.createBuffer();
        const texCoordBuffer = gl.createBuffer();
        const elementBuffer = gl.createBuffer();

        if (!(positionBuffer && elementBuffer && texCoordBuffer)) {
            throw new Error("Unable to create buffer.");
        }

        const vertices = [
            left, bottom, 0.0,
            left, top, 0.0,
            right, top, 0.0,
            right, bottom, 0.0
        ];

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

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

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        const vertexAttributeMap = new Map<AttributeName, MeshVertexAttribute>();

        const vertexPositionAttribute = {
            name: AttributeName.VertexPosition,
            buffer: positionBuffer,
            componentCount: 3,
            type: gl.FLOAT,
            normalized: false,
            stride: 0,
            offset: 0
        };

        vertexAttributeMap.set(AttributeName.VertexPosition, vertexPositionAttribute);

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
            indexBufferDescription: {
                buffer: elementBuffer,
                primitiveType: gl.TRIANGLES,
                vertexCount: 6,
                type: gl.UNSIGNED_SHORT,
                offset: 0
            }
        };
    }

    static loadCube(gl: WebGL2RenderingContext,
        halfExtent: number,
        material: Material = new MaterialBuilder().build(),
        pyramidMode: boolean = false): Mesh {
        const positionBuffer = gl.createBuffer();
        const colorBuffer = gl.createBuffer();
        const normalBuffer = gl.createBuffer();
        const elementBuffer = gl.createBuffer();

        if (!(positionBuffer && elementBuffer && colorBuffer && normalBuffer)) {
            throw new Error("Unable to create buffer.");
        }

        const pyramidAdjuster = pyramidMode ? 0 : 1;

        const vertices = [
            // Front face.
            -halfExtent, -halfExtent, halfExtent,
            halfExtent, -halfExtent, halfExtent,
            halfExtent * pyramidAdjuster, halfExtent, halfExtent * pyramidAdjuster,
            -halfExtent * pyramidAdjuster, halfExtent, halfExtent * pyramidAdjuster,

            // Back face.
            halfExtent, -halfExtent, -halfExtent,
            -halfExtent, -halfExtent, -halfExtent,
            -halfExtent * pyramidAdjuster, halfExtent, -halfExtent * pyramidAdjuster,
            halfExtent * pyramidAdjuster, halfExtent, -halfExtent * pyramidAdjuster,

            // Top face.
            -halfExtent * pyramidAdjuster, halfExtent, halfExtent * pyramidAdjuster,
            halfExtent * pyramidAdjuster, halfExtent, halfExtent * pyramidAdjuster,
            halfExtent * pyramidAdjuster, halfExtent, -halfExtent * pyramidAdjuster,
            -halfExtent * pyramidAdjuster, halfExtent, -halfExtent * pyramidAdjuster,

            // Bottom face.
            halfExtent, -halfExtent, halfExtent,
            -halfExtent, -halfExtent, halfExtent,
            -halfExtent, -halfExtent, -halfExtent,
            halfExtent, -halfExtent, -halfExtent,

            // Left face.
            -halfExtent, -halfExtent, halfExtent,
            -halfExtent * pyramidAdjuster, halfExtent, halfExtent * pyramidAdjuster,
            -halfExtent * pyramidAdjuster, halfExtent, -halfExtent * pyramidAdjuster,
            -halfExtent, -halfExtent, -halfExtent,

            // Right face.
            halfExtent, -halfExtent, -halfExtent,
            halfExtent * pyramidAdjuster, halfExtent, -halfExtent * pyramidAdjuster,
            halfExtent * pyramidAdjuster, halfExtent, halfExtent * pyramidAdjuster,
            halfExtent, -halfExtent, halfExtent,
        ];

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        const colors = [];
        for (let i = 0; i < 72; ++i) {
            colors.push(...material.diffuseColor);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

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

        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

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

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        const vertexAttributeMap = new Map<AttributeName, MeshVertexAttribute>();

        const vertexPositionAttribute = {
            name: AttributeName.VertexPosition,
            buffer: positionBuffer,
            componentCount: 3,
            type: gl.FLOAT,
            normalized: false,
            stride: 0,
            offset: 0
        };

        vertexAttributeMap.set(AttributeName.VertexPosition, vertexPositionAttribute);

        const vertexColorAttribute = {
            name: AttributeName.VertexColor,
            buffer: colorBuffer,
            componentCount: 4,
            type: gl.FLOAT,
            normalized: false,
            stride: 0,
            offset: 0
        };

        vertexAttributeMap.set(AttributeName.VertexColor, vertexColorAttribute);

        const vertexNormalAttribute = {
            name: AttributeName.VertexNormal,
            buffer: normalBuffer,
            componentCount: 3,
            type: gl.FLOAT,
            normalized: false,
            stride: 0,
            offset: 0
        };

        vertexAttributeMap.set(AttributeName.VertexNormal, vertexNormalAttribute);

        return {
            vertexAttributeMap: vertexAttributeMap,
            indexBufferDescription: {
                buffer: elementBuffer,
                primitiveType: gl.TRIANGLES,
                vertexCount: 36,
                type: gl.UNSIGNED_SHORT,
                offset: 0
            }
        };
    }

    static loadSphere(gl: WebGL2RenderingContext,
        stacks: number,
        slices: number,
        material: Material = new MaterialBuilder().build()): Mesh {
        const positionBuffer = gl.createBuffer();
        const colorBuffer = gl.createBuffer();
        const normalBuffer = gl.createBuffer();
        const elementBuffer = gl.createBuffer();

        if (!(positionBuffer && elementBuffer && colorBuffer && normalBuffer)) {
            throw new Error("Unable to create buffer.");
        }

        const vertices = [];
        const indices = [];
        const normals = [];
        const colors = [];

        for (let stackIndex = 0; stackIndex <= stacks; ++stackIndex) {
            const stackAngle = stackIndex * Math.PI / stacks;
            const stackAngleSin = Math.sin(stackAngle);
            const stackAngleCos = Math.cos(stackAngle);

            for (let sliceIndex = 0; sliceIndex <= slices; ++sliceIndex) {
                const sliceAngle = sliceIndex * 2 * Math.PI / slices;
                const sliceAngleSin = Math.sin(sliceAngle);
                const sliceAngleCos = Math.cos(sliceAngle);

                const x = sliceAngleSin * stackAngleSin;
                const y = stackAngleCos;
                const z = sliceAngleCos * stackAngleSin;

                vertices.push(x, y, z);
                normals.push(x, y, z);
                colors.push(...material.diffuseColor);
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

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

        const vertexAttributeMap = new Map<AttributeName, MeshVertexAttribute>();

        const vertexPositionAttribute = {
            name: AttributeName.VertexPosition,
            buffer: positionBuffer,
            componentCount: 3,
            type: gl.FLOAT,
            normalized: false,
            stride: 0,
            offset: 0
        };

        vertexAttributeMap.set(AttributeName.VertexPosition, vertexPositionAttribute);

        const vertexColorAttribute = {
            name: AttributeName.VertexColor,
            buffer: colorBuffer,
            componentCount: 4,
            type: gl.FLOAT,
            normalized: false,
            stride: 0,
            offset: 0
        };

        vertexAttributeMap.set(AttributeName.VertexColor, vertexColorAttribute);

        const vertexNormalAttribute = {
            name: AttributeName.VertexNormal,
            buffer: normalBuffer,
            componentCount: 3,
            type: gl.FLOAT,
            normalized: false,
            stride: 0,
            offset: 0
        };

        vertexAttributeMap.set(AttributeName.VertexNormal, vertexNormalAttribute);

        return {
            vertexAttributeMap: vertexAttributeMap,
            indexBufferDescription: {
                buffer: elementBuffer,
                primitiveType: gl.TRIANGLES,
                vertexCount: indices.length,
                type: gl.UNSIGNED_SHORT,
                offset: 0
            }
        };
    }
}