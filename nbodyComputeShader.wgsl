struct PlanetData {
  position: vec2f,
  velocity: vec2f,
  mass: f32,
}

@group(0) @binding(0) var<storage, read_write> currentState: array<PlanetData>;
@group(0) @binding(1) var<uniform> constants: vec3f;

@compute @workgroup_size(256, 1, 1)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>,
        @builtin(local_invocation_id) local_id: vec3<u32>) {
    let index = global_id.x;
    let numPlanets = u32(constants[0]);
    let MIN_DISTANCE = 0.01;
    
    if (index >= numPlanets) {
        return;
    }
    var planet = currentState[index];

    for (var i = 0u; i < numPlanets; i = i + 1) {
        if (i == index) {
            continue;
        }
        let otherPlanet = currentState[i];
        let delta = otherPlanet.position - planet.position;
        let distSqr = max(dot(delta, delta), MIN_DISTANCE * MIN_DISTANCE);
        let dist = sqrt(distSqr);
        let forceDir = delta / dist;
        let forceMagnitude = constants[1] * planet.mass * otherPlanet.mass / distSqr;
        let acceleration = forceDir * (forceMagnitude / planet.mass);
        planet.velocity += acceleration * constants[2];
    }

    // Euler integration
    planet.position += planet.velocity * constants[2];
    currentState[index] = planet;
}