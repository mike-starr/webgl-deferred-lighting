export default interface GBuffer {
    frameBuffer: WebGLFramebuffer,
    positionTexture: WebGLTexture;
    diffuseTexture: WebGLTexture;
    normalTexture: WebGLTexture;
    depthTexture: WebGLTexture;
    accumulationTexture: WebGLTexture;
}