import * as THREE from 'three';

/**
 * Generates a realistic 3D normal map and bump map directly from an artwork's image pixels,
 * combined with procedural canvas weave (for acrylics) or cold-press rag paper tooth (for charcoal).
 * This ensures raking gallery spotlights highlight every impasto ridge and charcoal stroke.
 */
export function createArtworkReliefMaps(
  img: HTMLImageElement,
  surfaceType: string
): { normalMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const size = 512;
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = size;
  srcCanvas.height = size;
  const srcCtx = srcCanvas.getContext('2d')!;
  srcCtx.drawImage(img, 0, 0, size, size);

  const srcData = srcCtx.getImageData(0, 0, size, size).data;
  const heightField = new Float32Array(size * size);

  // Build height map from luminance + medium-specific micro-texture
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const r = srcData[idx] / 255;
      const g = srcData[idx + 1] / 255;
      const b = srcData[idx + 2] / 255;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const saturation = Math.max(r, g, b) - Math.min(r, g, b);

      let h = 0;
      if (surfaceType === 'impasto-acrylic') {
        // Thick acrylic: bright and saturated strokes sit higher off the canvas
        const weave =
          (Math.sin(x * 1.45) * 0.5 + 0.5) * (Math.sin(y * 1.45) * 0.5 + 0.5) * 0.12;
        h = lum * 0.65 + saturation * 0.45 + weave;
      } else if (surfaceType === 'mixed-canvas') {
        // Pronounced linen weave + pigment build-up
        const weave =
          (Math.sin(x * 1.8) * 0.5 + 0.5) * (Math.cos(y * 1.8) * 0.5 + 0.5) * 0.24;
        h = lum * 0.48 + saturation * 0.35 + weave;
      } else if (surfaceType === 'wood-carving') {
        // Wood grain ridges and chisel incisions
        const woodGrain = Math.sin(x * 0.45 + Math.sin(y * 0.08) * 4.0) * 0.18;
        h = lum * 0.5 + woodGrain;
      } else if (surfaceType === 'plaster-relief') {
        // Stippled mortar relief and deep recesses
        const mortarStipple = Math.sin(x * 2.8) * Math.cos(y * 2.8) * 0.15;
        h = lum * 0.8 + mortarStipple;
      } else if (surfaceType === 'found-cardboard') {
        // Corrugated fluting ribs
        const flute = Math.sin(y * 0.6) * 0.22;
        h = lum * 0.4 + flute;
      } else if (surfaceType === 'newsprint-collage') {
        // Layered paper steps and cut boundaries
        const paperStep = (Math.sin(x * 0.2) + Math.cos(y * 0.2)) * 0.12;
        h = lum * 0.45 + paperStep;
      } else {
        // Charcoal on archival rag paper: organic paper tooth + charcoal deposit in darks
        const paperTooth =
          Math.sin(x * 0.7 + Math.cos(y * 0.65) * 2.5) * 0.12 +
          Math.cos(y * 0.85 + Math.sin(x * 0.5) * 2.5) * 0.12 +
          ((Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1) * 0.08;
        const charcoalDeposit = (1.0 - lum) * 0.38;
        h = paperTooth + charcoalDeposit;
      }

      heightField[y * size + x] = h;
    }
  }

  // Convert heightField to tangent-space Normal Map using Sobel filter
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = size;
  normalCanvas.height = size;
  const normalCtx = normalCanvas.getContext('2d')!;
  const normalImg = normalCtx.createImageData(size, size);
  const nData = normalImg.data;

  // Also create a dynamic roughness map so thick acrylic glints while raw paper stays velvety matte
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const roughCtx = roughCanvas.getContext('2d')!;
  const roughImg = roughCtx.createImageData(size, size);
  const rData = roughImg.data;

  const strength =
    surfaceType === 'impasto-acrylic' ? 6.5 : surfaceType === 'mixed-canvas' ? 5.2 : 3.8;

  for (let y = 0; y < size; y++) {
    const ym1 = Math.max(0, y - 1);
    const yp1 = Math.min(size - 1, y + 1);
    for (let x = 0; x < size; x++) {
      const xm1 = Math.max(0, x - 1);
      const xp1 = Math.min(size - 1, x + 1);

      const tl = heightField[ym1 * size + xm1];
      const t = heightField[ym1 * size + x];
      const tr = heightField[ym1 * size + xp1];
      const l = heightField[y * size + xm1];
      const r = heightField[y * size + xp1];
      const bl = heightField[yp1 * size + xm1];
      const b = heightField[yp1 * size + x];
      const br = heightField[yp1 * size + xp1];

      const dX = tr + 2 * r + br - (tl + 2 * l + bl);
      const dY = bl + 2 * b + br - (tl + 2 * t + tr);
      const dZ = 1.0 / strength;

      const invLen = 1.0 / Math.sqrt(dX * dX + dY * dY + dZ * dZ);
      const nx = ((dX * invLen) * 0.5 + 0.5) * 255;
      const ny = ((-dY * invLen) * 0.5 + 0.5) * 255;
      const nz = ((dZ * invLen) * 0.5 + 0.5) * 255;

      const outIdx = (y * size + x) * 4;
      nData[outIdx] = nx;
      nData[outIdx + 1] = ny;
      nData[outIdx + 2] = nz;
      nData[outIdx + 3] = 255;

      const hVal = heightField[y * size + x];
      let roughVal = 200;
      if (surfaceType === 'impasto-acrylic') {
        // Ridges are glossier (lower roughness value)
        roughVal = Math.floor(Math.max(55, Math.min(210, 175 - hVal * 95)));
      } else if (surfaceType === 'mixed-canvas') {
        roughVal = Math.floor(Math.max(90, Math.min(230, 200 - hVal * 70)));
      } else {
        // Charcoal on paper: very matte, slight graphite sheen in dense strokes
        roughVal = Math.floor(Math.max(175, Math.min(248, 238 - hVal * 40)));
      }
      rData[outIdx] = roughVal;
      rData[outIdx + 1] = roughVal;
      rData[outIdx + 2] = roughVal;
      rData[outIdx + 3] = 255;
    }
  }

  normalCtx.putImageData(normalImg, 0, 0);
  roughCtx.putImageData(roughImg, 0, 0);

  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.wrapS = THREE.ClampToEdgeWrapping;
  normalMap.wrapT = THREE.ClampToEdgeWrapping;
  normalMap.needsUpdate = true;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.ClampToEdgeWrapping;
  roughnessMap.wrapT = THREE.ClampToEdgeWrapping;
  roughnessMap.needsUpdate = true;

  return { normalMap, roughnessMap };
}

