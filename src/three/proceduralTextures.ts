import * as THREE from 'three';

export const GENERATED_TEXTURES = {
  coverCrest: '/src/assets/images/storybook_cover_crest_1795577710542.jpg',
  parchmentTile: '/src/assets/images/medieval_parchment_tile_1795577710211.jpg',
  cobbleTile: '/src/assets/images/mossy_cobble_tile_1795577711325.jpg',
} as const;

export function createRadialShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.08,
      size / 2,
      size / 2,
      size * 0.5,
    );
    grad.addColorStop(0, 'rgba(18, 12, 8, 0.55)');
    grad.addColorStop(0.55, 'rgba(18, 12, 8, 0.24)');
    grad.addColorStop(1, 'rgba(18, 12, 8, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createOakWoodTexture(maxAniso: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#3b2416';
    ctx.fillRect(0, 0, size, size);

    // Subtle wooden planks
    const plankCount = 4;
    const plankW = size / plankCount;
    for (let p = 0; p < plankCount; p++) {
      const x0 = p * plankW;
      ctx.fillStyle = p % 2 === 0 ? '#422818' : '#382113';
      ctx.fillRect(x0, 0, plankW - 2, size);

      for (let i = 0; i < 42; i++) {
        const gx = x0 + Math.random() * plankW;
        ctx.strokeStyle =
          i % 3 === 0 ? 'rgba(24, 12, 5, 0.35)' : 'rgba(96, 62, 38, 0.2)';
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.bezierCurveTo(
          gx + (Math.random() - 0.5) * 16,
          size * 0.33,
          gx + (Math.random() - 0.5) * 16,
          size * 0.66,
          gx,
          size,
        );
        ctx.stroke();
      }
      ctx.fillStyle = '#1e1008';
      ctx.fillRect(x0 + plankW - 2, 0, 2, size);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = maxAniso;
  return tex;
}

export function createStoneBumpTexture(maxAniso: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 650; i++) {
      const shade = 90 + Math.floor(Math.random() * 85);
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.beginPath();
      ctx.arc(
        Math.random() * size,
        Math.random() * size,
        1.5 + Math.random() * 4.5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.anisotropy = maxAniso;
  return tex;
}

export function loadTileTexture(
  url: string,
  repeatX: number,
  repeatY: number,
  maxAniso: number,
): THREE.Texture {
  const loader = new THREE.TextureLoader();
  const tex = loader.load(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAniso;
  return tex;
}
