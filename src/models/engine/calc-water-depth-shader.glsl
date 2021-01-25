uniform float waterSaturationIncrement;
uniform float riverStageIncreaseSpeed;
uniform float dt;
uniform float floodPermeabilityMult;
uniform float RiverStageHigh;
uniform sampler2D cellProps;

void main() {
  vec2 cellSize = 1.0 / resolution.xy;

  vec2 uv = gl_FragCoord.xy * cellSize;

  // .x => waterDepth
  // .y => waterSaturation
  vec4 waterOutput = texture2D(waterOutput, uv);
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

  // Get neighbours
  //  vec4 north = texture2D(heightmap, uv + vec2(0.0, cellSize.y));
  //  vec4 south = texture2D(heightmap, uv + vec2(0.0, - cellSize.y));
  //  vec4 east = texture2D(heightmap, uv + vec2(cellSize.x, 0.0));
  //  vec4 west = texture2D(heightmap, uv + vec2(- cellSize.x, 0.0));

  // https://web.archive.org/web/20080618181901/http://freespace.virgin.net/hugo.elias/graphics/x_water.htm

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

  // Simplest version for testing:
  // waterDepth += waterSaturationIncrement;

  gl_FragColor = vec4(waterDepth, waterSaturation, 0, 0);
}