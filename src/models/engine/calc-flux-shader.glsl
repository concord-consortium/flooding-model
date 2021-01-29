uniform float dt;
uniform float cellSize;
uniform float dampingFactor;
uniform sampler2D cellProps;

const float GRAVITY = 0.25;

float getNewFlux(float dt, float oldFlux, float heightDiff, float cellSize) {
  // original equation: max(0.0, pow(DAMPING_FACTOR, dt) * oldFlux + dt * A * GRAVITY * heightDiff / l)
  // where:
  // float A = cellSize * cellSize;
  // float l = cellSize;
  // so it can be reduced to:
  return max(0.0, oldFlux + dt * cellSize * GRAVITY * heightDiff);
}

void main() {
  vec2 renderingCellSize = 1.0 / resolution.xy;
  vec2 uv = gl_FragCoord.xy * renderingCellSize;

  float cellArea = cellSize * cellSize;

  vec4 flux = texture2D(textureFlux, uv); 
  float fluxLeft = flux.x;
  float fluxTop = flux.y;
  float fluxRight = flux.z;
  float fluxBottom = flux.w;

  // .x => isRiver
  // .y => terrainElevation
  // .z => initialWaterSaturation
  // .w => permeability
  float cellTerrainElev = texture2D(cellProps, uv).y; 
  float cellTopTerrainElev = texture2D(cellProps, uv + vec2(0.0, renderingCellSize.y)).y; 
  float cellBottomTerrainElev = texture2D(cellProps, uv + vec2(0.0, -renderingCellSize.y)).y;
  float cellRightTerrainElev = texture2D(cellProps, uv + vec2(renderingCellSize.x, 0.0)).y;
  float cellLeftTerrainElev = texture2D(cellProps, uv + vec2(-renderingCellSize.x, 0.0)).y;

  // .x => waterDepth
  // .y => waterSaturation
  float cellWaterDepth = texture2D(textureWaterOutput, uv).x; 
  float cellTopWaterDepth = texture2D(textureWaterOutput, uv + vec2(0.0, renderingCellSize.y)).x; 
  float cellBottomWaterDepth = texture2D(textureWaterOutput, uv + vec2(0.0, -renderingCellSize.y)).x;
  float cellRightWaterDepth = texture2D(textureWaterOutput, uv + vec2(renderingCellSize.x, 0.0)).x;
  float cellLeftWaterDepth = texture2D(textureWaterOutput, uv + vec2(-renderingCellSize.x, 0.0)).x;

  float nFluxLeft = getNewFlux(dt, fluxLeft, (cellTerrainElev + cellWaterDepth) - (cellLeftTerrainElev + cellLeftWaterDepth), cellSize);
  float nFluxTop = getNewFlux(dt, fluxTop, (cellTerrainElev + cellWaterDepth) - (cellTopTerrainElev + cellTopWaterDepth), cellSize);
  float nFluxRight = getNewFlux(dt, fluxRight, (cellTerrainElev + cellWaterDepth) - (cellRightTerrainElev + cellRightWaterDepth), cellSize);
  float nFluxBottom = getNewFlux(dt, fluxBottom, (cellTerrainElev + cellWaterDepth) - (cellBottomTerrainElev + cellBottomWaterDepth), cellSize);

  // Scaling factor. Scale down outflow if it is more than available volume in the column.
  float currentVolume = cellWaterDepth * cellArea;
  float outVolume = (nFluxLeft + nFluxRight + nFluxTop + nFluxBottom) * dt;
  float k = (outVolume > 0.0 ? min(1.0, currentVolume / outVolume) : 1.0) * dampingFactor;

  vec4 newFlux = vec4(k * nFluxLeft, k * nFluxTop, k * nFluxRight, k * nFluxBottom);

  // Boundary conditions, half-correct.
  // Also, it could be optimized. Probably we could create a boundary texture and multiply flux by it.
  if (gl_FragCoord.x <= 1.0) {
    newFlux = vec4(0.0, 0.0, 0.0, 0.0);
  }
  if (gl_FragCoord.y >= resolution.y - 1.0) {
    newFlux = vec4(0.0, 0.0, 0.0, 0.0);
  }
  if (gl_FragCoord.x >= resolution.x - 1.0) {
    newFlux = vec4(0.0, 0.0, 0.0, 0.0);
  }
  if (gl_FragCoord.y <= 1.0) {
    newFlux = vec4(0.0, 0.0, 0.0, 0.0);
  }

  gl_FragColor = newFlux;
}
