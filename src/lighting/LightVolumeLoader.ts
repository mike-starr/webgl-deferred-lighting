import { vec3 } from "gl-matrix";
import DirectionalLightVolume from "./DirectionalLightVolume";
import MeshLoader from "../mesh/MeshLoader";
import PointLightVolume from "./PointLightVolume";

export default class LightVolumeLoader {

    static createDirectional(gl: WebGL2RenderingContext,
        color: vec3,
        direction: vec3,
        intensity: number,
        ambientIntensity: number,
        positionTexture: WebGLTexture,
        normalTexture: WebGLTexture,
        diffuseTexture: WebGLTexture): DirectionalLightVolume {

        vec3.normalize(direction, direction);

        return {
            textures: [positionTexture, normalTexture, diffuseTexture],
            color: color,
            direction: direction,
            intensity: intensity,
            ambientIntensity: ambientIntensity,
            mesh: MeshLoader.loadCube(gl, 0.5)
        }
    }

    static createPoint(gl: WebGL2RenderingContext,
        color: vec3,
        intensity: number,
        ambientIntensity: number,
        range: number,
        positionTexture: WebGLTexture,
        normalTexture: WebGLTexture,
        diffuseTexture: WebGLTexture): PointLightVolume {

        return {
            textures: [positionTexture, normalTexture, diffuseTexture],
            color: color,
            intensity: intensity,
            oneDivRangeSq: 1.0 / (range * range),
            ambientIntensity: ambientIntensity,
            mesh: MeshLoader.loadCube(gl, range)
        }
    }

}