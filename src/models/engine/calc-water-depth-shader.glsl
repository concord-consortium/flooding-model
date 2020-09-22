uniform float waterSaturationIncrement;
uniform sampler2D cellProps;

void main() {
  vec2 cellSize = 1.0 / resolution.xy;

  vec2 uv = gl_FragCoord.xy * cellSize;

  vec4 waterDepth = texture2D(waterDepth, uv);
  vec4 cellProps = texture2D(cellProps, uv);

  // Get neighbours
  //  vec4 north = texture2D(heightmap, uv + vec2(0.0, cellSize.y));
  //  vec4 south = texture2D(heightmap, uv + vec2(0.0, - cellSize.y));
  //  vec4 east = texture2D(heightmap, uv + vec2(cellSize.x, 0.0));
  //  vec4 west = texture2D(heightmap, uv + vec2(- cellSize.x, 0.0));

  // https://web.archive.org/web/20080618181901/http://freespace.virgin.net/hugo.elias/graphics/x_water.htm

  float newWaterDepth = waterDepth.x + waterSaturationIncrement;

  gl_FragColor = vec4(newWaterDepth, 0, 0, 0);
}