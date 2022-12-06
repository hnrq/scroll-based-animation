import "./style.css";
import * as THREE from "three";
import * as dat from "lil-gui";
import anime from "animejs";

/**
 * Debug
 */
const gui = new dat.GUI();

const parameters = {
  materialColor: "#ffeded",
  particleColor: "#ffffff",
};

gui.addColor(parameters, "materialColor").onChange((value: string) => {
  material.color.set(value);
});

gui.addColor(parameters, "particleColor").onChange((value: string) => {
  particlesMaterial.color.set(value);
});

/**
 * Base
 */
// Canvas
const canvas: HTMLCanvasElement | null = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Objects
 */
// Textures
const textureLoader = new THREE.TextureLoader();
const gradientTexture = textureLoader.load("textures/gradients/3.jpg");
gradientTexture.magFilter = THREE.NearestFilter;

// Materials
const material = new THREE.MeshToonMaterial({
  color: parameters.materialColor,
  gradientMap: gradientTexture,
});

// Mesh
const objectsDistance = 3.5;
const mesh1 = new THREE.Mesh(
  new THREE.TorusGeometry(0.5, 0.2, 16, 60),
  material
);
const mesh2 = new THREE.Mesh(new THREE.BoxGeometry(), material);
const mesh3 = new THREE.Mesh(
  new THREE.TorusKnotGeometry(0.4, 0.2, 100, 16),
  material
);

const sectionMeshes = [mesh1, mesh2, mesh3];
sectionMeshes.forEach((mesh, index) => {
  mesh.position.y = -objectsDistance * index;
  mesh.position.x = index % 2 === 0 ? 1 : -1;
});
mesh1.position.y = -objectsDistance * 0;
mesh2.position.y = -objectsDistance * 1;
mesh3.position.y = -objectsDistance * 2;

scene.add(...sectionMeshes);

/**
 * Particles
 */

// Geometry
const particlesCount = 400;
const positions = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount; i++) {
  positions[i * 3 + 0] = (Math.random() - 0.5) * 10;
  positions[i * 3 + 1] =
    objectsDistance * 0.5 -
    Math.random() * objectsDistance * sectionMeshes.length;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions, 3)
);

//Material
const particlesMaterial = new THREE.PointsMaterial({
  color: parameters.materialColor,
  sizeAttenuation: true,
  size: 0.03,
});

// Points
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

/**
 * Lights
 */

const directionalLight = new THREE.DirectionalLight("#FFFFFF", 1);
directionalLight.position.set(1, 1, 0);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Group
const cameraGroup = new THREE.Group();
scene.add(cameraGroup);

// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.z = 6;
cameraGroup.add(camera);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: <HTMLCanvasElement>canvas,
  alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Scroll
 */
let scrollY = window.scrollY;

window.addEventListener("scroll", () => {
  scrollY = window.scrollY;
});

const sections = Array.from(document.getElementsByClassName("section"));

const observer = new IntersectionObserver(
  ([entry]) => {
    if (entry.isIntersecting) {
      anime({
        targets: [sectionMeshes[sections.indexOf(entry.target)].rotation],
        duration: 800,
        easing: "easeInOutSine",
        x: "+=6",
        y: "+=2",
        z: "+=1.5",
      });
    }
  },
  { threshold: 0.9 }
);

sections.forEach((section) => {
  observer.observe(section);
});

/**
 * Cursor
 */

const cursor = { x: 0, y: 0 };
window.addEventListener("mousemove", (event) => {
  cursor.x = event.clientX / sizes.width - 0.5;
  cursor.y = event.clientY / sizes.height - 0.5;
});

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // Animate camera
  camera.position.y = (-scrollY / sizes.height) * objectsDistance;

  const parallaxX = cursor.x * 0.2;
  const parallaxY = -cursor.y * 0.2;
  cameraGroup.position.x +=
    (parallaxX - cameraGroup.position.x) * 5 * deltaTime;
  cameraGroup.position.y +=
    (parallaxY - cameraGroup.position.y) * 5 * deltaTime;

  // Animate meshes
  sectionMeshes.forEach((mesh) => {
    mesh.rotation.x += deltaTime * 0.12;
    mesh.rotation.y += deltaTime * 0.1;
  });

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
