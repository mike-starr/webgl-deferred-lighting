import { AttributeName } from "../engine/ShaderDescription";
import MeshVertexAttribute from "./MeshVertexAttribute";
import Mesh from "./Mesh";

export default class MeshLoader {

    loadCube(gl: WebGL2RenderingContext, halfExtent: number): Mesh {
        const positionBuffer = gl.createBuffer();
        const elementBuffer = gl.createBuffer();

        if (!(positionBuffer && elementBuffer)) {
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