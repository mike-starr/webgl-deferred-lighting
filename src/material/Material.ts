import { vec3 } from "gl-matrix";

export default interface Material {
    readonly diffuseColor: vec3;
    readonly emissiveColor: vec3;
    readonly specularIntensity: number;
    readonly specularPower: number;
}