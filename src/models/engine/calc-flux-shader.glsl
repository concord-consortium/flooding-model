uniform float dt;
uniform float cellSize;
uniform float dampingFactor;
uniform sampler2D cellProps;

const float GRAVITY = 9.81;
// PIPE_FACTOR can help with instabilities. Might need to be adjusted for different grid sizes and timesteps.
const float PIPE_FACTOR = 0.025;

float getNewFlux(float dt, float oldFlux, float heightDiff, float cellArea) {
  return max(0.0, oldFlux + GRAVITY * PIPE_FACTOR * cellArea * dt * heightDiff);
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

  float nFluxLeft = getNewFlux(dt, fluxLeft, (cellTerrainElev + cellWaterDepth) - (cellLeftTerrainElev + cellLeftWaterDepth), cellArea) * dampingFactor;
  float nFluxTop = getNewFlux(dt, fluxTop, (cellTerrainElev + cellWaterDepth) - (cellTopTerrainElev + cellTopWaterDepth), cellArea) * dampingFactor;
  float nFluxRight = getNewFlux(dt, fluxRight, (cellTerrainElev + cellWaterDepth) - (cellRightTerrainElev + cellRightWaterDepth), cellArea) * dampingFactor;
  float nFluxBottom = getNewFlux(dt, fluxBottom, (cellTerrainElev + cellWaterDepth) - (cellBottomTerrainElev + cellBottomWaterDepth), cellArea) * dampingFactor;

  // Scaling factor. Scale down outflow if it is more than available volume in the column.
  float currentVolume = cellWaterDepth * cellArea;
  float outVolume = (nFluxLeft + nFluxRight + nFluxTop + nFluxBottom) * dt;
  float k = outVolume > 0.0 ? min(1.0, currentVolume / outVolume) : 1.0;

  vec4 newFlux = vec4(k * nFluxLeft, k * nFluxTop, k * nFluxRight, k * nFluxBottom);

  gl_FragColor = newFlux;
}
