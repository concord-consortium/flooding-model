uniform vec3 color;
uniform sampler2D waterDepth;
varying vec4 vColor;

void main() {
	vec4 waterDepth = texture(waterDepth, uv);
	vColor = vec4(color, waterDepth.x);
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
