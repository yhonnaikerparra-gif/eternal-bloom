import * as THREE from 'three';
import { GardenManager } from './GardenManager.js';
import { SkyManager } from './SkyManager.js';
import { SpaceManager } from './SpaceManager.js';
import { VisualElement, GardenState } from '../services/api.js';

export class RomanticScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private hemiLight: THREE.HemisphereLight;
  private dirLight: THREE.DirectionalLight;

  public gardenManager: GardenManager;
  public skyManager: SkyManager;
  public spaceManager: SpaceManager;

  private clock: THREE.Clock;
  private reqId: number | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private onElementSelected: (element: VisualElement) => void;

  // Camera animation targets
  private targetCamPos: THREE.Vector3 = new THREE.Vector3(0, 2.2, 4.5);
  private targetLookAt: THREE.Vector3 = new THREE.Vector3(0, 1.2, 0);
  private currentLookAt: THREE.Vector3 = new THREE.Vector3(0, 1.2, 0);

  // Simulation / Stage override
  public currentStage: string = 'STAGE_1_FIRST_BLOOM';
  public isNight: boolean = false;

  constructor(
    container: HTMLElement,
    onElementSelected: (element: VisualElement) => void
  ) {
    this.container = container;
    this.onElementSelected = onElementSelected;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xFDF2F8, 0.012);

    // 2. Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 1000);
    this.camera.position.set(0, 2.2, 4.5);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    // 4. Romantic Ambient & Sunlight Lighting
    this.hemiLight = new THREE.HemisphereLight(0xFFEDD5, 0x166534, 1.1);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xFFF7ED, 1.3);
    this.dirLight.position.set(18, 24, 12);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 70;
    this.dirLight.shadow.camera.left = -15;
    this.dirLight.shadow.camera.right = 15;
    this.dirLight.shadow.camera.top = 15;
    this.dirLight.shadow.camera.bottom = -15;
    this.scene.add(this.dirLight);

    // 5. Managers
    this.skyManager = new SkyManager(this.hemiLight, this.dirLight);
    this.scene.add(this.skyManager.group);

    this.gardenManager = new GardenManager();
    this.scene.add(this.gardenManager.group);

    this.spaceManager = new SpaceManager();
    this.scene.add(this.spaceManager.group);

    // 6. Listeners
    window.addEventListener('resize', this.onWindowResize);
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);

    // Start loop
    this.animate();
  }

  private onWindowResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onPointerDown = (event: MouseEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Check interaction targets: flowers in garden, stars in space
    const targetGroups: THREE.Group[] = [];
    if (this.currentStage === 'STAGE_4_EARTH_ASCENT' || this.currentStage === 'STAGE_5_COSMIC_STARS' || this.currentStage === 'STAGE_6_UNIVERSE_OF_LOVE') {
      targetGroups.push(...this.spaceManager.getStarMeshes());
    } else {
      targetGroups.push(...this.gardenManager.getFlowerMeshes());
    }

    const intersects = this.raycaster.intersectObjects(targetGroups, true);
    if (intersects.length > 0) {
      // Find top group containing elementData
      let obj: THREE.Object3D | null = intersects[0].object;
      while (obj && !(obj as any).elementData) {
        obj = obj.parent;
      }

      if (obj && (obj as any).elementData) {
        const data = (obj as any).elementData as VisualElement;
        this.onElementSelected(data);
      }
    }
  };

  /**
   * Applies camera position & visual stage adjustments based on progression.
   */
  public setStage(stage: string, flowerCount: number): void {
    this.currentStage = stage;

    if (stage === 'STAGE_1_FIRST_BLOOM') {
      // Intimate close-up on the single protagonist flower
      this.gardenManager.group.visible = true;
      this.skyManager.group.visible = true;
      this.spaceManager.group.visible = false;
      this.scene.fog = new THREE.FogExp2(0xFDF2F8, 0.012);

      this.targetCamPos.set(0, 1.9, 4.0);
      this.targetLookAt.set(0, 1.1, 0);

    } else if (stage === 'STAGE_2_GARDEN_GROWTH') {
      // Expanding garden view: camera draws back proportionally to flower count
      this.gardenManager.group.visible = true;
      this.skyManager.group.visible = true;
      this.spaceManager.group.visible = false;
      this.scene.fog = new THREE.FogExp2(0xFDF2F8, 0.008);

      const zoomBack = Math.min(18, 4.5 + Math.sqrt(flowerCount) * 0.7);
      const camY = Math.min(12, 2.5 + Math.sqrt(flowerCount) * 0.45);

      this.targetCamPos.set(0, camY, zoomBack);
      this.targetLookAt.set(0, 0.8, 0);

    } else if (stage === 'STAGE_4_EARTH_ASCENT') {
      // Day 365: Cinematic Earth View from Space!
      this.gardenManager.group.visible = false;
      this.skyManager.group.visible = false;
      this.spaceManager.group.visible = true;
      this.scene.fog = new THREE.FogExp2(0x050814, 0.001); // Space void fog

      this.targetCamPos.set(0, 6, 32);
      this.targetLookAt.set(0, 0, 0);

    } else if (stage === 'STAGE_5_COSMIC_STARS' || stage === 'STAGE_6_UNIVERSE_OF_LOVE') {
      // Deep Space & Stars of Love
      this.gardenManager.group.visible = false;
      this.skyManager.group.visible = false;
      this.spaceManager.group.visible = true;
      this.scene.fog = new THREE.FogExp2(0x030712, 0.0008);

      this.targetCamPos.set(0, 12, 46);
      this.targetLookAt.set(0, 0, 0);
    }
  }

  public updateElements(elements: VisualElement[]): void {
    this.gardenManager.updateElements(elements);
    this.spaceManager.updateElements(elements);
  }

  private animate = () => {
    this.reqId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    // 1. Smooth Camera Rig Interpolation
    this.camera.position.lerp(this.targetCamPos, 0.04);
    this.currentLookAt.lerp(this.targetLookAt, 0.04);
    this.camera.lookAt(this.currentLookAt);

    // Subtle gentle camera breathing sway
    this.camera.position.x += Math.sin(time * 0.4) * 0.003;
    this.camera.position.y += Math.cos(time * 0.5) * 0.003;

    // 2. Update Sub-managers
    this.skyManager.update(time, delta, this.isNight);
    this.gardenManager.update(time, delta);
    this.spaceManager.update(time, delta, this.camera.position);

    // 3. Render
    this.renderer.render(this.scene, this.camera);
  };

  public destroy(): void {
    if (this.reqId) cancelAnimationFrame(this.reqId);
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
