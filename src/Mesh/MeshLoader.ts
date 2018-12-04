import { AttributeName } from "../engine/ShaderDescription";
import MeshVertexAttribute from "./MeshVertexAttribute";
import Mesh from "./Mesh";

export default class MeshLoader {

    loadTexturedQuad(gl: WebGL2RenderingContext, left: number, right: number, bottom: number, top: number) {
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
                vertexCount: 6,
                type: gl.UNSIGNED_SHORT,
                offset: 0
            }
        };
    }

    loadCube(gl: WebGL2RenderingContext, halfExtent: number): Mesh {
        const positionBuffer = gl.createBuffer();
        const colorBuffer = gl.createBuffer();
        const elementBuffer = gl.createBuffer();

        if (!(positionBuffer && elementBuffer && colorBuffer)) {
            throw new Error("Unable to create buffer.");
        }

        const vertices = [
            -halfExtent, halfExtent, -halfExtent,
            halfExtent, halfExtent, -halfExtent,
            halfExtent, -halfExtent, -halfExtent,
            -halfExtent, -halfExtent, -halfExtent,
            -halfExtent, halfExtent, halfExtent,
            halfExtent, halfExtent, halfExtent,
            halfExtent, -halfExtent, halfExtent,
            -halfExtent, -halfExtent, halfExtent
        ];

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        const colors = [
            0.8, 0.0, 0.0,
            0.0, 0.8, 0.0,
            0.0, 0.0, 0.8,
            0.4, 0.4, 0.0,
            0.4, 0.0, 0.4,
            0.0, 0.4, 0.4,
            0.7, 0.7, 0.7,
            0.2, 0.2, 0.2,
        ];

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

        const indices = [
            // front face
            0, 3, 2,
            2, 1, 0,

            // back face
            4, 5, 6,
            6, 7, 4,

            // left face
            0, 4, 7,
            7, 3, 0,

            // right face
            1, 2, 6,
            6, 5, 1,

            // top face
            1, 5, 4,
            4, 0, 1,

            // bottom face
            3, 7, 6,
            6, 2, 3
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
            componentCount: 3,
            type: gl.FLOAT,
            normalized: false,
            stride: 0,
            offset: 0
        };

        vertexAttributeMap.set(AttributeName.VertexColor, vertexColorAttribute);

        return {
            vertexAttributeMap: vertexAttributeMap,
            indexBufferDescription: {
                buffer: elementBuffer,
                vertexCount: 36,
                type: gl.UNSIGNED_SHORT,
                offset: 0
            }
        };
    }
}