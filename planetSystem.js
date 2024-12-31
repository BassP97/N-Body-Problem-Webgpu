export class PlanetSystem {
  static BUFFER_SIZE = 4 * 2 + 4 * 2 + 4 * 2;
  static POSITION_OFFSET = 0;
  static VELOCITY_OFFSET = 8;
  static MASS_OFFSET = 16;

  static WG_SIZE = 256;

  constructor(device) {
    this.device = device;
    this.gravity = document.getElementById("gravity").value;
    this.timeStep = document.getElementById("timeStep").value;
    this.numPlanets = document.getElementById("planetCount").value;
    this.bufferChanged = false;
    this.blackHoles = [];
  }

  async init() {
    this.constantsBuffer = this.device.createBuffer({
      size: 4 * 3, // number of planets, gravity, time step
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.buffer = this.createPlanetBuffer();
    this.initializePlanets();

    await this.createComputePipeline();
    return this;
  }

  createPlanetBuffer() {
    return this.device.createBuffer({
      label: "planet buffer",
      size: PlanetSystem.BUFFER_SIZE * this.numPlanets,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
    });
  }

  async createComputePipeline() {
    const shaderCode = await fetch("nbodyComputeShader.wgsl").then((r) =>
      r.text()
    );
    const module = this.device.createShaderModule({
      label: "nbody compute shader",
      code: shaderCode,
    });
    this.pipeline = await this.device.createComputePipeline({
      label: "nbody compute pipeline",
      layout: "auto",
      compute: {
        module,
        entryPoint: "main",
      },
    });
    this.device.queue.writeBuffer(
      this.constantsBuffer,
      0,
      new Float32Array([this.numPlanets])
    );

    this.device.queue.writeBuffer(
      this.constantsBuffer,
      4,
      new Float32Array([this.gravity])
    );

    this.device.queue.writeBuffer(
      this.constantsBuffer,
      4 * 2,
      new Float32Array([this.timeStep])
    );
    this.currentlySetGravity = this.gravity;
    this.currentlySetTimeStep = this.timeStep;
    this.currentlySetNumPlanets = this.numPlanets;
  }

  async computeNextPosition() {
    this.checkIfConstantsChanged();
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    //console.log("foo");
    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: this.buffer },
        },
        {
          binding: 1,
          resource: { buffer: this.constantsBuffer },
        },
      ],
    });
    //console.log("bar");

    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(
      Math.ceil(this.numPlanets / PlanetSystem.WG_SIZE),
      1,
      1
    );
    pass.end();

    this.device.queue.submit([encoder.finish()]);
  }

  checkIfConstantsChanged() {
    if (document.getElementById("planetCount").value != this.numPlanets) {
      this.initializePlanets();
    }
    if (document.getElementById("gravity").value != this.gravity) {
      this.gravity = document.getElementById("gravity").value;
      this.device.queue.writeBuffer(
        this.constantsBuffer,
        4,
        new Float32Array([this.gravity])
      );
      this.currentlySetGravity = this.gravity;
    }
    if (document.getElementById("timeStep").value != this.timeStep) {
      this.timeStep = document.getElementById("timeStep").value;
      this.device.queue.writeBuffer(
        this.constantsBuffer,
        4 * 2,
        new Float32Array([this.timeStep])
      );
      this.currentlySetTimeStep = this.timeStep;
    }
  }

  initializePlanets() {
    this.numPlanets = document.getElementById("planetCount").value;
    this.device.queue.writeBuffer(
      this.constantsBuffer,
      0,
      new Float32Array([this.numPlanets])
    );
    this.buffer = this.createPlanetBuffer();
    this.bufferChanged = true;

    for (let i = 0; i < this.numPlanets; i++) {
      const position = new Float32Array([
        Math.random() * 1.8 - 0.9,
        Math.random() * 1.8 - 0.9,
      ]);

      const velocity = new Float32Array([
        Math.random() * 0.1 - 0.005,
        Math.random() * 0.1 - 0.005,
      ]);

      const mass = new Float32Array([Math.abs(Math.random()) * 3]);

      this.device.queue.writeBuffer(
        this.buffer,
        i * PlanetSystem.BUFFER_SIZE + PlanetSystem.POSITION_OFFSET,
        position
      );
      this.device.queue.writeBuffer(
        this.buffer,
        i * PlanetSystem.BUFFER_SIZE + PlanetSystem.VELOCITY_OFFSET,
        velocity
      );
      this.device.queue.writeBuffer(
        this.buffer,
        i * PlanetSystem.BUFFER_SIZE + PlanetSystem.MASS_OFFSET,
        mass
      );
    }
  }

  updatePlanets() {
    this.computeNextPosition();
  }
}
