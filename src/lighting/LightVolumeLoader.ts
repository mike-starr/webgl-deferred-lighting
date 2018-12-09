import { vec3 } from "gl-matrix";
import DirectionalLightVolume from "./DirectionalLightVolume";
import MeshLoader from "../mesh/MeshLoader";

export default class LightVolumeLoader {

    static createDirectional(gl: WebGL2RenderingContext,
        color: vec3,
        direction: vec3,
        intensity: number,
        ambientIntensity: number,
        positionTexture: WebGLTexture,
        normalTexture: WebGLTexture,
        diffuseTexture: WebGLTexture): DirectionalLightVolume {

        return {
            textures: [positionTexture, normalTexture, diffuseTexture],
            color: color,
            direction: direction,
            intensity: intensity,
            ambientIntensity: ambientIntensity,
            mesh: MeshLoader.loadCube(gl, 0.5)
        }
    }
}