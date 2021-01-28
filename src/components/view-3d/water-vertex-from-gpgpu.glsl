uniform vec3 color;
uniform sampler2D waterDepth;
varying vec4 vColor;

const float MAX_OPACITY = 0.75;
// Water below this depth will have opacity between MAX_OPACITY and 0. It ensures that water appears and disappears smoothly.
const float MAX_OPACITY_WATER_DEPTH = 0.5; // m

void main() {
	float waterDepth = texture2D(waterDepth, uv).x;
	vColor = vec4(color, waterDepth > MAX_OPACITY_WATER_DEPTH ? MAX_OPACITY : (waterDepth / MAX_OPACITY_WATER_DEPTH) * MAX_OPACITY);
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
