import * as THREE from 'three';

export class SkyManager {
  public group: THREE.Group;
  public sunGroup: THREE.Group;
  public moonGroup: THREE.Group;
  private clouds: THREE.Group[] = [];
  private leftEyeScale: THREE.Vector3;
  private rightEyeScale: THREE.Vector3;
  private leftEyeMesh: THREE.Mesh;
  private rightEyeMesh: THREE.Mesh;
  private blinkTimer: number = 0;
  private isBlinking: boolean = false;
  private hemiLight: THREE.HemisphereLight;
  private dirLight: THREE.DirectionalLight;
  private skyDome: THREE.Mesh;

  constructor(hemiLight: THREE.HemisphereLight, dirLight: THREE.DirectionalLight) {
    this.group = new THREE.Group();
    this.hemiLight = hemiLight;
    this.dirLight = dirLight;

    // 1. Sky Dome Sphere with gradient material
    const skyGeo = new THREE.SphereGeometry(70, 32, 24);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x87CEEB,
      side: THREE.BackSide,
      fog: false,
    });
    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.group.add(this.skyDome);

    // 2. Animated Cute Smiling Sun
    this.sunGroup = new THREE.Group();
    this.sunGroup.position.set(22, 26, -18);

    // Sun Golden Body Sphere
    const sunBodyGeo = new THREE.SphereGeometry(2.4, 24, 24);
    const sunBodyMat = new THREE.MeshBasicMaterial({
      color: 0xFFD15C,
    });
    const sunBody = new THREE.Mesh(sunBodyGeo, sunBodyMat);
    this.sunGroup.add(sunBody);

    // Sun Glowing Corona Ring
    const coronaGeo = new THREE.RingGeometry(2.3, 3.8, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xFFB300,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const corona = new THREE.Mesh(coronaGeo, coronaMat);
    corona.lookAt(0, 0, 1);
    this.sunGroup.add(corona);

    // Sun Rays Petals
    const rayCount = 12;
    for (let r = 0; r < rayCount; r++) {
      const angle = (r * Math.PI * 2) / rayCount;
      const rayGeo = new THREE.ConeGeometry(0.35, 1.2, 5);
      const rayMat = new THREE.MeshBasicMaterial({ color: 0xFFA000 });
      const ray = new THREE.Mesh(rayGeo, rayMat);
      ray.position.set(Math.cos(angle) * 3.1, Math.sin(angle) * 3.1, 0);
      ray.rotation.z = angle - Math.PI / 2;
      this.sunGroup.add(ray);
    }

    // Expressive Smiling Face (Face Plate)
    const facePlate = new THREE.Group();
    facePlate.position.set(0, 0, 2.3);

    // Cute Tender Eyes with gentle blink support
    const eyeGeo = new THREE.SphereGeometry(0.24, 12, 12);
    eyeGeo.scale(1, 1.25, 0.4);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x3E2723 });

    this.leftEyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    this.leftEyeMesh.position.set(-0.7, 0.3, 0);
    facePlate.add(this.leftEyeMesh);

    this.rightEyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    this.rightEyeMesh.position.set(0.7, 0.3, 0);
    facePlate.add(this.rightEyeMesh);

    this.leftEyeScale = this.leftEyeMesh.scale;
    this.rightEyeScale = this.rightEyeMesh.scale;

    // Rosy Cheeks
    const cheekGeo = new THREE.CircleGeometry(0.32, 16);
    const cheekMat = new THREE.MeshBasicMaterial({
      color: 0xFF6B8B,
      transparent: true,
      opacity: 0.45,
    });
    const leftCheek = new THREE.Mesh(cheekGeo, cheekMat);
    leftCheek.position.set(-1.05, -0.05, 0.05);
    facePlate.add(leftCheek);

    const rightCheek = new THREE.Mesh(cheekGeo, cheekMat);
    rightCheek.position.set(1.05, -0.05, 0.05);
    facePlate.add(rightCheek);

    // Tender Sweet Curved Smile
    const smileCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-0.6, 0.0, 0.05),
      new THREE.Vector3(-0.3, -0.45, 0.05),
      new THREE.Vector3(0.3, -0.45, 0.05),
      new THREE.Vector3(0.6, 0.0, 0.05)
    );
    const smileGeo = new THREE.TubeGeometry(smileCurve, 16, 0.06, 6, false);
    const smileMat = new THREE.MeshBasicMaterial({ color: 0x4E342E });
    const smileMesh = new THREE.Mesh(smileGeo, smileMat);
    facePlate.add(smileMesh);

    this.sunGroup.add(facePlate);
    this.group.add(this.sunGroup);

    // 3. Romantic Glowing Moon for night mode
    this.moonGroup = new THREE.Group();
    this.moonGroup.position.set(-24, 22, -16);
    const moonGeo = new THREE.SphereGeometry(2.1, 24, 24);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xFEF3C7 });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonGroup.add(moonMesh);

    const moonGlowGeo = new THREE.SphereGeometry(2.6, 20, 20);
    const moonGlowMat = new THREE.MeshBasicMaterial({
      color: 0xE0E7FF,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
    });
    this.moonGroup.add(new THREE.Mesh(moonGlowGeo, moonGlowMat));
    this.moonGroup.visible = false;
    this.group.add(this.moonGroup);

    // 4. Procedural Soft Drifting Clouds
    this.createClouds();
  }

  private createClouds(): void {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.9,
      transparent: true,
      opacity: 0.82,
      flatShading: true,
    });

    const cloudCount = 6;
    for (let c = 0; c < cloudCount; c++) {
      const cloud = new THREE.Group();
      const puffCount = 5 + Math.floor(Math.random() * 4);

      for (let p = 0; p < puffCount; p++) {
        const radius = 1.2 + Math.random() * 1.4;
        const puffGeo = new THREE.DodecahedronGeometry(radius, 1);
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set(
          (p - puffCount / 2) * 1.3 + (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.3) * 0.6,
          (Math.random() - 0.5) * 0.8
        );
        cloud.add(puff);
      }

      cloud.position.set(
        (c - cloudCount / 2) * 12 + (Math.random() - 0.5) * 5,
        14 + Math.random() * 6,
        -12 + (Math.random() - 0.5) * 16
      );
      (cloud as any).speed = 0.4 + Math.random() * 0.3;
      this.clouds.push(cloud);
      this.group.add(cloud);
    }
  }

  /**
   * Updates sky tones, sun position, eye blink animation, and cloud drift.
   */
  public update(time: number, delta: number, isNight: boolean = false): void {
    // 1. Eye Blink Animation (blinks every 4 to 6 seconds)
    this.blinkTimer += delta;
    if (this.blinkTimer > 4.5) {
      this.isBlinking = true;
      if (this.blinkTimer > 4.75) {
        this.isBlinking = false;
        this.blinkTimer = 0;
        this.leftEyeScale.y = 1.25;
        this.rightEyeScale.y = 1.25;
      } else {
        // Fast squeeze blink
        this.leftEyeScale.y = 0.12;
        this.rightEyeScale.y = 0.12;
      }
    }

    // 2. Continuous organic sun swaying & slow sky arc
    const sunAngle = time * 0.04;
    const sunX = Math.cos(sunAngle) * 26;
    const sunY = 18 + Math.sin(sunAngle) * 7;
    const sunZ = -18 + Math.sin(sunAngle * 0.5) * 4;
    this.sunGroup.position.set(sunX, sunY, sunZ);
    this.sunGroup.lookAt(0, 5, 0); // Always face gently towards garden center

    // Subtle sun floating bob
    this.sunGroup.position.y += Math.sin(time * 1.5) * 0.2;

    // 3. Clouds Drifting
    for (const cloud of this.clouds) {
      cloud.position.x += (cloud as any).speed * delta;
      if (cloud.position.x > 35) {
        cloud.position.x = -35;
      }
    }

    // 4. Smooth Day / Night Transition
    if (isNight) {
      this.sunGroup.visible = false;
      this.moonGroup.visible = true;
      (this.skyDome.material as THREE.MeshBasicMaterial).color.setHex(0x0A0F24); // Midnight indigo
      this.hemiLight.color.setHex(0x312E81);
      this.hemiLight.groundColor.setHex(0x0F172A);
      this.dirLight.color.setHex(0x818CF8);
      this.dirLight.intensity = 0.45;
    } else {
      this.sunGroup.visible = true;
      this.moonGroup.visible = false;
      (this.skyDome.material as THREE.MeshBasicMaterial).color.setHex(0xFDE2E4); // Soft romantic morning peach/blue
      this.hemiLight.color.setHex(0xFFEDD5);
      this.hemiLight.groundColor.setHex(0x166534);
      this.dirLight.color.setHex(0xFFF7ED);
      this.dirLight.intensity = 1.2;
    }
  }
}
