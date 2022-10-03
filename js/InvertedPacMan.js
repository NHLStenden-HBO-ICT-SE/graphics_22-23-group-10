import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js";
import * as THREE from "../node_modules/three/build/three.module.js";
import { Menu } from "./Menu";
import { Player } from "./Player.js";
import { Skybox } from "./Skybox.js";
import { Level } from "./Level.js";
import { Pacman } from "./Pacman.js";

THREE.Cache.enabled = true;

const LEVEL_TO_LOAD = "test2";

class InvertedPacman {
	playerPacmanCollision = new Event("playerPacmanCollision");

	constructor() {
		this.menu = new Menu();
		document.getElementById('play_button').addEventListener('click', () => {
			this.startGame();
			document.getElementById('main_menu').remove();
		});
	}

	startGame() {
		this._init();
		this._RAF();
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

		this.sun = new THREE.DirectionalLight(0xffffff);
		this.sun.position.set(0, 1, 0);
		this.sun.target.position.set(0, 0, 0);
		this.sun.castShadow = true;
		this.sun.shadow.mapSize.width = 4096 * 10;
		this.sun.shadow.mapSize.height = 4096 * 10;
		this.sun.shadow.camera.near = 0.1;
		this.sun.shadow.camera.far = 1000;
		this.sun.shadow.camera.left = -500;
		this.sun.shadow.camera.right = 500;
		this.sun.shadow.camera.top = 500;
		this.sun.shadow.camera.bottom = -500;
		this.sun.shadow.bias = -0.0001;
		this.scene.add(this.sun);

		let light = new THREE.HemisphereLight(0x404040, 0x12782d, 0.5);
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

			// this._addDebugShapes();
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

		// this.scene.add(new THREE.CameraHelper(this.sun.shadow.camera));
	}

	_initPlayer(rendererDomElement) {
		this.player = new Player(rendererDomElement);

		addEventListener("playerLoaded", () => {
			this.scene.add(this.player.getModel);
			this.scene.add(this.player.getCameraBase);

			this._OnWindowResize();

			this.ready = true;
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

		// this.playerBoxHelper.box = this.player.boundingBox;
		// this.pacmanBoxHelper.box = this.pacman.boundingBox;

		if (this.player.boundingBox.intersectsBox(this.pacman.boundingBox)) {
			dispatchEvent(this.playerPacmanCollision);
		}
	}

	clock = new THREE.Clock();

	_RAF() {
		requestAnimationFrame(() => {
			if (!this.ready) {
				this._RAF();
				return;
			}
			this.renderer.render(this.scene, this.player.camera);
			// this.renderer.render(this.scene, this.camera);
			let delta = this.clock.getDelta();
			// delta = THREE.getDelta();

			this.player.update(delta);

			this.pacman.update(delta, this.player.getPosition);

			this.skybox.update(delta, this.sun);

			this.checkPlayerPacmanCollision();

			this._RAF();
		});
	}
}

new InvertedPacman();
