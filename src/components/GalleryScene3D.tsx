import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArtworkItem, REDDYMADE_ARTWORKS } from '../data/artworks';
import {
  createArtworkReliefMaps,
  createCoralPlasterTexture,
  createSunbeamFloorGobo,
  createTeakFloorTexture,
} from '../utils/textureGenerators';

export type LightingPreset = 'golden-hour' | 'equatorial-noon' | 'sunset-veranda' | 'nocturnal-spot';

interface GalleryScene3DProps {
  selectedArtwork: ArtworkItem | null;
  onSelectArtwork: (art: ArtworkItem | null) => void;
  lightingPreset: LightingPreset;
  rakingLightActive: boolean;
  reliefIntensity: number;
  guidedTourActive: boolean;
  onStopGuidedTour: () => void;
  onCameraMove?: (pos: { x: number; z: number; yaw: number }) => void;
  walkTargetCommand?: { position: [number, number, number]; target: [number, number, number]; timestamp: number } | null;
  mobileMoveVector?: { x: number; z: number } | null;
  mobileTurnDelta?: number;
}

export const GalleryScene3D: React.FC<GalleryScene3DProps> = ({
  selectedArtwork,
  onSelectArtwork,
  lightingPreset,
  rakingLightActive,
  reliefIntensity,
  guidedTourActive,
  onStopGuidedTour,
  onCameraMove,
  walkTargetCommand,
  mobileMoveVector,
  mobileTurnDelta,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglError, setWebglError] = useState(false);
  const [hoveredArtworkTitle, setHoveredArtworkTitle] = useState<string | null>(null);

  // Refs for mutable state inside requestAnimationFrame
  const selectedArtRef = useRef<ArtworkItem | null>(selectedArtwork);
  selectedArtRef.current = selectedArtwork;

  const mobileMoveRef = useRef(mobileMoveVector);
  mobileMoveRef.current = mobileMoveVector;

  const mobileTurnRef = useRef(mobileTurnDelta);
  mobileTurnRef.current = mobileTurnDelta;

  const rakingActiveRef = useRef<boolean>(rakingLightActive);
  rakingActiveRef.current = rakingLightActive;

  const reliefIntensityRef = useRef<number>(reliefIntensity);
  reliefIntensityRef.current = reliefIntensity;

  const guidedTourRef = useRef<boolean>(guidedTourActive);
  guidedTourRef.current = guidedTourActive;

  const lightingPresetRef = useRef<LightingPreset>(lightingPreset);
  lightingPresetRef.current = lightingPreset;

  const onSelectArtRef = useRef(onSelectArtwork);
  onSelectArtRef.current = onSelectArtwork;

  const onStopTourRef = useRef(onStopGuidedTour);
  onStopTourRef.current = onStopGuidedTour;

  const onCameraMoveRef = useRef(onCameraMove);
  onCameraMoveRef.current = onCameraMove;

  // Camera navigation state ref so external props can trigger smooth transitions
  const navRef = useRef({
    camPos: new THREE.Vector3(0, 1.75, 4.8),
    targetCamPos: new THREE.Vector3(0, 1.75, 4.8),
    lookAtPos: new THREE.Vector3(0, 2.1, -6),
    targetLookAtPos: new THREE.Vector3(0, 2.1, -6),
    isAutoMoving: false,
    yaw: 0,
    pitch: 0.04,
  });

  // React to selectedArtwork changes
  useEffect(() => {
    if (selectedArtwork) {
      navRef.current.targetCamPos.set(...selectedArtwork.viewPosition);
      navRef.current.targetLookAtPos.set(...selectedArtwork.viewTarget);
      navRef.current.isAutoMoving = true;

      const dx = selectedArtwork.viewTarget[0] - selectedArtwork.viewPosition[0];
      const dz = selectedArtwork.viewTarget[2] - selectedArtwork.viewPosition[2];
      navRef.current.yaw = Math.atan2(-dx, -dz);
      navRef.current.pitch = 0.08;
    }
  }, [selectedArtwork]);

  // React to explicit walkTargetCommand (e.g. clicking mini-map or "Reset Center View")
  useEffect(() => {
    if (walkTargetCommand) {
      navRef.current.targetCamPos.set(...walkTargetCommand.position);
      navRef.current.targetLookAtPos.set(...walkTargetCommand.target);
      navRef.current.isAutoMoving = true;

      const dx = walkTargetCommand.target[0] - walkTargetCommand.position[0];
      const dz = walkTargetCommand.target[2] - walkTargetCommand.position[2];
      navRef.current.yaw = Math.atan2(-dx, -dz);
      navRef.current.pitch = 0.03;
    }
  }, [walkTargetCommand]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError(true);
      return;
    }

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.domElement.style.touchAction = 'none';
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#87CEEB');
    scene.fog = new THREE.FogExp2('#E6DEC8', 0.014);

    const camera = new THREE.PerspectiveCamera(
      58,
      container.clientWidth / container.clientHeight,
      0.1,
      140
    );
    camera.position.copy(navRef.current.camPos);

    // =========================================================================
    // 1. ARCHITECTURAL PAVILION (Creole-Contemporary Seychelles Gallery)
    // =========================================================================
    const { map: floorMap, bumpMap: floorBump } = createTeakFloorTexture();
    const plasterTex = createCoralPlasterTexture();
    const sunGoboTex = createSunbeamFloorGobo();

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorMap,
      bumpMap: floorBump,
      bumpScale: 0.015,
      roughness: 0.34,
      metalness: 0.05,
    });

    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    floorMesh.name = 'gallery-floor';
    scene.add(floorMesh);

    // Floor walk target indicator ring
    const ringGeo = new THREE.RingGeometry(0.22, 0.3, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
    });
    const floorTargetRing = new THREE.Mesh(ringGeo, ringMat);
    floorTargetRing.position.set(0, 0.02, 0);
    scene.add(floorTargetRing);

    const wallMat = new THREE.MeshStandardMaterial({
      map: plasterTex,
      roughness: 0.82,
      metalness: 0.02,
    });

    const darkTeakMat = new THREE.MeshStandardMaterial({
      color: 0x3b2618,
      roughness: 0.48,
      metalness: 0.05,
    });

    // North Wall (-Z = -9)
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(18.4, 5.4, 0.35), wallMat);
    northWall.position.set(0, 2.7, -9.05);
    northWall.receiveShadow = true;
    northWall.castShadow = true;
    scene.add(northWall);

    // West Wall (-X = -9)
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.35, 5.4, 18.4), wallMat);
    westWall.position.set(-9.05, 2.7, 0);
    westWall.receiveShadow = true;
    westWall.castShadow = true;
    scene.add(westWall);

    // East Wall (+X = +9) with high clerestory louvered sun windows
    const eastWallLower = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.1, 18.4), wallMat);
    eastWallLower.position.set(9.05, 2.05, 0);
    eastWallLower.receiveShadow = true;
    eastWallLower.castShadow = true;
    scene.add(eastWallLower);

    // East Clerestory Louvered Window Frame (where morning/golden sun beams enter!)
    for (let z = -7.5; z <= 7.5; z += 3.0) {
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.3, 0.18), darkTeakMat);
      mullion.position.set(9.05, 4.75, z);
      scene.add(mullion);
    }
    // Horizontal louver slats in the East Clerestory
    for (let y = 4.25; y <= 5.25; y += 0.22) {
      const louver = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 18.0), darkTeakMat);
      louver.position.set(9.05, y, 0);
      louver.rotation.z = 0.35;
      scene.add(louver);
    }

    // South Open Ocean Veranda Colonade (+Z = +9) with tall louvered window bays
    const verandaPillarPositions = [-8.8, -5.2, -1.8, 1.8, 5.2, 8.8];
    verandaPillarPositions.forEach((px) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 5.4, 0.42), darkTeakMat);
      pillar.position.set(px, 2.7, 8.95);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);
    });

    // Louvered transom & side shutters on the South Ocean Veranda
    const southTopBeam = new THREE.Mesh(new THREE.BoxGeometry(18.4, 0.65, 0.45), darkTeakMat);
    southTopBeam.position.set(0, 5.1, 8.95);
    scene.add(southTopBeam);

    // Slatted tropical jalousie shutters in outer bays (-8.8 to -5.2 and 5.2 to 8.8)
    [-7.0, 7.0].forEach((bayX) => {
      const lowWall = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.9, 0.32), wallMat);
      lowWall.position.set(bayX, 0.45, 8.95);
      scene.add(lowWall);

      for (let ly = 1.15; ly <= 4.55; ly += 0.24) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.045, 0.22), darkTeakMat);
        slat.position.set(bayX, ly, 8.95);
        slat.rotation.x = 0.42;
        scene.add(slat);
      }
    });

    // Timber Skirting Boards
    const northSkirt = new THREE.Mesh(new THREE.BoxGeometry(18.0, 0.14, 0.06), darkTeakMat);
    northSkirt.position.set(0, 0.07, -8.85);
    scene.add(northSkirt);

    const westSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 18.0), darkTeakMat);
    westSkirt.position.set(-8.85, 0.07, 0);
    scene.add(westSkirt);

    const eastSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 18.0), darkTeakMat);
    eastSkirt.position.set(8.85, 0.07, 0);
    scene.add(eastSkirt);

    // Creole Timber Trusses & Coffered Skylight Ceiling
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0xf7f3eb,
      roughness: 0.9,
    });
    // Perimeter ceiling slabs leaving a central skylight louver strip
    const ceilLeft = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.25, 18.4), ceilingMat);
    ceilLeft.position.set(-5.8, 5.45, 0);
    scene.add(ceilLeft);

    const ceilRight = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.25, 18.4), ceilingMat);
    ceilRight.position.set(5.8, 5.45, 0);
    scene.add(ceilRight);

    // Exposed Takamaka Roof Beams across the pavilion
    for (let z = -7.2; z <= 7.2; z += 2.4) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(18.2, 0.24, 0.18), darkTeakMat);
      beam.position.set(0, 5.25, z);
      beam.castShadow = true;
      scene.add(beam);
    }

    // =========================================================================
    // 2. SEYCHELLES EXTERIOR SCENERY (Turquoise Cove, Granite Boulders, Palms)
    // =========================================================================
    // Veranda wooden deck outside South entrance
    const verandaDeck = new THREE.Mesh(new THREE.PlaneGeometry(24, 6), floorMat);
    verandaDeck.rotation.x = -Math.PI / 2;
    verandaDeck.position.set(0, -0.02, 12.0);
    scene.add(verandaDeck);

    // White Coral Sand Beach
    const sandMat = new THREE.MeshStandardMaterial({
      color: 0xf6ead4,
      roughness: 0.92,
    });
    const beachMesh = new THREE.Mesh(new THREE.PlaneGeometry(120, 22), sandMat);
    beachMesh.rotation.x = -Math.PI / 2;
    beachMesh.position.set(0, -0.15, 22);
    scene.add(beachMesh);

    // Turquoise Indian Ocean Lagoon
    const oceanMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      roughness: 0.18,
      metalness: 0.1,
      transmission: 0.35,
      clearcoat: 0.85,
    });
    const oceanMesh = new THREE.Mesh(new THREE.PlaneGeometry(200, 120, 48, 48), oceanMat);
    oceanMesh.rotation.x = -Math.PI / 2;
    oceanMesh.position.set(0, -0.35, 72);
    scene.add(oceanMesh);

    // Sculpted Seychelles Pink-Ochre Granite Boulders along the shore & inside central plinth
    const graniteMat = new THREE.MeshStandardMaterial({
      color: 0xb86b43,
      roughness: 0.68,
      metalness: 0.04,
      flatShading: true,
    });

    const boulderConfigs = [
      { pos: [-11, 1.2, 16], scale: [3.2, 2.4, 2.8], rot: 0.4 },
      { pos: [-7.5, 0.7, 18.5], scale: [2.1, 1.4, 1.9], rot: 1.2 },
      { pos: [9.5, 1.6, 17], scale: [3.8, 2.9, 3.1], rot: -0.7 },
      { pos: [13.5, 0.9, 20], scale: [2.5, 1.8, 2.4], rot: 2.1 },
      { pos: [-16, 2.2, 26], scale: [5.2, 3.8, 4.4], rot: 0.9 },
      { pos: [18, 2.5, 29], scale: [6.0, 4.2, 5.0], rot: -1.1 },
    ];
    boulderConfigs.forEach((b) => {
      const geo = new THREE.DodecahedronGeometry(1, 1);
      const mesh = new THREE.Mesh(geo, graniteMat);
      mesh.position.set(b.pos[0], b.pos[1], b.pos[2]);
      mesh.scale.set(b.scale[0], b.scale[1], b.scale[2]);
      mesh.rotation.y = b.rot;
      scene.add(mesh);
    });

    // Animated Swaying Coconut Palm Trees outside the windows & veranda
    const palmCrowns: THREE.Group[] = [];
    const palmTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x6e5036,
      roughness: 0.88,
    });
    const palmFrondMat = new THREE.MeshStandardMaterial({
      color: 0x2d6a3e,
      roughness: 0.55,
      side: THREE.DoubleSide,
    });

    const createPalmTree = (x: number, z: number, height: number, leanX: number) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(x, -0.1, z);

      // Segmented curved trunk
      const segments = 7;
      for (let i = 0; i < segments; i++) {
        const t = i / segments;
        const rBottom = 0.22 * (1 - t * 0.45);
        const rTop = 0.22 * (1 - (t + 1 / segments) * 0.45);
        const segGeo = new THREE.CylinderGeometry(rTop, rBottom, height / segments, 8);
        const segMesh = new THREE.Mesh(segGeo, palmTrunkMat);
        segMesh.position.set(
          leanX * t * t,
          (i + 0.5) * (height / segments),
          Math.sin(t * 1.5) * 0.35
        );
        segMesh.rotation.z = -leanX * 0.08 * t;
        treeGroup.add(segMesh);
      }

      // Crown of fronds that will sway with the wind
      const crown = new THREE.Group();
      crown.position.set(leanX, height, Math.sin(1.5) * 0.35);

      const numFronds = 9;
      for (let f = 0; f < numFronds; f++) {
        const angle = (f / numFronds) * Math.PI * 2;
        const frondGroup = new THREE.Group();
        frondGroup.rotation.y = angle;

        const frondGeo = new THREE.PlaneGeometry(0.65, 2.8, 2, 6);
        // Curve the frond downward
        const posAttr = frondGeo.attributes.position;
        for (let vi = 0; vi < posAttr.count; vi++) {
          const vy = posAttr.getY(vi);
          const normY = (vy + 1.4) / 2.8; // 0 to 1
          posAttr.setZ(vi, -Math.pow(normY, 2) * 0.85);
        }
        frondGeo.computeVertexNormals();

        const frondMesh = new THREE.Mesh(frondGeo, palmFrondMat);
        frondMesh.position.set(0, 0.2, 1.35);
        frondMesh.rotation.x = Math.PI / 2 - 0.32;
        frondGroup.add(frondMesh);
        crown.add(frondGroup);
      }

      // Golden coconuts cluster under crown
      const cocoMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.4,
      });
      for (let c = 0; c < 5; c++) {
        const coco = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), cocoMat);
        const ca = (c / 5) * Math.PI * 2;
        coco.position.set(Math.cos(ca) * 0.2, -0.15, Math.sin(ca) * 0.2);
        crown.add(coco);
      }

      treeGroup.add(crown);
      palmCrowns.push(crown);
      scene.add(treeGroup);
    };

    createPalmTree(-6.5, 13.5, 6.2, 0.8);
    createPalmTree(6.8, 14.2, 6.8, -0.9);
    createPalmTree(-3.2, 17.0, 7.4, 0.5);
    createPalmTree(11.2, 12.0, 5.8, -0.6);

    // =========================================================================
    // 3. CENTRAL GALLERY BENCH, GRANITE SCULPTURE PLINTH & POTTED PALMS
    // =========================================================================
    const travertineMat = new THREE.MeshStandardMaterial({
      color: 0xe6dfd3,
      roughness: 0.65,
    });

    // Central Sculptural Plinth
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.92, 1.6), travertineMat);
    plinth.position.set(0, 0.46, -1.2);
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    scene.add(plinth);

    // Beveled plinth top cap
    const plinthCap = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 1.7), darkTeakMat);
    plinthCap.position.set(0, 0.94, -1.2);
    plinthCap.castShadow = true;
    plinthCap.receiveShadow = true;
    scene.add(plinthCap);

    // Justin Reddy's Authentic Carved Sculptural Centerpiece (Floating & Rotating, replacing orange orb)
    const sculptureGroup = new THREE.Group();
    sculptureGroup.position.set(0, 1.88, -1.2);

    const sculptureTex = new THREE.TextureLoader().load('/assets/artworks/centerpiece-sculpture.png');
    sculptureTex.colorSpace = THREE.SRGBColorSpace;
    sculptureTex.minFilter = THREE.LinearMipmapLinearFilter;

    const sculptureMat = new THREE.MeshStandardMaterial({
      map: sculptureTex,
      transparent: true,
      alphaTest: 0.05,
      side: THREE.DoubleSide,
      roughness: 0.65,
      metalness: 0.04,
    });

    // Dimensions: extracted image aspect ratio 473 / 1193 ~ 0.396
    const scHeight = 1.72;
    const scWidth = scHeight * (473 / 1193); // ~ 0.68m
    const scGeo = new THREE.PlaneGeometry(scWidth, scHeight);

    // Dual-plane cross for rich 3D volumetric presence from every perspective
    const scPlaneA = new THREE.Mesh(scGeo, sculptureMat);
    scPlaneA.castShadow = true;
    scPlaneA.receiveShadow = true;
    sculptureGroup.add(scPlaneA);

    const scPlaneB = new THREE.Mesh(scGeo, sculptureMat);
    scPlaneB.rotation.y = Math.PI / 2;
    scPlaneB.castShadow = true;
    scPlaneB.receiveShadow = true;
    sculptureGroup.add(scPlaneB);

    // Warm museum spotlight focusing down on the sculpture centerpiece
    const sculptureSpot = new THREE.SpotLight(0xfff5e6, 3.0, 9.0, Math.PI / 5, 0.35, 1.2);
    sculptureSpot.position.set(0, 5.2, -1.2);
    sculptureSpot.target.position.set(0, 1.88, -1.2);
    sculptureSpot.castShadow = true;
    scene.add(sculptureSpot);
    scene.add(sculptureSpot.target);

    scene.add(sculptureGroup);

    // Two Takamaka Wood Museum Benches for visitors
    const createBench = (bx: number, bz: number) => {
      const benchGroup = new THREE.Group();
      benchGroup.position.set(bx, 0, bz);

      const seat = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.09, 0.75), darkTeakMat);
      seat.position.set(0, 0.46, 0);
      seat.castShadow = true;
      seat.receiveShadow = true;
      benchGroup.add(seat);

      [-1.05, 1.05].forEach((lx) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.44, 0.68), travertineMat);
        leg.position.set(lx, 0.22, 0);
        leg.castShadow = true;
        benchGroup.add(leg);
      });

      scene.add(benchGroup);
    };
    createBench(-2.8, 2.2);
    createBench(2.8, 2.2);

    // =========================================================================
    // 4. VOLUMETRIC SUNBEAMS FROM WINDOWS & FLOOR LIGHT PATCHES
    // =========================================================================
    const sunbeamGroup = new THREE.Group();
    const sunbeamMat = new THREE.MeshBasicMaterial({
      color: 0xffe4a0,
      transparent: true,
      opacity: 0.09,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // Sunbeams streaming from East Clerestory Windows and South Veranda Louvers
    const beamZPositions = [-4.5, 0.0, 4.5];
    beamZPositions.forEach((bz) => {
      const coneGeo = new THREE.CylinderGeometry(0.45, 1.85, 8.8, 20, 1, true);
      const beamMesh = new THREE.Mesh(coneGeo, sunbeamMat);
      beamMesh.position.set(5.4, 2.55, bz);
      beamMesh.rotation.z = 0.68;
      sunbeamGroup.add(beamMesh);

      // Louvered sunlight projection patch on the hardwood floor
      const goboPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(3.4, 2.6),
        new THREE.MeshBasicMaterial({
          map: sunGoboTex,
          transparent: true,
          opacity: 0.42,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      goboPlane.rotation.x = -Math.PI / 2;
      goboPlane.position.set(2.8, 0.015, bz);
      sunbeamGroup.add(goboPlane);
    });

    // South Veranda Sunbeams streaming inward
    [-6.6, 6.6].forEach((bx) => {
      const southBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 1.65, 6.5, 20, 1, true),
        sunbeamMat
      );
      southBeam.position.set(bx, 2.2, 6.2);
      southBeam.rotation.x = -0.58;
      sunbeamGroup.add(southBeam);
    });

    scene.add(sunbeamGroup);

    // Floating Golden Dust Motes dancing in the sunbeams
    const particleCount = 260;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 16;
      particlePositions[i * 3 + 1] = 0.4 + Math.random() * 4.5;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffe8a3,
      size: 0.045,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const dustParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(dustParticles);

    // =========================================================================
    // 5. GALLERY LIGHTING SYSTEM & RAKING TEXTURE INSPECTOR LIGHT
    // =========================================================================
    const hemiLight = new THREE.HemisphereLight(0xfff5e4, 0x7c5a3f, 0.85);
    scene.add(hemiLight);

    const sunDirLight = new THREE.DirectionalLight(0xffdfa8, 1.65);
    sunDirLight.position.set(14, 11, 12);
    sunDirLight.castShadow = true;
    sunDirLight.shadow.mapSize.width = 2048;
    sunDirLight.shadow.mapSize.height = 2048;
    sunDirLight.shadow.camera.near = 1;
    sunDirLight.shadow.camera.far = 45;
    const d = 12;
    sunDirLight.shadow.camera.left = -d;
    sunDirLight.shadow.camera.right = d;
    sunDirLight.shadow.camera.top = d;
    sunDirLight.shadow.camera.bottom = -d;
    sunDirLight.shadow.bias = -0.0005;
    scene.add(sunDirLight);

    // Interactive Raking Light that glides across the surface of artworks to reveal 3D texture
    const rakingLight = new THREE.PointLight(0xffdca8, 2.4, 4.5, 1.5);
    rakingLight.position.set(0, 2.35, 0);
    scene.add(rakingLight);

    // Subtle visual orb for the raking light when active
    const rakingOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfff3c4 })
    );
    rakingLight.add(rakingOrb);

    // =========================================================================
    // 6. MOUNT JUSTIN REDDY'S 8 ARTWORKS WITH 3D RELIEF & SPOTLIGHTS
    // =========================================================================
    const interactableArtMeshes: THREE.Mesh[] = [];
    const artworkMaterials: { art: ArtworkItem; mat: THREE.MeshStandardMaterial }[] = [];
    const trackSpotlights: THREE.SpotLight[] = [];

    const frameOuterMat = new THREE.MeshStandardMaterial({
      color: 0x26180f,
      roughness: 0.42,
      metalness: 0.08,
    });
    const matboardMat = new THREE.MeshStandardMaterial({
      color: 0xf7f3e9,
      roughness: 0.9,
    });
    const brassPlaqueMat = new THREE.MeshStandardMaterial({
      color: 0xc59b27,
      roughness: 0.3,
      metalness: 0.8,
    });

    const pavilionArtworks = REDDYMADE_ARTWORKS.filter((art) => art.inPavilion === true);

    pavilionArtworks.forEach((art) => {
      const artGroup = new THREE.Group();
      artGroup.position.set(...art.position);
      artGroup.rotation.y = art.rotationY;

      const fw = art.frameWidth;
      const fh = art.frameHeight;

      // Outer sculpted hardwood frame
      const frameBacking = new THREE.Mesh(
        new THREE.BoxGeometry(fw + 0.16, fh + 0.16, 0.07),
        frameOuterMat
      );
      frameBacking.castShadow = true;
      frameBacking.receiveShadow = true;
      artGroup.add(frameBacking);

      // Archival museum matboard bevel (wider for charcoal drawings, slim floating liner for impasto canvas)
      const matMargin = art.surfaceType === 'charcoal-paper' ? 0.12 : 0.04;
      const matBacking = new THREE.Mesh(
        new THREE.BoxGeometry(fw + 0.04, fh + 0.04, 0.085),
        matboardMat
      );
      artGroup.add(matBacking);

      // Artwork Canvas / Archival Paper Plane with PBR Normal + Roughness Maps
      const canvasGeo = new THREE.PlaneGeometry(fw - matMargin, fh - matMargin, 32, 32);
      const canvasMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: art.roughness,
        metalness: 0.04,
        normalScale: new THREE.Vector2(art.bumpScale * 18, art.bumpScale * 18),
      });

      // Load image without crossOrigin='anonymous' so same-origin proxy cookies are sent (avoids 401 in preview iframe)
      const img = new Image();
      img.onload = () => {
        const colorTex = new THREE.Texture(img);
        colorTex.colorSpace = THREE.SRGBColorSpace;
        colorTex.needsUpdate = true;

        try {
          const { normalMap, roughnessMap } = createArtworkReliefMaps(img, art.surfaceType);
          canvasMat.normalMap = normalMap;
          canvasMat.roughnessMap = roughnessMap;
        } catch {
          // Ignore canvas readback error if any
        }
        canvasMat.map = colorTex;
        canvasMat.needsUpdate = true;
      };
      img.src = art.imageUrl;

      const artMesh = new THREE.Mesh(canvasGeo, canvasMat);
      artMesh.position.set(0, 0, 0.046);
      artMesh.userData = { artwork: art };
      artGroup.add(artMesh);

      interactableArtMeshes.push(artMesh);
      artworkMaterials.push({ art, mat: canvasMat });

      // Curatorial Wall Label Plaque beside each artwork
      const plaqueMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.18, 0.015),
        brassPlaqueMat
      );
      plaqueMesh.position.set(fw / 2 + 0.28, -fh / 2 + 0.15, 0.01);
      artGroup.add(plaqueMesh);

      scene.add(artGroup);

      // Dedicated Overhead Museum Track Spotlight aimed at each piece to highlight textures
      const normalDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        art.rotationY
      );
      const spotPos = new THREE.Vector3(...art.position)
        .addScaledVector(normalDir, 2.25)
        .add(new THREE.Vector3(0, 2.25, 0));

      const spotLight = new THREE.SpotLight(0xfff0d4, 2.8, 9.5, Math.PI / 5.2, 0.55, 1.2);
      spotLight.position.copy(spotPos);
      spotLight.target.position.set(...art.position);
      scene.add(spotLight);
      scene.add(spotLight.target);
      trackSpotlights.push(spotLight);

      // Physical track fixture cylinder on ceiling
      const fixture = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.06, 0.22, 12),
        darkTeakMat
      );
      fixture.position.copy(spotPos).add(new THREE.Vector3(0, 0.35, 0));
      scene.add(fixture);
    });

    // =========================================================================
    // 7. INTERACTION: KEYBOARD WALK, MOUSE LOOK, RAYCAST CLICK & RAKING LIGHT
    // =========================================================================
    const keysPressed: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysPressed[k] = true;
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        navRef.current.isAutoMoving = false;
        if (guidedTourRef.current) {
          onStopTourRef.current();
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let isPointerDown = false;
    let pointerDownPos = { x: 0, y: 0 };
    let prevPointerPos = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();

    const handlePointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      pointerDownPos = { x: e.clientX, y: e.clientY };
      prevPointerPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isPointerDown) {
        const dx = e.clientX - prevPointerPos.x;
        const dy = e.clientY - prevPointerPos.y;
        prevPointerPos = { x: e.clientX, y: e.clientY };

        navRef.current.isAutoMoving = false;
        navRef.current.yaw += dx * 0.0045;
        navRef.current.pitch = Math.max(
          -0.55,
          Math.min(0.65, navRef.current.pitch + dy * 0.0035)
        );
        return;
      }

      // Hover raycast for artworks + raking light positioning
      raycaster.setFromCamera(pointerNDC, camera);
      const artHits = raycaster.intersectObjects(interactableArtMeshes, false);
      if (artHits.length > 0) {
        const hitArt = artHits[0].object.userData.artwork as ArtworkItem;
        setHoveredArtworkTitle(hitArt.title);
        renderer.domElement.style.cursor = 'pointer';

        // Move the raking light across the canvas at the exact intersection point!
        const hitPoint = artHits[0].point;
        const normal = new THREE.Vector3(0, 0, 1).applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          hitArt.rotationY
        );
        rakingLight.position.copy(hitPoint).addScaledVector(normal, 0.42);
      } else {
        setHoveredArtworkTitle(null);
        renderer.domElement.style.cursor = 'grab';
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isPointerDown) return;
      isPointerDown = false;

      const moveDist = Math.hypot(
        e.clientX - pointerDownPos.x,
        e.clientY - pointerDownPos.y
      );
      // Treat as a click if pointer barely dragged (up to 14px for comfortable touch screens)
      if (moveDist < 14) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointerNDC, camera);

        // 1. Check if user clicked an artwork
        const artHits = raycaster.intersectObjects(interactableArtMeshes, false);
        if (artHits.length > 0) {
          const clickedArt = artHits[0].object.userData.artwork as ArtworkItem;
          onSelectArtRef.current(clickedArt);
          return;
        }

        // 2. Check if user clicked the gallery floor to walk there
        const floorHits = raycaster.intersectObject(floorMesh, false);
        if (floorHits.length > 0) {
          const pt = floorHits[0].point;
          const clampedX = Math.max(-7.4, Math.min(7.4, pt.x));
          const clampedZ = Math.max(-7.4, Math.min(7.8, pt.z));

          floorTargetRing.position.set(clampedX, 0.02, clampedZ);
          ringMat.opacity = 0.85;

          const forward = new THREE.Vector3(
            -Math.sin(navRef.current.yaw),
            0,
            -Math.cos(navRef.current.yaw)
          );
          navRef.current.targetCamPos.set(clampedX, 1.75, clampedZ);
          navRef.current.targetLookAtPos
            .copy(navRef.current.targetCamPos)
            .addScaledVector(forward, 4.0);
          navRef.current.isAutoMoving = true;
          onSelectArtRef.current(null);
        }
      }
    };

    // Mobile Pinch-to-Zoom Gesture (Step closer or further along line of sight)
    let initialPinchDist = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDist > 0) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = currentDist - initialPinchDist;
        if (Math.abs(diff) > 4) {
          const forward = new THREE.Vector3(
            -Math.sin(navRef.current.yaw),
            0,
            -Math.cos(navRef.current.yaw)
          );
          navRef.current.camPos.addScaledVector(forward, diff * 0.008);
          navRef.current.camPos.x = Math.max(-7.5, Math.min(7.5, navRef.current.camPos.x));
          navRef.current.camPos.z = Math.max(-7.5, Math.min(8.2, navRef.current.camPos.z));
          navRef.current.targetCamPos.copy(navRef.current.camPos);
          navRef.current.isAutoMoving = false;
          initialPinchDist = currentDist;
        }
      }
    };

    const handleTouchEnd = () => {
      initialPinchDist = 0;
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    renderer.domElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    renderer.domElement.addEventListener('touchmove', handleTouchMove, { passive: true });
    renderer.domElement.addEventListener('touchend', handleTouchEnd, { passive: true });

    // =========================================================================
    // 8. ANIMATION LOOP (Wind Sway, Sunbeams, Lighting Presets, Smooth Camera)
    // =========================================================================
    let animId = 0;
    const clock = new THREE.Clock();
    let tourTimer = 0;
    let tourIndex = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // A. Update Lighting Preset smoothly
      const preset = lightingPresetRef.current;
      if (preset === 'golden-hour') {
        scene.background = new THREE.Color('#7EC8E3');
        hemiLight.intensity = 0.85;
        sunDirLight.color.setHex(0xffdfa8);
        sunDirLight.intensity = 1.65;
        sunbeamGroup.visible = true;
        sunbeamMat.opacity = 0.085 + Math.sin(elapsed * 0.8) * 0.015;
        trackSpotlights.forEach((s) => (s.intensity = 2.6));
      } else if (preset === 'equatorial-noon') {
        scene.background = new THREE.Color('#38BDF8');
        hemiLight.intensity = 1.25;
        sunDirLight.color.setHex(0xffffff);
        sunDirLight.intensity = 2.1;
        sunbeamGroup.visible = true;
        sunbeamMat.opacity = 0.05;
        trackSpotlights.forEach((s) => (s.intensity = 1.8));
      } else if (preset === 'sunset-veranda') {
        scene.background = new THREE.Color('#EA580C');
        hemiLight.intensity = 0.6;
        sunDirLight.color.setHex(0xf97316);
        sunDirLight.intensity = 1.9;
        sunbeamGroup.visible = true;
        sunbeamMat.opacity = 0.12;
        trackSpotlights.forEach((s) => (s.intensity = 3.1));
      } else {
        // nocturnal-spot
        scene.background = new THREE.Color('#0F172A');
        hemiLight.intensity = 0.25;
        sunDirLight.intensity = 0.15;
        sunbeamGroup.visible = false;
        trackSpotlights.forEach((s) => (s.intensity = 4.2));
      }

      // B. Update Normal Relief Scale & Raking Light
      const reliefMult = reliefIntensityRef.current;
      artworkMaterials.forEach(({ art, mat }) => {
        const s = art.bumpScale * 22 * reliefMult;
        mat.normalScale.set(s, s);
      });

      if (rakingActiveRef.current && selectedArtRef.current) {
        const activeArt = selectedArtRef.current;
        const normal = new THREE.Vector3(0, 0, 1).applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          activeArt.rotationY
        );
        const tangent = new THREE.Vector3(1, 0, 0).applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          activeArt.rotationY
        );
        const sweepX = Math.sin(elapsed * 1.4) * (activeArt.frameWidth * 0.42);
        const sweepY = Math.cos(elapsed * 0.9) * (activeArt.frameHeight * 0.32);

        rakingLight.position
          .set(...activeArt.position)
          .addScaledVector(tangent, sweepX)
          .add(new THREE.Vector3(0, sweepY, 0))
          .addScaledVector(normal, 0.36);
        rakingLight.intensity = 3.4;
        rakingOrb.visible = true;
      } else {
        rakingLight.intensity = hoveredArtworkTitle ? 1.8 : 0.0;
        rakingOrb.visible = false;
      }

      // C. Sway Coconut Palms & Ocean Waves in the Tradewind
      palmCrowns.forEach((crown, idx) => {
        crown.rotation.z = Math.sin(elapsed * 1.3 + idx) * 0.055;
        crown.rotation.x = Math.cos(elapsed * 0.95 + idx) * 0.04;
      });

      // Animate Justin Reddy's centerpiece sculpture (gentle hovering and rotation)
      if (sculptureGroup) {
        sculptureGroup.rotation.y = elapsed * 0.42;
        sculptureGroup.position.y = 1.88 + Math.sin(elapsed * 1.35) * 0.04;
      }

      // Drift golden dust motes in the breeze
      const pAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        let px = pAttr.getX(i) - dt * 0.14;
        let py = pAttr.getY(i) + Math.sin(elapsed + i) * dt * 0.04;
        if (px < -8) px = 8;
        if (py > 4.9) py = 0.5;
        pAttr.setXYZ(i, px, py, pAttr.getZ(i));
      }
      pAttr.needsUpdate = true;

      // Fade floor click target ring
      if (ringMat.opacity > 0.01) {
        ringMat.opacity *= 0.95;
        floorTargetRing.scale.setScalar(1 + (1 - ringMat.opacity) * 0.35);
      }

      // D. Guided Tour Auto-Advance
      if (guidedTourRef.current) {
        tourTimer += dt;
        if (tourTimer > 7.5) {
          tourTimer = 0;
          tourIndex = (tourIndex + 1) % pavilionArtworks.length;
          onSelectArtRef.current(pavilionArtworks[tourIndex]);
        }
      } else {
        tourTimer = 0;
      }

      // E. Keyboard WASD / Arrow Navigation vs Auto-Glide
      const moveSpeed = 3.8 * dt;
      const turnSpeed = 1.45 * dt;

      if (keysPressed['q']) navRef.current.yaw += turnSpeed;
      if (keysPressed['e']) navRef.current.yaw -= turnSpeed;

      if (mobileTurnRef.current) {
        navRef.current.yaw += mobileTurnRef.current;
        navRef.current.isAutoMoving = false;
      }

      const forward = new THREE.Vector3(
        -Math.sin(navRef.current.yaw),
        0,
        -Math.cos(navRef.current.yaw)
      );
      const right = new THREE.Vector3(
        Math.cos(navRef.current.yaw),
        0,
        -Math.sin(navRef.current.yaw)
      );

      let manualMoved = false;
      if (keysPressed['w'] || keysPressed['arrowup']) {
        navRef.current.camPos.addScaledVector(forward, moveSpeed);
        manualMoved = true;
      }
      if (keysPressed['s'] || keysPressed['arrowdown']) {
        navRef.current.camPos.addScaledVector(forward, -moveSpeed);
        manualMoved = true;
      }
      if (keysPressed['a'] || keysPressed['arrowleft']) {
        navRef.current.camPos.addScaledVector(right, -moveSpeed);
        manualMoved = true;
      }
      if (keysPressed['d'] || keysPressed['arrowright']) {
        navRef.current.camPos.addScaledVector(right, moveSpeed);
        manualMoved = true;
      }

      // Mobile Touch Vector Movement
      if (mobileMoveRef.current) {
        const { x, z } = mobileMoveRef.current;
        if (z !== 0) {
          navRef.current.camPos.addScaledVector(forward, z * moveSpeed * 1.35);
          manualMoved = true;
        }
        if (x !== 0) {
          navRef.current.camPos.addScaledVector(right, x * moveSpeed * 1.35);
          manualMoved = true;
        }
      }

      if (manualMoved) {
        // Clamp within gallery walls and around central plinth
        navRef.current.camPos.x = Math.max(-7.5, Math.min(7.5, navRef.current.camPos.x));
        navRef.current.camPos.z = Math.max(-7.5, Math.min(8.2, navRef.current.camPos.z));
        navRef.current.targetCamPos.copy(navRef.current.camPos);
      }

      if (navRef.current.isAutoMoving) {
        navRef.current.camPos.lerp(navRef.current.targetCamPos, Math.min(1, dt * 3.6));
        navRef.current.lookAtPos.lerp(navRef.current.targetLookAtPos, Math.min(1, dt * 4.2));
        camera.position.copy(navRef.current.camPos);
        camera.lookAt(navRef.current.lookAtPos);

        if (
          navRef.current.camPos.distanceTo(navRef.current.targetCamPos) < 0.04 &&
          navRef.current.lookAtPos.distanceTo(navRef.current.targetLookAtPos) < 0.04
        ) {
          navRef.current.isAutoMoving = false;
        }
      } else {
        camera.position.copy(navRef.current.camPos);
        const lookDir = new THREE.Vector3(
          -Math.sin(navRef.current.yaw) * Math.cos(navRef.current.pitch),
          Math.sin(navRef.current.pitch),
          -Math.cos(navRef.current.yaw) * Math.cos(navRef.current.pitch)
        );
        navRef.current.lookAtPos.copy(camera.position).addScaledVector(lookDir, 4.0);
        camera.lookAt(navRef.current.lookAtPos);
      }

      if (onCameraMoveRef.current) {
        onCameraMoveRef.current({
          x: camera.position.x,
          z: camera.position.z,
          yaw: navRef.current.yaw,
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('touchstart', handleTouchStart);
      renderer.domElement.removeEventListener('touchmove', handleTouchMove);
      renderer.domElement.removeEventListener('touchend', handleTouchEnd);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.dispose();
    };
  }, []);

  if (webglError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#181411] text-[#FBF9F5] p-8">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-2xl font-serif-display">3D Viewport Paused</h2>
          <p className="text-sm text-[#D6CEBE]">
            Your browser suspended WebGL rendering. You can still browse Justin Reddy’s full exhibition in the Curatorial Catalog view.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full select-none touch-none">
      <div ref={mountRef} className="w-full h-full touch-none" />

      {/* Subtle Hover Artwork Caption near top center */}
      {hoveredArtworkTitle && !selectedArtwork && (
        <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded bg-black/60 backdrop-blur-md border border-white/15 text-xs tracking-wide text-[#FBF9F5] whitespace-nowrap">
          Click to inspect: <span className="font-serif-display italic text-base ml-1">{hoveredArtworkTitle}</span>
        </div>
      )}
    </div>
  );
};
