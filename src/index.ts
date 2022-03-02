
import * as THREE from 'three';
import * as Nodes from 'three/examples/jsm/nodes/Nodes';
import { Clock, Material, Mesh, MeshLambertMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, PointLight, SphereGeometry, Vector3, WebGLRenderer, PCFShadowMap, Texture, WebGLRenderTarget, TextureLoader, RepeatWrapping } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as Stats from 'stats.js'
import { triplanarMapping, varyingVec3, attributes, float, NodeShaderMaterial, standardMaterial, uniformSampler2d } from 'three-shader-graph';

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

  const sphere = new SphereGeometry(5,20,20);
  //const material = createMaterial(texture)
  const material = createNodeMaterial(texture)
  const mesh = new Mesh(sphere, material)

  scene.add(mesh)

  function render() {
    stats.begin()

    renderer.render(scene, camera)
    stats.end()
    requestAnimationFrame(render)


  }
  render()

}

function createNodeMaterial(texture: Texture) {
  let mtl = new Nodes.MeshStandardNodeMaterial();
  mtl.metalness = 0
  mtl.roughness = 1
  let triplanarMapping = new Nodes.FunctionNode([
          // Reference: https://github.com/keijiro/StandardTriplanar
          'vec4 triplanar_mapping( sampler2D map, vec3 normal, vec3 position, float scale ) {',

          // Blending factor of triplanar mapping
          '   vec3 bf = normalize( abs( normal ) );',
          '   bf /= dot( bf, vec3( 1.0 ) );',

          // Triplanar mapping
          '   vec2 tx = position.yz * scale;',
          '   vec2 ty = position.zx * scale;',
          '   vec2 tz = position.xy * scale;',

          // Base color
          '   vec4 cx = texture2D(map, tx) * bf.x;',
          '   vec4 cy = texture2D(map, ty) * bf.y;',
          '   vec4 cz = texture2D(map, tz) * bf.z;',

          '   return cx + cy + cz;',

          '}'
  ].join('\n'));

  let scale = new Nodes.FloatNode(.2);

  let nn = new Nodes.TextureNode(texture);
  let rr = new Nodes.NormalNode(Nodes.NormalNode.WORLD);
  let pp = new Nodes.PositionNode(Nodes.PositionNode.WORLD);

  var triplanarMappingTexture = new Nodes.FunctionCallNode(triplanarMapping, [nn, rr, pp, scale]);
  mtl.color = triplanarMappingTexture

  return mtl

}

function createMaterial(texture: Texture) {
  const sampler = uniformSampler2d("map")
  const scale = float(0.2)
  const color = triplanarMapping(sampler, varyingVec3(attributes.normal), varyingVec3(attributes.position), scale).rgb()

  let material = new NodeShaderMaterial({
    color: standardMaterial({ color }),
    uniforms: {
      time: { value: 0 },
      map: { value: texture }
    }
  })
  material.uniforms.map.value = texture
  return material
}

init()