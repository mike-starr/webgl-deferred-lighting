import LightVolume from "./LightVolume";
import { vec3 } from "gl-matrix";

export default interface DirectionalLightVolume extends LightVolume {
    direction: vec3;
}