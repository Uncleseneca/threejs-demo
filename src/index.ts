import {
  WebGLRenderer,
  Color,
  PerspectiveCamera,
  Scene,
  PlaneGeometry,
  MeshLambertMaterial,
  Mesh,
  DoubleSide,
  DirectionalLight,
  AmbientLight,
  PCFSoftShadowMap,
  Texture,
  RepeatWrapping,
  Raycaster,
  Vector2,
} from 'three';
import { resizeRenderer, fetchGltf, fetchTexture } from './util';
import { CameraController } from './CameraController';
import characterGltfSrc from './assets/knight_runnig/scene.gltf';
import grassImageUrl from './assets/grass.jpg';
import { CharacterController } from './CharacterController';

async function start() {
  const renderer = createRenderer();
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  const camera = new PerspectiveCamera(75, 1, 0.1, 100);
  const cameraController = new CameraController(6, 0.01);
  cameraController.setRotation(Math.PI / 8, 0);
  const scene = new Scene();

  const groundTexture = await fetchTexture(grassImageUrl);
  groundTexture.wrapS = RepeatWrapping;
  groundTexture.wrapT = RepeatWrapping;
  groundTexture.repeat.set(6, 6);

  const ground = createGround(groundTexture);
  scene.add(ground);

  const characterGltf = await fetchGltf(characterGltfSrc);
  characterGltf.scene.traverse((obj) => {
    obj.castShadow = true;
    obj.receiveShadow = true;
  });
  characterGltf.scene.scale.set(0.5, 0.5, 0.5);
  scene.add(characterGltf.scene);

  const sun = createSun();
  sun.position.set(1, 1, 1).normalize();
  scene.add(sun);

  const ambient = new AmbientLight();
  scene.add(ambient);

  const characterController = new CharacterController(characterGltf.scene);

  document.addEventListener('mouseup', (e) => {
    const mouse = new Vector2(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );
    const raycaster = new Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0 && intersects[0].object.name === 'ground') {
      characterController.startMovement(intersects[0].point);
    }
  });

  const render = () => {
    resizeRenderer(renderer, camera);

    cameraController.update(camera);

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };

  render();
}

start();

export function createRenderer() {
  const renderer = new WebGLRenderer({ antialias: true });
  document.body.appendChild(renderer.domElement);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(new Color('white'));

  renderer.domElement.style.position = 'fixed';
  renderer.domElement.style.left = '0';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';

  return renderer;
}

function createGround(texture: Texture) {
  const geometry = new PlaneGeometry(100, 100);
  const material = new MeshLambertMaterial({
    color: 'gray',
    side: DoubleSide,
    map: texture,
  });
  const ground = new Mesh(geometry, material);
  ground.rotation.x = Math.PI / 2;
  ground.receiveShadow = true;
  ground.name = 'ground';
  return ground;
}

function createSun() {
  const sun = new DirectionalLight('white');
  const shadowCameraSize = 10;
  sun.castShadow = true;
  sun.shadow.camera.near = -shadowCameraSize;
  sun.shadow.camera.far = shadowCameraSize;
  sun.shadow.camera.left = -shadowCameraSize;
  sun.shadow.camera.right = shadowCameraSize;
  sun.shadow.camera.top = shadowCameraSize;
  sun.shadow.camera.bottom = -shadowCameraSize;
  return sun;
}
