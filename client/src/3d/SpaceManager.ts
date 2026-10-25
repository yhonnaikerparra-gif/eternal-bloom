import * as THREE from 'three';
import { VisualElement } from '../services/api.js';

export class SpaceManager {
  public group: THREE.Group;
  public earthGroup: THREE.Group;
  public earthMesh: THREE.Mesh;
  public cloudMesh: THREE.Mesh;
  public atmosphereMesh: THREE.Mesh;
  private stars: Map<string, THREE.Group> = new Map();
  private cosmicDust: THREE.Points;
  private shootingStars: { mesh: THREE.Line; velocity: THREE.Vector3; life: number }[] = [];
  private galaxyGroup: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
    this.group.visible = false; // Initially hidden until Stage 4 (365 days) or preview mode

    // 1. Photorealistic 3D Earth Globe
    this.earthGroup = new THREE.Group();
    this.earthGroup.position.set(0, 0, 0);

    // Procedural Earth surface canvas with oceans and continents
    const earthCanvas = document.createElement('canvas');
    earthCanvas.width = 1024;
    earthCanvas.height = 512;
    const ctx = earthCanvas.getContext('2d')!;

    // Deep blue ocean
    ctx.fillStyle = '#0F2C59';
    ctx.fillRect(0, 0, 1024, 512);

