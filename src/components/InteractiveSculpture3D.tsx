import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import sculpture1Img from '../assets/images/Sculpture1.png';

export const InteractiveSculpture3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 380;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 3.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Warm gallery lighting
    const ambientLight = new THREE.AmbientLight(0xfff3e0, 1.2);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffd59e, 4.5);
    spotLight.position.set(3, 4, 3.5);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.6;
    spotLight.castShadow = true;
    scene.add(spotLight);

    const fillLight = new THREE.DirectionalLight(0x90b0d0, 0.8);
    fillLight.position.set(-3, -1, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 1.5);
    rimLight.position.set(0, 2, -3);
    scene.add(rimLight);

    // Group for the 3D carved mask & museum stand
    const group = new THREE.Group();
    scene.add(group);

    // Museum dark bronze pedestal stand
    const baseGeo = new THREE.CylinderGeometry(0.55, 0.65, 0.12, 32);
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      metalness: 0.8,
      roughness: 0.35,
    });
    const baseMesh = new THREE.Mesh(baseGeo, metalMat);
    baseMesh.position.y = -1.25;
    group.add(baseMesh);

    const rodGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.1, 16);
    const rodMesh = new THREE.Mesh(rodGeo, metalMat);
    rodMesh.position.y = -0.7;
    group.add(rodMesh);

    // 3D curved mask mesh
    const maskWidth = 1.35;
    const maskHeight = 1.85;
    const maskGeo = new THREE.PlaneGeometry(maskWidth, maskHeight, 48, 48);

    // Bend the geometry to give it genuine sculpted depth
    const posAttr = maskGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      // Parabolic curve backward along edges
      const curvature = -(x * x) * 0.35 - (y * y) * 0.08;
      posAttr.setZ(i, curvature);
    }
    maskGeo.computeVertexNormals();

    const maskMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.72,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });

    const texLoader = new THREE.TextureLoader();
    texLoader.load(sculpture1Img, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      maskMat.map = texture;
      maskMat.needsUpdate = true;
    });

    const maskMesh = new THREE.Mesh(maskGeo, maskMat);
    maskMesh.position.y = 0.15;
    group.add(maskMesh);

    // Subtle floating animation and mouse interaction
    let targetRotY = 0;
    let targetRotX = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };

    container.addEventListener('mousemove', handleMouseMove);

    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Gentle continuous rotation plus mouse reactivity
      targetRotY = mouseX * 0.65 + Math.sin(elapsed * 0.6) * 0.2;
      targetRotX = -mouseY * 0.4 + Math.cos(elapsed * 0.5) * 0.05;

      group.rotation.y += (targetRotY - group.rotation.y) * 0.05;
      group.rotation.x += (targetRotX - group.rotation.x) * 0.05;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      maskGeo.dispose();
      maskMat.dispose();
      baseGeo.dispose();
      rodGeo.dispose();
      metalMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full h-[320px] sm:h-[380px] md:h-[420px] rounded-2xl bg-gradient-to-b from-[#1C1814] to-[#12100E] border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
    >
      {/* 3D Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-mono-tabular text-[#FBF9F5]">
        <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
        <span>3D Carved Mask Study · Wood 2016</span>
      </div>

      <div className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] text-[#D6CEBE] font-mono-tabular">
        {isHovered ? 'Move cursor to tilt in 3D' : 'Interactive 3D Object'}
      </div>
    </div>
  );
};