/**
 * Creates a Seychellois Takamaka hardwood plank floor texture with warm tropical grain
 */
export function createTeakFloorTexture(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 1024;
  bumpCanvas.height = 1024;
  const bumpCtx = bumpCanvas.getContext('2d')!;

  // Base warm honey-teak tone
  ctx.fillStyle = '#5B3E29';
  ctx.fillRect(0, 0, 1024, 1024);

  bumpCtx.fillStyle = '#808080';
  bumpCtx.fillRect(0, 0, 1024, 1024);

  const numPlanks = 16;
  const plankWidth = 1024 / numPlanks;

  for (let i = 0; i < numPlanks; i++) {
    const x = i * plankWidth;
    const hueShift = (Math.sin(i * 3.7) * 8) | 0;
    ctx.fillStyle = `rgb(${94 + hueShift}, ${64 + hueShift}, ${42 + Math.floor(hueShift * 0.6)})`;
    ctx.fillRect(x, 0, plankWidth - 2, 1024);

    // Wood grain lines
    for (let g = 0; g < 45; g++) {
      const gx = x + Math.random() * (plankWidth - 4);
      ctx.strokeStyle =
        g % 2 === 0 ? 'rgba(42, 26, 15, 0.16)' : 'rgba(148, 104, 68, 0.12)';
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.bezierCurveTo(
        gx + Math.sin(g) * 6,
        340,
        gx - Math.cos(g) * 6,
        680,
        gx,
        1024
      );
      ctx.stroke();
    }

    // Plank seam
    ctx.fillStyle = '#2A1A10';
    ctx.fillRect(x + plankWidth - 2, 0, 2, 1024);

    bumpCtx.fillStyle = '#202020';
    bumpCtx.fillRect(x + plankWidth - 2, 0, 2, 1024);

    // Horizontal board joint
    const jointY = ((i * 277) % 880) + 70;
    ctx.fillRect(x, jointY, plankWidth, 2);
    bumpCtx.fillRect(x, jointY, plankWidth, 2);
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(5, 5);
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(5, 5);

  return { map, bumpMap };
}

/**
 * Creates a warm coral-limestone Venetian plaster wall texture
 */
export function createCoralPlasterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#F4EFE4';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 8 + Math.random() * 28;
    ctx.fillStyle =
      i % 2 === 0 ? 'rgba(232, 224, 208, 0.14)' : 'rgba(252, 249, 242, 0.14)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates slatted window sunbeam projection texture on the gallery floor
 */
export function createSunbeamFloorGobo(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 512);

  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, 'rgba(255, 232, 175, 0.0)');
  grad.addColorStop(0.15, 'rgba(255, 232, 175, 0.55)');
  grad.addColorStop(0.75, 'rgba(255, 224, 150, 0.32)');
  grad.addColorStop(1, 'rgba(255, 220, 140, 0.0)');

  // Louvered shutter light bars
  const numSlats = 14;
  const slatStep = 440 / numSlats;
  for (let i = 0; i < numSlats; i++) {
    const y = 36 + i * slatStep;
    ctx.fillStyle = grad;
    ctx.fillRect(24, y, 464, slatStep * 0.62);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