    // Continents procedural painting (Americas, Africa, Eurasia, Australia)
    ctx.fillStyle = '#2D6A4F';
    // Americas
    ctx.beginPath();
    ctx.ellipse(260, 210, 80, 140, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(320, 360, 60, 110, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Eurasia / Africa
    ctx.beginPath();
    ctx.ellipse(600, 180, 140, 90, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(560, 310, 70, 110, 0, 0, Math.PI * 2);
    ctx.fill();
    // Australia
    ctx.beginPath();
    ctx.ellipse(820, 360, 50, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    // Continent borders & relief highlights
    ctx.strokeStyle = '#40916C';
    ctx.lineWidth = 6;
    ctx.stroke();

    const earthTexture = new THREE.CanvasTexture(earthCanvas);

    const earthGeo = new THREE.SphereGeometry(12, 48, 48);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.1,
    });
    this.earthMesh = new THREE.Mesh(earthGeo, earthMat);
    this.earthGroup.add(this.earthMesh);

    // 2. Rotating Atmospheric Clouds Layer
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 1024;
    cloudCanvas.height = 512;
    const cCtx = cloudCanvas.getContext('2d')!;
    cCtx.clearRect(0, 0, 1024, 512);
    cCtx.fillStyle = 'rgba(255, 255, 255, 0.45)';

    for (let i = 0; i < 40; i++) {
      cCtx.beginPath();
      cCtx.ellipse(
        Math.random() * 1024,
        Math.random() * 512,
        60 + Math.random() * 90,
        15 + Math.random() * 30,
        Math.random() * 0.4,
        0,
        Math.PI * 2
      );
      cCtx.fill();
    }
    const cloudTexture = new THREE.CanvasTexture(cloudCanvas);

    const cloudGeo = new THREE.SphereGeometry(12.25, 48, 48);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    this.earthGroup.add(this.cloudMesh);

    // 3. Azure Atmospheric Rim Glow
    const atmosGeo = new THREE.SphereGeometry(12.8, 36, 36);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x60A5FA,
      transparent: true,
      opacity: 0.28,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    this.atmosphereMesh = new THREE.Mesh(atmosGeo, atmosMat);
    this.earthGroup.add(this.atmosphereMesh);

    this.group.add(this.earthGroup);

    // 4. Cosmic Background Galaxy & Nebulae
    this.galaxyGroup = new THREE.Group();
    this.createSpiralGalaxy();
    this.group.add(this.galaxyGroup);

    // 5. Cosmic Dust Particles
    const dustCount = 800;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);

    const palette = [
      new THREE.Color(0xF472B6), // Pink
      new THREE.Color(0x818CF8), // Violet
      new THREE.Color(0x38BDF8), // Cyan
      new THREE.Color(0xFDE047), // Gold
    ];

    for (let i = 0; i < dustCount; i++) {
      const radius = 25 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      dustPositions[i * 3] = radius * Math.cos(phi) * Math.cos(theta);
      dustPositions[i * 3 + 1] = radius * Math.sin(phi);
      dustPositions[i * 3 + 2] = radius * Math.cos(phi) * Math.sin(theta);

      const color = palette[Math.floor(Math.random() * palette.length)];
      dustColors[i * 3] = color.r;
      dustColors[i * 3 + 1] = color.g;
      dustColors[i * 3 + 2] = color.b;
    }

    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

    const dustMat = new THREE.PointsMaterial({
      size: 0.55,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.cosmicDust = new THREE.Points(dustGeo, dustMat);
    this.group.add(this.cosmicDust);
  }

  private createSpiralGalaxy(): void {
    const starCount = 1200;
    const arms = 3;
    const armGeo = new THREE.BufferGeometry();
    const armPositions = new Float32Array(starCount * 3);
    const armColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const r = Math.random() * 90 + 15;
      const spinAngle = r * 0.08;
      const armAngle = ((i % arms) * 2 * Math.PI) / arms;

      const randomX = (Math.random() - 0.5) * (r * 0.2);
      const randomY = (Math.random() - 0.5) * (r * 0.1);
      const randomZ = (Math.random() - 0.5) * (r * 0.2);

      armPositions[i * 3] = Math.cos(armAngle + spinAngle) * r + randomX;
      armPositions[i * 3 + 1] = randomY - 10;
      armPositions[i * 3 + 2] = Math.sin(armAngle + spinAngle) * r + randomZ;

      armColors[i * 3] = 0.8 + Math.random() * 0.2;
      armColors[i * 3 + 1] = 0.5 + Math.random() * 0.3;
      armColors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
    }

    armGeo.setAttribute('position', new THREE.BufferAttribute(armPositions, 3));
    armGeo.setAttribute('color', new THREE.BufferAttribute(armColors, 3));

    const armMat = new THREE.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const galaxy = new THREE.Points(armGeo, armMat);
    this.galaxyGroup.add(galaxy);
  }

  /**
   * Builds an individual interactive Star of Love (Days 366+).
   */
  public createStarMesh(element: VisualElement): THREE.Group {
    const starGroup = new THREE.Group();
    starGroup.position.set(element.pos_x, element.pos_y, element.pos_z);
    (starGroup as any).elementData = element;

    const starColor = new THREE.Color(element.color || '#FFFFFF');

    // Central Glowing Sphere
    const coreGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    starGroup.add(coreMesh);

    // Radiant Corona Flare Sprite
    const flareGeo = new THREE.PlaneGeometry(2.5, 2.5);
    const flareCanvas = document.createElement('canvas');
    flareCanvas.width = 64;
    flareCanvas.height = 64;
    const fCtx = flareCanvas.getContext('2d')!;
    const grad = fCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.3, element.color || '#F472B6');
    grad.addColorStop(1, 'transparent');
    fCtx.fillStyle = grad;
    fCtx.fillRect(0, 0, 64, 64);
    const flareTex = new THREE.CanvasTexture(flareCanvas);

    const flareMat = new THREE.MeshBasicMaterial({
      map: flareTex,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const flareMesh = new THREE.Mesh(flareGeo, flareMat);
    starGroup.add(flareMesh);

    // Star Birth Animation (scale bounce from 0 to 1)
    starGroup.scale.set(0.01, 0.01, 0.01);
    const targetScale = element.scale || 1;
    let progress = 0;
    const birthAnim = () => {
      progress += 0.035;
      const s = THREE.MathUtils.lerp(0.01, targetScale, Math.min(1, progress));
      starGroup.scale.setScalar(s);
      if (progress < 1) requestAnimationFrame(birthAnim);
    };
    birthAnim();

    return starGroup;
  }

  /**
   * Syncs cosmic star elements from backend.
   */
  public updateElements(elements: VisualElement[]): void {
    const starElements = elements.filter(e => e.element_type === 'STAR');
    const currentIds = new Set<string>();

    for (const elem of starElements) {
      currentIds.add(elem.id);
      if (!this.stars.has(elem.id)) {
        const starMesh = this.createStarMesh(elem);
        this.stars.set(elem.id, starMesh);
        this.group.add(starMesh);
      }
    }

    // Cleanup removed stars
    for (const [id, mesh] of this.stars.entries()) {
      if (!currentIds.has(id)) {
        this.group.remove(mesh);
        this.stars.delete(id);
      }
    }
  }

  public getStarMeshes(): THREE.Group[] {
    return Array.from(this.stars.values());
  }

  /**
   * Animation tick for Earth rotation, clouds drifting, and stars twinkling.
   */
  public update(time: number, delta: number, cameraPos: THREE.Vector3): void {
    // 1. Earth Axial Rotation
    this.earthMesh.rotation.y += delta * 0.05;
    this.cloudMesh.rotation.y += delta * 0.07; // Clouds move slightly faster

    // 2. Galaxy Slow Swirl
    this.galaxyGroup.rotation.y += delta * 0.015;

    // 3. Stars Corona Billboarding & Twinkling
    for (const star of this.stars.values()) {
      star.lookAt(cameraPos); // Always face the camera for lens flare effect
      const pulse = 1 + Math.sin(time * 3 + star.position.x) * 0.15;
      star.scale.setScalar(pulse);
    }
  }
}
