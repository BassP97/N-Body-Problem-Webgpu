struct PlanetData {
  position: vec2f,
  velocity: vec2f,
  mass: f32,
}

@group(0) @binding(0) var<storage, read> planets: array<PlanetData>;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f, 
  @location(1) mass: f32,
}

@vertex fn vs(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> VertexOutput {
  let corners = array(
      vec2f(-1.0, -1.0),  // Bottom left
      vec2f( 1.0, -1.0),  // Bottom right
      vec2f(-1.0,  1.0),  // Top left
      vec2f( 1.0, -1.0),  // Bottom right
      vec2f( 1.0,  1.0),  // Top right
      vec2f(-1.0,  1.0),  // Top left
  );

  let planet = planets[instanceIndex];
  let size = 0.01;
  let pos = corners[vertexIndex] * size + planet.position;

  var output: VertexOutput;
  output.position = vec4f(pos, 0.0, 1.0);
  output.uv = corners[vertexIndex];
  output.mass = planet.mass;
  return output;
}

@fragment fn fs(input: VertexOutput) -> @location(0) vec4f {
  let dist = length(input.uv);

  if (dist > 1.0) {
    discard;
  }

  let color = vec3f(1.0, 0.7, 0.3) * input.mass;
  let intensity = 1.0 - dist;

  return vec4f(color * intensity, 1.0);
}