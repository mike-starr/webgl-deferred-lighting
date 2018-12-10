import SceneGraphNode from "../scenegraph/SceneGraphNode";
import SceneGraphGBufferNode from "../scenegraph/SceneGraphGBufferNode";

export default abstract class Scene {

    abstract get graphRoot() : SceneGraphNode;

    abstract initialize(gl: WebGL2RenderingContext): void;

    abstract update(elapsedMs: number): void;

    protected createGBufferNode(gl: WebGL2RenderingContext, children: SceneGraphNode[]): SceneGraphGBufferNode {
        const frameBuffer = gl.createFramebuffer();
        if (!frameBuffer) {
            throw new Error("Failed to create framebuffer.");
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

        const positionTarget = this.createRenderTargetTexture(gl, gl.RGBA32F);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, positionTarget, 0);

        const normalTarget = this.createRenderTargetTexture(gl, gl.RGBA32F);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, normalTarget, 0);

        const diffuseTarget = this.createRenderTargetTexture(gl, gl.RGBA8);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, diffuseTarget, 0);

        const depthTarget = this.createRenderTargetTexture(gl, gl.DEPTH_COMPONENT24);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTarget, 0);

        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2]);

        console.log(gl.checkFramebufferStatus(gl.FRAMEBUFFER));

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return new SceneGraphGBufferNode(frameBuffer,
            diffuseTarget,
            positionTarget,
            normalTarget,
            depthTarget,
            children);
    }

    protected createRenderTargetTexture(gl: WebGL2RenderingContext, format: GLenum): WebGLTexture {
        const texture = gl.createTexture();
        if (!texture) {
            throw new Error("Failed to create texture.");
        }

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texStorage2D(gl.TEXTURE_2D, 1, format, gl.drawingBufferWidth, gl.drawingBufferHeight);

        return texture;
    }

    protected createTestTexture(gl: WebGL2RenderingContext): WebGLTexture {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        if (!texture) {
            throw new Error("Unable to create texture.");
        }

        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([0, 0, 255, 255]);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
            width, height, border, srcFormat, srcType,
            pixel);

        return texture;
    }
}