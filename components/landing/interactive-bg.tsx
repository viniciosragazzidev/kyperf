"use client"

import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';
import { useEffect, useRef, useCallback } from 'react';

const vertexShader = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision mediump float;
varying vec2 vUv;
uniform float iTime;
uniform vec3 iResolution;
uniform vec2 uMouse;
uniform float uMouseStrength;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 4; ++i) {
    v += a * noise(p);
    p = rot * p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(iResolution.x / iResolution.y, 1.0);
  
  vec2 mouseDiff = (uv - uMouse) * aspect;
  float dist = length(mouseDiff);
  
  float force = exp(-dist * 5.0) * uMouseStrength;
  vec2 distortion = normalize(mouseDiff + 0.0001) * force * 0.25;
  
  vec2 p = uv * 2.5 - distortion * 3.0;
  
  float n1 = fbm(p + vec2(iTime * 0.04));
  float n2 = fbm(p - vec2(iTime * 0.02) + n1 * 1.5);
  float pattern = fbm(p + n2 * 1.2 + vec2(iTime * 0.015));
  
  // Brand colors: Graphite black, deep forest, and vibrant emerald green
  vec3 darkBase = vec3(0.04, 0.04, 0.045); 
  vec3 emeraldMid = vec3(0.008, 0.09, 0.06);  
  vec3 neonGreen = vec3(0.05, 0.65, 0.45);   
  
  vec3 col = mix(darkBase, emeraldMid, pattern);
  col = mix(col, neonGreen, force * pattern * 0.9);
  
  // Vignette
  col *= 0.75 + 0.25 * sin(uv.y * 3.14159) * sin(uv.x * 3.14159);
  
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function InteractiveBg() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const smoothMouseRef = useRef({ x: 0.5, y: 0.5 });
  const mouseStrengthRef = useRef(0.0);
  const rafRef = useRef(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const ctn = containerRef.current;
    if (!ctn) return;
    const rect = ctn.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    mouseRef.current = { x, y };
    
    // Boost strength temporarily on movement
    mouseStrengthRef.current = Math.min(mouseStrengthRef.current + 0.15, 1.0);
  }, []);

  useEffect(() => {
    const ctn = containerRef.current;
    if (!ctn) return;

    const renderer = new Renderer({ dpr: 1 });
    const gl = renderer.gl;
    gl.clearColor(0.04, 0.04, 0.045, 1);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height) },
        uMouse: { value: new Float32Array([0.5, 0.5]) },
        uMouseStrength: { value: 0.0 }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      if (!ctn || !renderer) return;
      renderer.setSize(ctn.offsetWidth, ctn.offsetHeight);
      program.uniforms.iResolution.value = new Color(
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height
      );
    }

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(ctn);
    resize();

    const update = (t: number) => {
      rafRef.current = requestAnimationFrame(update);

      const elapsed = t * 0.001;
      program.uniforms.iTime.value = elapsed;

      const dampingFactor = 0.06;
      const smoothMouse = smoothMouseRef.current;
      const mouse = mouseRef.current;
      smoothMouse.x += (mouse.x - smoothMouse.x) * dampingFactor;
      smoothMouse.y += (mouse.y - smoothMouse.y) * dampingFactor;

      // Decay strength
      mouseStrengthRef.current *= 0.97;

      const mouseUniform = program.uniforms.uMouse.value;
      mouseUniform[0] = smoothMouse.x;
      mouseUniform[1] = smoothMouse.y;
      program.uniforms.uMouseStrength.value = mouseStrengthRef.current;

      renderer.render({ scene: mesh });
    };

    rafRef.current = requestAnimationFrame(update);
    // Constrain canvas so it never overflows the container
    gl.canvas.style.cssText = "display:block;width:100%;height:100%;position:absolute;top:0;left:0;";
    ctn.appendChild(gl.canvas);

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      if (gl.canvas.parentElement === ctn) ctn.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [handleMouseMove]);

  return <div ref={containerRef} className="fixed inset-0 w-full h-full -z-10 bg-zinc-950 pointer-events-none" />;
}
