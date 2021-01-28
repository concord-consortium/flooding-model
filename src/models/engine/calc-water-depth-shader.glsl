uniform float waterSaturationIncrement;
uniform float cellSize;
uniform float riverStageIncreaseSpeed;
uniform float dt;
uniform float floodPermeabilityMult;
uniform float RiverStageHigh;
uniform sampler2D cellProps;

void main() {
  vec2 renderingCellSize = 1.0 / resolution.xy;
  vec2 uv = gl_FragCoord.xy * renderingCellSize;

  // .x => waterDepth
  // .y => waterSaturation
  vec4 waterOutput = texture2D(textureWaterOutput, uv);
  float waterDepth = waterOutput.x;
  float waterSaturation = waterOutput.y;
  // .x => isRiver
  // .y => terrainElevation
  // .z => initialWaterSaturation
  // .w => permeability
  vec4 cellProps = texture2D(cellProps, uv);
  float isRiver = cellProps.x;
  float terrainElevation = cellProps.y;
  float initialWaterSaturation = cellProps.z;
  float permeability = cellProps.w;

  // .x => flux left
  vec4 flux = texture2D(textureFlux, uv);
  float fluxLeft = flux.x;

  // flood-engine#removeWater
  bool flood = waterSaturationIncrement > 0.0;
  waterDepth -= permeability * dt * (flood ? floodPermeabilityMult : 1.0);
  waterDepth = max(0.0, waterDepth);

  // flood-engine#addWater
  if (waterSaturation <= 1.0) {
    float riverStageDiff = waterSaturationIncrement * dt * riverStageIncreaseSpeed;
    waterSaturation += riverStageDiff;
    waterSaturation = min(1.0 + 1e-6, waterSaturation);
    if (riverStageDiff < 0.0) {
      float finalRiverStage = min(initialWaterSaturation + 0.2, RiverStageHigh);
      waterSaturation = max(waterSaturation, finalRiverStage);
    }
  } else {
    // Only rivers can actually overflow above the surface level.
    if (isRiver == 1.0) {
      waterDepth = max(0.0, waterDepth + waterSaturationIncrement * dt);
    }
    if (waterDepth == 0.0) {
      // If we're here, it means that river has flooded, but not it's back to normal state (waterSaturationIncrement
      // is negative). Start decreasing waterSaturation value when waterDepth reaches 0.
      waterSaturation = 1.0;
    }
  }

  // flood-engine#updateWaterDepth
  // .x => flux left
  // .y => flux top
  // .z => flux right
  // .w => flux bottom
  float fluxInLeft = texture2D(textureFlux, uv + vec2(-renderingCellSize.x, 0.0)).z; // flux right from left neighbor
  float fluxInRight = texture2D(textureFlux, uv + vec2(renderingCellSize.x, 0.0)).x; // flux left from right neighbor
  float fluxInTop = texture2D(textureFlux, uv + vec2(0.0, renderingCellSize.y)).w; // flux bottom from top neighbor
  float fluxInBottom = texture2D(textureFlux, uv + vec2(0.0, -renderingCellSize.y)).y; // flux top from bottom neighbor
  
  float fluxIn = fluxInLeft + fluxInRight + fluxInTop + fluxInBottom;

  vec4 cellFlux = texture2D(textureFlux, uv);
  float fluxOut = cellFlux.x + cellFlux.y + cellFlux.z + cellFlux.w;
  waterDepth = max(0.0, waterDepth + (fluxIn - fluxOut) * dt / (cellSize * cellSize));

  gl_FragColor = vec4(waterDepth, waterSaturation, 0, 0);
}