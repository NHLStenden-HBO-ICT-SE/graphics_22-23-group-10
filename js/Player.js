import { GLTFLoader } from "../node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "../node_modules/three/build/three.module.js";
import { Level } from "./Level.js";
import { DynamicBody } from "./CollisionSystem/DynamicBody.js";
import { Camera } from "./Camera.js";
import { loadShader } from "./ShaderLoader.js";

export class Player extends DynamicBody {
	Actions = Object.freeze({
		IDLE: Symbol(0),
		WALK: Symbol(1),
		RUN: Symbol(2),
	});

	playerLoaded = new Event("playerLoaded");

	#MODELPATH = "../models/ghost.glb";

	#walkVelocity = 6;
	#runVelocity = 20;

	ready = false;
	#currentAction = this.Actions.IDLE;
	#walkDirection = new THREE.Vector3();
	#rotateAngle = new THREE.Vector3(0, 1, 0);
	#rotateQuaternion = new THREE.Quaternion();

	#keysPressed = { w: false, a: false, s: false, d: false, shift: false };
	W = "w";
	A = "a";
	S = "s";
	D = "d";
	SHIFT = "shift";
	DIRECTIONS = [this.W, this.A, this.S, this.D];

	model;
	camera;

	get getModel() {
		return this.model;
	}

	get getCameraBase() {
		return this.camera.rotY;
	}

	constructor(rendererDomElement) {
		super();
		this._loadPlayer(rendererDomElement);
		this._initListeners();
	}

	update(delta, timeElapsed) {
		if (!this.ready) {
			return;
		}

		this._movePlayer(delta);
		this.camera.update(delta, this.getPosition);

		this.updateShader(timeElapsed);
	}

	updateShader(timeElapsed) {
		this.model.children[0].material.uniforms.u_time.value = timeElapsed;
		// console.log(this.model.children[0].material);
	}

	_movePlayer(delta) {
		const directionPressed = this.DIRECTIONS.some(
			(key) => this.#keysPressed[key] == true
		);

		this.#currentAction = this.Actions.IDLE;

		// Set state
		if (directionPressed) {
			this.#currentAction = this.Actions.WALK;
		}
		if (this.#keysPressed.shift && directionPressed) {
			this.#currentAction = this.Actions.RUN;
		}

		if (this.#currentAction != this.Actions.IDLE) {
			// Calculate camera direction vector
			this.camera.getWorldDirection(this.#walkDirection);

			// Calculate what direction player wants to go
			let directionOffset = this.directionOffset(this.#keysPressed);

			// Calculate camera direction angle
			let cameraDirection = Math.atan2(
				this.#walkDirection.x,
				this.#walkDirection.z
			);

			// Rotate player
			this.#rotateQuaternion.setFromAxisAngle(
				this.#rotateAngle,
				cameraDirection + directionOffset + Math.PI
			);
			this.model.quaternion.rotateTowards(this.#rotateQuaternion, 0.2);

			// Calculate walk direction based on input and camera angle
			this.#walkDirection.y = 0;
			this.#walkDirection.normalize();
			this.#walkDirection.applyAxisAngle(this.#rotateAngle, directionOffset);

			// Set velocity
			let velocity;
			switch (this.#currentAction) {
				case this.Actions.WALK:
					velocity = this.#walkVelocity;
					break;
				case this.Actions.RUN:
					velocity = this.#runVelocity;
					break;
			}

			// Move player
			const movementVector = new THREE.Vector3(
				this.#walkDirection.x * velocity * delta,
				0,
				this.#walkDirection.z * velocity * delta
			);
			this.moveAndCollide(movementVector, this.camera);
		}
	}

	_initCamera(rendererDomElement) {
		this.camera = new Camera(this.getPosition);
	}

	_loadPlayer(rendererDomElement) {
		let self = this;
		new GLTFLoader().load(this.#MODELPATH, function (model) {
			const mesh = model.scene;

			mesh.position.x = Level.getPlayerSpawn.x;
			mesh.position.z = Level.getPlayerSpawn.z;
			self.model = mesh;

			loadShader("ghost", shaderLoaded);

			function shaderLoaded(material) {
				material.transparent = true;
				material.lights = true;
				mesh.traverse(function (obj) {
					if (obj.isMesh) {
						if (obj.name == "Ghost") {
							obj.castShadow = true;
							obj.receiveShadow = true;
							obj.material = material;
						}
					}
				});

				self.ready = true;
				self._initCamera(rendererDomElement);
				self.calculateExtents(mesh.children[0].children[0].geometry); // Ugly hardcoding, but oh well
				dispatchEvent(self.playerLoaded);
			}
		});
	}

	_initListeners() {
		document.addEventListener(
			"keydown",
			(event) => {
				this.#keysPressed[event.key.toLowerCase()] = true;
			},
			false
		);
		document.addEventListener(
			"keyup",
			(event) => {
				this.#keysPressed[event.key.toLowerCase()] = false;
			},
			false
		);
	}

	directionOffset(keysPressed) {
		// Get direction vector
		let dir = new THREE.Vector2(
			keysPressed.a - keysPressed.d,
			keysPressed.w - keysPressed.s
		);

		// Convert to radians
		let directionOffset = Math.atan2(dir.x, dir.y);

		return directionOffset;
	}
}
