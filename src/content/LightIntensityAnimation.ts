import LightVolume from "../lighting/LightVolume";

export default class LightIntensityAnimation {

    private readonly startingWeight = Math.random();
    private readonly rate: number = 0.3;
    private minIntensity: number;
    private maxIntensity: number;
    private direction: number = 1.0;

    constructor(private readonly lightVolume: LightVolume, variance: number) {
        this.minIntensity = (1.0 - variance) * lightVolume.intensity;
        this.maxIntensity = lightVolume.intensity;
        lightVolume.intensity = this.minIntensity + (this.maxIntensity - this.minIntensity) * this.startingWeight;
    }

    update(stepMs: number): void {
        const step = this.direction * stepMs / 1000 * this.rate;
        this.lightVolume.intensity += step;

        if (this.lightVolume.intensity > this.maxIntensity) {
            this.lightVolume.intensity = this.maxIntensity;
            this.direction *= -1;
        }

        if (this.lightVolume.intensity < this.minIntensity) {
            this.lightVolume.intensity = this.minIntensity;
            this.direction *= -1;
        }
    }
}