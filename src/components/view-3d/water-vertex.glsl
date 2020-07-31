uniform vec3 color;
attribute float alpha;
varying vec4 vColor;

void main() {
	vColor = vec4(color, alpha);
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
