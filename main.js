import { PlanetSystem } from "./planetSystem.js";
import { PlanetRenderer } from "./planetRenderer.js";
import { initWebGPU } from "./initWebGpu.js";

async function main() {
  try {
    const { device, context, presentationFormat } = await initWebGPU();

    const planetSystem = await new PlanetSystem(device).init();
    const renderer = await new PlanetRenderer(
      device,
      context,
      presentationFormat
    ).init(presentationFormat);

    window.addEventListener("resize", () => {
      renderer.resizeCanvas();
    });

    renderer.resizeCanvas();

    let bindGroup;

    function createBindGroup() {
      bindGroup = device.createBindGroup({
        label: "compute bind group",
        layout: renderer.pipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: { buffer: planetSystem.buffer },
          },
        ],
      });
    }

    createBindGroup();

    function animate() {
      if (planetSystem.bufferChanged) {
        createBindGroup();
        planetSystem.bufferChanged = false;
      }
      renderer.render(bindGroup, planetSystem.numPlanets);
      requestAnimationFrame(animate);
    }

    function updatePositions() {
      planetSystem.updatePlanets();
      setTimeout(updatePositions, 8);
    }

    animate();
    updatePositions();
  } catch (error) {
    alert(error.message);
  }
}

main();
