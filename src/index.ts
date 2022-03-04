
import * as THREE from 'three';
import { Clock, Material, Mesh, MeshLambertMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, PointLight, SphereGeometry, Vector3, WebGLRenderer, PCFShadowMap, Texture, WebGLRenderTarget, TextureLoader, RepeatWrapping } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as Stats from 'stats.js'
import { triplanarMapping, varyingVec3, attributes, float, NodeShaderMaterial, standardMaterial, uniformSampler2d, colorToNormal, textureSampler2d } from 'three-shader-graph';

export function init() {

  var stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  
  const outputContainer = document.getElementById('output');
  outputContainer.appendChild(stats.dom);

  if (outputContainer == null) {
    throw new Error("Missing output container element")
  }

  // renderer setup
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0, 1);
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFShadowMap
  outputContainer.appendChild(renderer.domElement);

  // camera setup
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.set(0, 15, 15);
  camera.far = 100;
  camera.lookAt(new Vector3(0, 0, 0))
  camera.updateProjectionMatrix();

  function onResize(camera: PerspectiveCamera, renderer: WebGLRenderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );
  }

  window.addEventListener('resize', () => onResize(camera, renderer), false);
  onResize(camera, renderer);

  new OrbitControls(camera, renderer.domElement);

  const scene = new THREE.Scene()

  const hemilight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.3);
  scene.add(hemilight);

  const pointlight = new PointLight(null, 0.4)
  pointlight.position.set(10, 10, 5)
  pointlight.castShadow = true
  scene.add(pointlight)

  const texture = new TextureLoader().load('assets/bricks.png');
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping

  const normalMap = new TextureLoader().load('assets/bricks_normal.png');
  normalMap.wrapS = RepeatWrapping
  normalMap.wrapT = RepeatWrapping

  const sphere = new SphereGeometry(5,20,20);
  const material = createMaterial(texture, normalMap)
  const mesh = new Mesh(sphere, material)

  sphere.computeTangents()

  scene.add(mesh)

  function render() {
    stats.begin()

    renderer.render(scene, camera)
    stats.end()
    requestAnimationFrame(render)


  }
  render()

}

function createMaterial(texture: Texture, normalMap: Texture) {
  const sampler = textureSampler2d(texture)
  const normalSampler = textureSampler2d(normalMap)
  
  const scale = float(0.2)

  const color = triplanarMapping(sampler, scale).rgb()

  const normal = colorToNormal(triplanarMapping(normalSampler, scale), 0.5)

  let material = new NodeShaderMaterial({
    color: standardMaterial({ color, normal })
  })
  return material
}

init()