import * as THREE from "../node_modules/three/build/three.module.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { BloomPass } from "three/examples/jsm/postprocessing/BloomPass.js";
import { Player } from "./Player.js";
import { Skybox } from "./Skybox.js";
import { Level } from "./Level.js";
import { Pacman } from "./Pacman.js";

THREE.Cache.enabled = true;

const LEVEL_TO_LOAD = "test";

class InvertedPacman {
	playerPacmanCollision = new Event("playerPacmanCollision");

	constructor() {
		this._init();

		this.update();
	}

	addToScene(object) {
		this.scene.add(object);
	}

	_init() {
		console.log("Initializing Inverted Pacman...");

		this._initRenderer();
		this._initScene();
		// this._initDebugCam();
	}

	_initRenderer() {
		const canvas = document.querySelector("canvas.webgl");
		this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
		// this.renderer.setClearColor(0xd4e6f1, 1);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(innerWidth, innerHeight);

		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFShadowMap;

		this.composer = new EffectComposer(this.renderer);

		window.addEventListener(
			"resize",
			() => {
				this._OnWindowResize();
			},
			false
		);
	}

	_initScene() {
		this.scene = new THREE.Scene();

		// this.scene.fog = new THREE.Fog(0xc5d4d9, 0, 50);

		this.sun = new THREE.DirectionalLight(0xffffff);
		this.sun.position.set(0, 1, 0);
		this.sun.target.position.set(0, 0, 0);
		this.sun.castShadow = true;
		this.sun.shadow.mapSize.width = 40960;
		this.sun.shadow.mapSize.height = 40960;
		this.sun.shadow.camera.near = 0.1;
		this.sun.shadow.camera.far = 1000;
		this.sun.shadow.camera.left = -200;
		this.sun.shadow.camera.right = 200;
		this.sun.shadow.camera.top = 200;
		this.sun.shadow.camera.bottom = -200;
		this.sun.shadow.bias = -0.0001;
		this.scene.add(this.sun);

		let light = new THREE.HemisphereLight(0xa5dfe8, 0x12782d, 0.5);
		// let light = new THREE.AmbientLight(0xbfd7d9, 0.3);
		this.scene.add(light);

		this.skybox = new Skybox();

		addEventListener("skyboxLoaded", () => {
			this.scene.add(this.skybox.skyGeometry);
		});

		Level.load(LEVEL_TO_LOAD);

		addEventListener("levelLoaded", () => {
			this.scene.add(Level.getLevel);

			this._initPlayer(this.renderer.domElement);

			this._initPacman();

			this._addDebugShapes();
		});
	}

	_addDebugShapes() {
		this.playerBoxHelper = new THREE.Box3Helper(
			this.player.boundingBox,
			0xff0000
		);
		this.pacmanBoxHelper = new THREE.Box3Helper(
			this.pacman.boundingBox,
			0xff0000
		);
		this.scene.add(this.playerBoxHelper);
		this.scene.add(this.pacmanBoxHelper);

		this.scene.add(new THREE.CameraHelper(this.sun.shadow.camera));
	}

	_initPlayer(rendererDomElement) {
		this.player = new Player(rendererDomElement);

		addEventListener("playerLoaded", () => {
			this.scene.add(this.player.getModel);
			this.scene.add(this.player.getCameraBase);

			this._OnWindowResize();

			this.ready = true;
			this.scene.add(new THREE.SpotLightHelper(this.player.lamp));

			const renderPass = new RenderPass(this.scene, this.player.camera);
			this.composer.addPass(renderPass);

			const bloomPass = new BloomPass(
				1, // strength
				25, // kernel size
				4, // sigma ?
				256 // blur render target resolution
			);
			this.composer.addPass(bloomPass);
		});
	}

	_initPacman() {
		this.pacman = new Pacman();

		addEventListener("pacmanLoaded", () => {
			this.scene.add(this.pacman.getPacmanModel);
		});
	}

	_initDebugCam() {
		const fov = 80;
		const aspect = 2;
		const near = 0.1;
		const far = 1000.0;
		this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		this.camera.position.set(0, 10, 10);
		this.camera.lookAt(new THREE.Vector3());

		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
	}

	_OnWindowResize() {
		this.player.camera.aspect = window.innerWidth / window.innerHeight;
		this.player.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

	checkPlayerPacmanCollision() {
		if (!this.player.ready || !this.pacman.ready) {
			return;
		}

		this.player.boundingBox.setFromObject(this.player.model);
		this.pacman.boundingBox.setFromObject(this.pacman.model);

		this.playerBoxHelper.box = this.player.boundingBox;
		this.pacmanBoxHelper.box = this.pacman.boundingBox;

		if (this.player.boundingBox.intersectsBox(this.pacman.boundingBox)) {
			dispatchEvent(this.playerPacmanCollision);
		}
	}

	clock = new THREE.Clock();

	// update() {
	// 	if (!this.ready) {
	// 		this.update();
	// 		return;
	// 	}
	// 	requestAnimationFrame(this.update);
	// 	this.renderer.render(this.scene, this.player.camera);
	// 	const delta = this.clock.getDelta();
	// 	// this.composer.render(delta);
	// }

	update() {
		requestAnimationFrame(() => {
			if (!this.ready) {
				this.update();
				return;
			}
			let delta = this.clock.getDelta();
			this.renderer.render(this.scene, this.player.camera);
			// this.composer.render(delta);

			this.player.update(delta, this.clock.getElapsedTime());

			this.pacman.update(delta, this.player.getPosition);

			this.skybox.update(delta, this.sun);

			this.checkPlayerPacmanCollision();

			this.update();
		});
	}
}

new InvertedPacman();
