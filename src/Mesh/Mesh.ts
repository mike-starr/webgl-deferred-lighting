import MeshVertexAttribute from "./MeshVertexAttribute";
import { AttributeName } from "../engine/ShaderDescription";
import MeshIndexBufferDescription from "./MeshIndexBufferDescription";

export default interface Mesh {
    vertexAttributeMap: Map<AttributeName, MeshVertexAttribute>,
    indexBufferDescription: MeshIndexBufferDescription
}