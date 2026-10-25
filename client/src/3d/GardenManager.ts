import * as THREE from 'three';
import { VisualElement } from '../services/api.js';

export class GardenManager {
  public group: THREE.Group;
  private flowers: Map<string, THREE.Group> = new Map();
  private petalsGroup: THREE.Points;
  private firefliesGroup: THREE.Points;
  private terrainMesh: THREE.Mesh;
  private petalPositions: Float32Array;
  private petalVelocities: { x: number; y: number; z: number; rotSpeed: number }[] = [];
  private fireflyPositions: Float32Array;
  private fireflySeeds: Float32Array;

  constructor() {
    this.group = new THREE.Group();

    // 1. Create Romantic Terraced Lawn / Garden Floor
    const terrainGeo = new THREE.CylinderGeometry(18, 20, 2, 48, 8);
    // Subtle procedural undulation on vertex heights
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      if (posAttr.getY(i) > 0.5) {
        const hill = Math.sin(dist * 0.35) * 0.3 + Math.cos(x * 0.2) * 0.15;
        posAttr.setY(i, posAttr.getY(i) + hill);
      }
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x2E6930,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: false,
    });
    this.terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    this.terrainMesh.position.y = -1;
    this.terrainMesh.receiveShadow = true;
    this.group.add(this.terrainMesh);

    // 2. Garden stone border & path accent
    const pathGeo = new THREE.TorusGeometry(8.5, 0.4, 8, 36);
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0x8C7B6D,
      roughness: 0.9,
    });
    const pathMesh = new THREE.Mesh(pathGeo, pathMat);
    pathMesh.rotation.x = Math.PI / 2;
    pathMesh.position.y = 0.05;
    this.group.add(pathMesh);

    // 3. Falling / drifting rose petals
    const petalCount = 70;
    const petalGeo = new THREE.BufferGeometry();
    this.petalPositions = new Float32Array(petalCount * 3);

    for (let i = 0; i < petalCount; i++) {
      this.petalPositions[i * 3] = (Math.random() - 0.5) * 30;
      this.petalPositions[i * 3 + 1] = Math.random() * 12 + 1;
      this.petalPositions[i * 3 + 2] = (Math.random() - 0.5) * 30;

      this.petalVelocities.push({
        x: (Math.random() - 0.3) * 0.02,
        y: -(Math.random() * 0.015 + 0.008),
        z: (Math.random() - 0.3) * 0.02,
        rotSpeed: Math.random() * 0.02,
      });
    }
    petalGeo.setAttribute('position', new THREE.BufferAttribute(this.petalPositions, 3));

    // Custom circle texture for soft petals
    const petalCanvas = document.createElement('canvas');
    petalCanvas.width = 32;
    petalCanvas.height = 32;
    const pCtx = petalCanvas.getContext('2d')!;
    pCtx.beginPath();
    pCtx.arc(16, 16, 14, 0, Math.PI * 2);
    pCtx.fillStyle = '#FB7185';
    pCtx.fill();
    const petalTexture = new THREE.CanvasTexture(petalCanvas);

    const petalMat = new THREE.PointsMaterial({
      size: 0.45,
      map: petalTexture,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    this.petalsGroup = new THREE.Points(petalGeo, petalMat);
    this.group.add(this.petalsGroup);

    // 4. Luminous fairy fireflies
    const fireflyCount = 45;
    const fireflyGeo = new THREE.BufferGeometry();
    this.fireflyPositions = new Float32Array(fireflyCount * 3);
    this.fireflySeeds = new Float32Array(fireflyCount);

    for (let i = 0; i < fireflyCount; i++) {
      this.fireflyPositions[i * 3] = (Math.random() - 0.5) * 20;
      this.fireflyPositions[i * 3 + 1] = Math.random() * 3 + 0.4;
      this.fireflyPositions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      this.fireflySeeds[i] = Math.random() * 100;
    }
    fireflyGeo.setAttribute('position', new THREE.BufferAttribute(this.fireflyPositions, 3));

    const fireflyCanvas = document.createElement('canvas');
    fireflyCanvas.width = 32;
    fireflyCanvas.height = 32;
    const fCtx = fireflyCanvas.getContext('2d')!;
    const fGrad = fCtx.createRadialGradient(16, 16, 2, 16, 16, 15);
    fGrad.addColorStop(0, '#FFFFFF');
    fGrad.addColorStop(0.4, '#FDE047');
    fGrad.addColorStop(1, 'transparent');
    fCtx.fillStyle = fGrad;
    fCtx.fillRect(0, 0, 32, 32);
    const fireflyTexture = new THREE.CanvasTexture(fireflyCanvas);

    const fireflyMat = new THREE.PointsMaterial({
      size: 0.6,
      map: fireflyTexture,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.firefliesGroup = new THREE.Points(fireflyGeo, fireflyMat);
    this.group.add(this.firefliesGroup);
  }

  /**
   * Builds an individual detailed 3D flower (stem, leaves, layered blooming petals).
   */
  public createFlowerMesh(element: VisualElement): THREE.Group {
    const flowerGroup = new THREE.Group();
    flowerGroup.position.set(element.pos_x, element.pos_y, element.pos_z);
    flowerGroup.rotation.y = element.rot_y || 0;
    flowerGroup.scale.setScalar(element.scale || 1);
    (flowerGroup as any).elementData = element;

    const isProtagonist = element.element_type === 'PROTAGONIST_FLOWER';
    const flowerColor = new THREE.Color(element.color || '#E11D48');

    // 1. Curved Stem
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.04, 0.4, 0.02),
      new THREE.Vector3(-0.03, 0.8, -0.01),
      new THREE.Vector3(0, 1.2, 0)
    ]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 16, isProtagonist ? 0.045 : 0.035, 8, false);
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x3E8941,
      roughness: 0.7,
      metalness: 0.1,
    });
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.castShadow = true;
    flowerGroup.add(stemMesh);

    // 2. Green Leaves
    const leafGeo = new THREE.ConeGeometry(0.12, 0.35, 5);
    leafGeo.scale(1, 0.15, 2);
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x2A6E30,
      roughness: 0.6,
      side: THREE.DoubleSide
    });

    const leaf1 = new THREE.Mesh(leafGeo, leafMat);
    leaf1.position.set(0.05, 0.5, 0.03);
    leaf1.rotation.set(0.3, 0.4, 0.8);
    flowerGroup.add(leaf1);

    const leaf2 = new THREE.Mesh(leafGeo, leafMat);
    leaf2.position.set(-0.04, 0.7, -0.02);
    leaf2.rotation.set(-0.2, -0.6, -0.8);
    flowerGroup.add(leaf2);

    // 3. Flower Blossom Head
    const blossomGroup = new THREE.Group();
    blossomGroup.position.set(0, 1.2, 0);

    // Blossom Center receptacle
    const centerGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const centerMat = new THREE.MeshStandardMaterial({
      color: flowerColor.clone().multiplyScalar(0.7),
      roughness: 0.8
    });
    blossomGroup.add(new THREE.Mesh(centerGeo, centerMat));

    // Layered Petals
    const petalMat = new THREE.MeshStandardMaterial({
      color: flowerColor,
      roughness: 0.45,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    // Inner petal cone
    const innerPetalGeo = new THREE.CylinderGeometry(0.02, 0.18, 0.3, 8, 1, true);
    const innerPetal = new THREE.Mesh(innerPetalGeo, petalMat);
    innerPetal.position.y = 0.08;
    blossomGroup.add(innerPetal);

    // Outer blooming petal circles
    const layers = isProtagonist ? 4 : 3;
    const petalsPerLayer = isProtagonist ? 6 : 5;

    for (let l = 0; l < layers; l++) {
      const layerRadius = 0.12 + l * 0.07;
      const petalScale = 0.18 + l * 0.06;
      const angleStep = (Math.PI * 2) / petalsPerLayer;
      const layerTilt = 0.3 + l * 0.22;

      for (let p = 0; p < petalsPerLayer; p++) {
        const angle = p * angleStep + (l * 0.4);
        const pGeo = new THREE.SphereGeometry(petalScale, 7, 7);
        pGeo.scale(0.8, 0.15, 1.3);

        const pMesh = new THREE.Mesh(pGeo, petalMat);
        pMesh.position.set(
          Math.cos(angle) * layerRadius,
          0.05 + l * 0.02,
          Math.sin(angle) * layerRadius
        );
        pMesh.rotation.y = -angle + Math.PI / 2;
        pMesh.rotation.x = layerTilt;
        pMesh.castShadow = true;
        blossomGroup.add(pMesh);
      }
    }

    // Protagonist Flower Special Glow aura
    if (isProtagonist) {
      const glowGeo = new THREE.SphereGeometry(0.55, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xFF4D6D,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        wireframe: false,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      blossomGroup.add(glowMesh);
    }

    flowerGroup.add(blossomGroup);

    // Gentle random starting sway phase
    (flowerGroup as any).swayPhase = Math.random() * Math.PI * 2;
    (flowerGroup as any).blossom = blossomGroup;

    return flowerGroup;
  }

  /**
   * Syncs elements from backend database into the 3D scene.
   */
  public updateElements(elements: VisualElement[]): void {
    const gardenElements = elements.filter(e =>
      e.element_type === 'PROTAGONIST_FLOWER' || e.element_type === 'GARDEN_FLOWER'
    );

    const currentIds = new Set<string>();

    for (const elem of gardenElements) {
      currentIds.add(elem.id);

      if (!this.flowers.has(elem.id)) {
        const mesh = this.createFlowerMesh(elem);
        // Animate birth bloom if newly added
        mesh.scale.set(0.01, 0.01, 0.01);
        const targetScale = elem.scale || 1;

        let progress = 0;
        const bloomAnim = () => {
          progress += 0.04;
          const s = THREE.MathUtils.lerp(0.01, targetScale, Math.min(1, progress));
          mesh.scale.setScalar(s);
          if (progress < 1) {
            requestAnimationFrame(bloomAnim);
          }
        };
        bloomAnim();

        this.flowers.set(elem.id, mesh);
        this.group.add(mesh);
      }
    }

    // Cleanup removed flowers
    for (const [id, mesh] of this.flowers.entries()) {
      if (!currentIds.has(id)) {
        this.group.remove(mesh);
        this.flowers.delete(id);
      }
    }
  }

  public getFlowerMeshes(): THREE.Group[] {
    return Array.from(this.flowers.values());
  }

  /**
   * Animation tick: wind sway, drifting petals, weaving fireflies.
   */
  public update(time: number, delta: number): void {
    // 1. Gentle wind sway for all flowers
    for (const flower of this.flowers.values()) {
      const phase = (flower as any).swayPhase || 0;
      const swayX = Math.sin(time * 1.4 + phase) * 0.04;
      const swayZ = Math.cos(time * 1.1 + phase) * 0.03;
      flower.rotation.z = swayX;
      flower.rotation.x = swayZ;
    }

    // 2. Petals floating & drifting with wind
    const posAttr = this.petalsGroup.geometry.attributes.position as THREE.BufferAttribute;
    const count = posAttr.count;

    for (let i = 0; i < count; i++) {
      let y = posAttr.getY(i) + this.petalVelocities[i].y;
      let x = posAttr.getX(i) + this.petalVelocities[i].x + Math.sin(time + i) * 0.005;
      let z = posAttr.getZ(i) + this.petalVelocities[i].z + Math.cos(time * 0.8 + i) * 0.005;

      // Loop back up if fallen beneath ground
      if (y < 0.2) {
        y = 12 + Math.random() * 2;
        x = (Math.random() - 0.5) * 25;
        z = (Math.random() - 0.5) * 25;
      }

      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;

    // 3. Fireflies weaving
    const fPosAttr = this.firefliesGroup.geometry.attributes.position as THREE.BufferAttribute;
    const fCount = fPosAttr.count;

    for (let i = 0; i < fCount; i++) {
      const seed = this.fireflySeeds[i];
      const origX = this.fireflyPositions[i * 3];
      const origY = this.fireflyPositions[i * 3 + 1];
      const origZ = this.fireflyPositions[i * 3 + 2];

      const nx = origX + Math.sin(time * 0.8 + seed) * 0.6;
      const ny = origY + Math.sin(time * 1.5 + seed * 2) * 0.3;
      const nz = origZ + Math.cos(time * 0.7 + seed) * 0.6;

      fPosAttr.setXYZ(i, nx, ny, nz);
    }
    fPosAttr.needsUpdate = true;
  }
}
