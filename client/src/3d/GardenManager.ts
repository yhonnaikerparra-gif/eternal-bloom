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

    // 1. Romantic Terraced Lawn / Garden Floor with natural relief
    const terrainGeo = new THREE.CylinderGeometry(18, 20, 2, 64, 12);
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      if (posAttr.getY(i) > 0.5) {
        const hill = Math.sin(dist * 0.35) * 0.32 + Math.cos(x * 0.22) * 0.16;
        posAttr.setY(i, posAttr.getY(i) + hill);
      }
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x245C27,
      roughness: 0.82,
      metalness: 0.05,
    });
    this.terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    this.terrainMesh.position.y = -1;
    this.terrainMesh.receiveShadow = true;
    this.group.add(this.terrainMesh);

    // 2. Garden stone border & path accent
    const pathGeo = new THREE.TorusGeometry(8.5, 0.45, 10, 48);
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0x7D6F63,
      roughness: 0.9,
    });
    const pathMesh = new THREE.Mesh(pathGeo, pathMat);
    pathMesh.rotation.x = Math.PI / 2;
    pathMesh.position.y = 0.06;
    this.group.add(pathMesh);

    // 3. Falling / drifting rose petals
    const petalCount = 75;
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
   * Generates a curved organic petal geometry with natural dish curvature and rolled lip.
   */
  private createCurvedPetalGeometry(width: number, length: number, curl: number): THREE.BufferGeometry {
    const segmentsW = 10;
    const segmentsL = 14;
    const geo = new THREE.PlaneGeometry(width, length, segmentsW, segmentsL);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const u = (pos.getX(i) / width) * 2; // -1 to 1
      const v = pos.getY(i) / length + 0.5; // 0 to 1

      // Dish concave curvature across width
      const cup = (1 - u * u) * 0.12 * Math.sin(v * Math.PI);
      
      // Outward petal curl near the tip
      const tipCurl = Math.pow(v, 2.2) * curl;

      // Natural taper at base and tip
      const widthTaper = Math.sin(v * Math.PI * 0.85);
      pos.setX(i, pos.getX(i) * (0.35 + 0.65 * widthTaper));
      pos.setZ(i, pos.getZ(i) + cup - tipCurl);
    }
    geo.computeVertexNormals();
    return geo;
  }

  /**
   * Builds an individual Remastered Botanical 3D Flower.
   * Features: multi-layer spiral petals, sepals, stem thorns, leaves with veins, and dewdrops.
   */
  public createFlowerMesh(element: VisualElement): THREE.Group {
    const flowerGroup = new THREE.Group();
    flowerGroup.position.set(element.pos_x, element.pos_y, element.pos_z);
    flowerGroup.rotation.y = element.rot_y || 0;
    flowerGroup.scale.setScalar(element.scale || 1);
    (flowerGroup as any).elementData = element;

    const isProtagonist = element.element_type === 'PROTAGONIST_FLOWER';
    const flowerColor = new THREE.Color(element.color || '#E11D48');

    // 1. Organic Curved Stem with Nodes
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.04, 0.35, 0.02),
      new THREE.Vector3(-0.03, 0.75, -0.01),
      new THREE.Vector3(0.02, 1.15, 0.01),
      new THREE.Vector3(0, 1.35, 0)
    ]);
    const stemRadius = isProtagonist ? 0.045 : 0.036;
    const stemGeo = new THREE.TubeGeometry(stemCurve, 24, stemRadius, 10, false);
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x2E6B32,
      roughness: 0.65,
      metalness: 0.08,
    });
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.castShadow = true;
    flowerGroup.add(stemMesh);

    // 2. Realistic Thorns along the stem
    const thornGeo = new THREE.ConeGeometry(0.022, 0.08, 6);
    thornGeo.rotateX(-Math.PI / 2.3); // slight downward curve
    const thornMat = new THREE.MeshStandardMaterial({
      color: 0x4A2518,
      roughness: 0.7,
    });

    const thornPositions = [
      { y: 0.3, rotY: 0.5 },
      { y: 0.55, rotY: 2.4 },
      { y: 0.85, rotY: 4.1 },
      { y: 1.05, rotY: 1.2 },
    ];
    for (const t of thornPositions) {
      const thorn = new THREE.Mesh(thornGeo, thornMat);
      const point = stemCurve.getPoint(t.y / 1.35);
      thorn.position.set(point.x, point.y, point.z);
      thorn.rotation.y = t.rotY;
      flowerGroup.add(thorn);
    }

    // 3. Realistic Rose Leaves (3 leaflets per branch with gentle tilt)
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x1E5924,
      roughness: 0.55,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const createLeafBranch = (yPos: number, angleY: number) => {
      const branch = new THREE.Group();
      const point = stemCurve.getPoint(yPos / 1.35);
      branch.position.set(point.x, point.y, point.z);
      branch.rotation.y = angleY;

      // Petiole
      const petioleGeo = new THREE.CylinderGeometry(0.008, 0.012, 0.25, 5);
      petioleGeo.rotateZ(Math.PI / 3);
      const petiole = new THREE.Mesh(petioleGeo, stemMat);
      petiole.position.set(0.1, 0.05, 0);
      branch.add(petiole);

      // Terminal and side leaflets
      const leafletGeo = this.createCurvedPetalGeometry(0.16, 0.32, 0.04);
      leafletGeo.rotateX(Math.PI / 2);

      const leafCenter = new THREE.Mesh(leafletGeo, leafMat);
      leafCenter.position.set(0.24, 0.12, 0);
      leafCenter.rotation.set(0.2, 0.3, -0.4);
      branch.add(leafCenter);

      const leafLeft = new THREE.Mesh(leafletGeo, leafMat);
      leafLeft.scale.setScalar(0.75);
      leafLeft.position.set(0.16, 0.08, 0.07);
      leafLeft.rotation.set(0.4, 0.6, -0.2);
      branch.add(leafLeft);

      const leafRight = new THREE.Mesh(leafletGeo, leafMat);
      leafRight.scale.setScalar(0.75);
      leafRight.position.set(0.16, 0.08, -0.07);
      leafRight.rotation.set(-0.4, -0.6, -0.2);
      branch.add(leafRight);

      return branch;
    };

    flowerGroup.add(createLeafBranch(0.45, 0.8));
    flowerGroup.add(createLeafBranch(0.8, 3.4));

    // 4. Blossom Head (Receptacle, Sepals & Spiral Petals)
    const blossomGroup = new THREE.Group();
    blossomGroup.position.set(0, 1.35, 0);

    // Green Receptacle (Rose hip base)
    const receptacleGeo = new THREE.SphereGeometry(0.14, 14, 14);
    receptacleGeo.scale(1, 1.3, 1);
    const receptacleMat = new THREE.MeshStandardMaterial({
      color: 0x2A632E,
      roughness: 0.6,
    });
    const receptacle = new THREE.Mesh(receptacleGeo, receptacleMat);
    receptacle.position.y = -0.05;
    blossomGroup.add(receptacle);

    // 5 Sepals hugging the base of the petals
    const sepalGeo = new THREE.ConeGeometry(0.05, 0.35, 5);
    sepalGeo.rotateX(Math.PI / 1.7); // curve outward
    const sepalMat = new THREE.MeshStandardMaterial({
      color: 0x225526,
      roughness: 0.65,
      side: THREE.DoubleSide
    });

    for (let s = 0; s < 5; s++) {
      const sAngle = (s * Math.PI * 2) / 5;
      const sepal = new THREE.Mesh(sepalGeo, sepalMat);
      sepal.position.set(Math.cos(sAngle) * 0.1, -0.04, Math.sin(sAngle) * 0.1);
      sepal.rotation.y = -sAngle;
      sepal.rotation.z = -0.5;
      blossomGroup.add(sepal);
    }

    // 5. Velvety Spiral Rose Petals
    const petalMaterial = new THREE.MeshStandardMaterial({
      color: flowerColor,
      roughness: 0.38,
      metalness: 0.04,
      side: THREE.DoubleSide,
      shadowSide: THREE.DoubleSide,
    });

    // Darker inner core for deep velvety realism
    const innerPetalMaterial = new THREE.MeshStandardMaterial({
      color: flowerColor.clone().multiplyScalar(0.72),
      roughness: 0.42,
      metalness: 0.04,
      side: THREE.DoubleSide,
    });

    // Inner Whorl: Tight spiral rose bud core (6 petals)
    const innerPetalGeo = this.createCurvedPetalGeometry(0.24, 0.36, -0.06);
    for (let i = 0; i < 6; i++) {
      const angle = i * 2.39996; // Golden angle spiral
      const radius = 0.05 + i * 0.015;
      const petal = new THREE.Mesh(innerPetalGeo, innerPetalMaterial);
      petal.position.set(Math.cos(angle) * radius, 0.05 + i * 0.01, Math.sin(angle) * radius);
      petal.rotation.y = -angle + Math.PI / 2;
      petal.rotation.x = 0.15 + i * 0.05;
      petal.rotation.z = (Math.random() - 0.5) * 0.1;
      blossomGroup.add(petal);
    }

    // Middle Whorl: Cupped opening petals (8 petals)
    const midPetalGeo = this.createCurvedPetalGeometry(0.36, 0.48, 0.08);
    for (let m = 0; m < 8; m++) {
      const angle = m * (Math.PI * 2 / 8) + 0.35;
      const radius = 0.15;
      const petal = new THREE.Mesh(midPetalGeo, petalMaterial);
      petal.position.set(Math.cos(angle) * radius, 0.08, Math.sin(angle) * radius);
      petal.rotation.y = -angle + Math.PI / 2;
      petal.rotation.x = 0.45;
      petal.castShadow = true;
      blossomGroup.add(petal);
    }

    // Outer Whorl: Large blooming guard petals with rolled edges (10-12 petals)
    const outerCount = isProtagonist ? 12 : 10;
    const outerPetalGeo = this.createCurvedPetalGeometry(0.48, 0.62, 0.18);
    for (let o = 0; o < outerCount; o++) {
      const angle = o * (Math.PI * 2 / outerCount);
      const radius = 0.24;
      const petal = new THREE.Mesh(outerPetalGeo, petalMaterial);
      petal.position.set(Math.cos(angle) * radius, 0.07, Math.sin(angle) * radius);
      petal.rotation.y = -angle + Math.PI / 2;
      petal.rotation.x = 0.78; // blooming outward reflex
      petal.rotation.z = (Math.random() - 0.5) * 0.15;
      petal.castShadow = true;
      blossomGroup.add(petal);
    }

    // 6. Realistic Specular Dewdrops on petals
    const dewdropGeo = new THREE.SphereGeometry(0.024, 10, 10);
    const dewdropMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.05,
      metalness: 0.15,
      transparent: true,
      opacity: 0.85,
    });

    const dropOffsets = [
      { x: 0.18, y: 0.22, z: 0.12 },
      { x: -0.16, y: 0.26, z: -0.14 },
      { x: 0.08, y: 0.28, z: -0.18 },
    ];
    for (const d of dropOffsets) {
      const drop = new THREE.Mesh(dewdropGeo, dewdropMat);
      drop.position.set(d.x, d.y, d.z);
      blossomGroup.add(drop);
    }

    // Protagonist Flower Special Glow aura
    if (isProtagonist) {
      const glowGeo = new THREE.SphereGeometry(0.65, 20, 20);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xFF4D6D,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      blossomGroup.add(glowMesh);
    }

    flowerGroup.add(blossomGroup);

    // Natural sway phase
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
          progress += 0.035;
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
      const swayX = Math.sin(time * 1.4 + phase) * 0.035;
      const swayZ = Math.cos(time * 1.1 + phase) * 0.025;
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
