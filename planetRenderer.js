// SHAMELESSLY stolen from https://webgpufundamentals.org/webgpu/lessons/webgpu-timing.html
class RollingAverage {
  #total = 0;
  #samples = [];
  #cursor = 0;
  #numSamples;
  constructor(numSamples = 30) {
    this.#numSamples = numSamples;
  }
  addSample(v) {
    this.#total += v - (this.#samples[this.#cursor] || 0);
    this.#samples[this.#cursor] = v;
    this.#cursor = (this.#cursor + 1) % this.#numSamples;
  }
  get() {
    return this.#total / this.#samples.length;
  }
}

export class PlanetRenderer {
  constructor(device, context, presentationFormat) {
    this.device = device;
    this.context = context;
    this.renderPassDescriptor = this.createRenderPassDescriptor();
    this.fps = new RollingAverage();
    // multiply to get seconds
    this.lastTimestamp = performance.now() * 0.001;

    this.overlay = document.getElementById("overlay");
    this.overlay.width = this.context.canvas.width;
    this.overlay.height = this.context.canvas.height;
    this.overlayCtx = this.overlay.getContext("2d");
    this.overlayCtx.font = "16px monospace";
    this.overlayCtx.fillStyle = "white";
  }

  async init(presentationFormat) {
    this.pipeline = await this.createPipeline(presentationFormat);
    return this;
  }

  resizeCanvas() {
    const canvas = this.context.canvas;
    const overlay = this.overlay;

    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    canvas.width = displayWidth;
    canvas.height = displayHeight;
    overlay.width = displayWidth;
    overlay.height = displayHeight;
  }

  async createPipeline(presentationFormat) {
    const shaderCode = await fetch("nbodyRenderShader.wgsl").then((r) =>
      r.text()
    );
    const module = this.device.createShaderModule({
      label: "nbody render shader",
      code: shaderCode,
    });

    return this.device.createRenderPipeline({
      label: "planet renderer",
      layout: "auto",
      vertex: {
        module,
        entryPoint: "vs",
      },
      fragment: {
        module,
        entryPoint: "fs",
        targets: [{ format: presentationFormat }],
      },
    });
  }

  createRenderPassDescriptor() {
    return {
      label: "canvas renderPass",
      colorAttachments: [
        {
          clearValue: [0.3, 0.3, 0.3, 1],
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    };
  }

  render(bindGroup, numPlanets) {
    const currentTime = performance.now() * 0.001;
    const deltaTime = currentTime - this.lastTimestamp;
    this.lastTimestamp = currentTime;

    this.renderPassDescriptor.colorAttachments[0].view = this.context
      .getCurrentTexture()
      .createView();

    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass(this.renderPassDescriptor);

    pass.setBindGroup(0, bindGroup);
    pass.setPipeline(this.pipeline);
    pass.draw(6, numPlanets);
    pass.end();

    this.device.queue.submit([encoder.finish()]);
    if (deltaTime > 0) {
      this.fps.addSample(1 / deltaTime);
    }
    this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);

    this.overlayCtx.fillText(`FPS: ${this.fps.get().toFixed(1)}`, 10, 20);
  }
}
