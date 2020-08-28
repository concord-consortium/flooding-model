varying vec4 vColor;

void main() {
	gl_FragColor = vColor;
	if (gl_FragColor.a < 0.01) discard;
}
