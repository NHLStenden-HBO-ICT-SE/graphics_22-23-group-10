import * as THREE from "../node_modules/three/build/three.module.js";
import { Level } from "./Level.js";

// Some constants
const FOV = 80;
const ASPECT = 2;
const NEAR = 0.1;
const FAR = 1500.0;

const SENS = 0.25;
const HEIGHT = 2;

const CANVAS = document.getElementById("webgl");
let self;

/**
 * Custom camera class
 */
export class Camera extends THREE.PerspectiveCamera {
	raycast = new THREE.Raycaster();
	moveX;
	moveY;
	camDir = new THREE.Vector3(0, 0, 1);
	rotX = new THREE.Object3D();
	rotY = new THREE.Object3D();

	pause = new Event("pause");

	constructor(playerPos) {
		super(FOV, ASPECT, NEAR, FAR);
		this._init(playerPos);
		self = this;
	}

	_init(playerPos) {
		this.raycast.layers.set(1);

		this.rotY.add(this.rotX);
		this.rotX.add(this);
		this.rotY.position.set(playerPos.x, HEIGHT, playerPos.z);
		this.position.z = 12;

		this._setupPointerLock();
	}

	_setupPointerLock() {
		// register the callback when a pointerlock event occurs

		document.addEventListener("pointerlockchange", this.changeCallback, false);
		document.addEventListener(
			"mozpointerlockchange",
			this.changeCallback,
			false
		);
		document.addEventListener(
			"webkitpointerlockchange",
			this.changeCallback,
			false
		);

		CANVAS.addEventListener("click", this.getPointerLock);
	}

	getPointerLock() {
		CANVAS.requestPointerLock =
			CANVAS.requestPointerLock ||
			CANVAS.mozRequestPointerLock ||
			CANVAS.webkitRequestPointerLock;

		// Ask the browser to lock the pointer)
		CANVAS.requestPointerLock();
	}

	changeCallback(e) {
		if (
			document.pointerLockElement === CANVAS ||
			document.mozPointerLockElement === CANVAS ||
			document.webkitPointerLockElement === CANVAS
		) {
			// we've got a pointerlock for our element, add a mouselistener
			CANVAS.onmousemove = (e) => {
				self.moveCallback(e);
			};
		} else {
			// pointer lock is no longer active, remove the callback
			dispatchEvent(self.pause);
			CANVAS.onmousemove = () => {};
		}
	}

	moveCallback(e) {
		self.moveX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
		self.moveY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
	}

	update(delta, playerPos) {
		this.rotateCamera(delta, playerPos);

		this.checkCollision(playerPos);
	}

	rotateCamera(delta, playerPos) {
		this.position.set(0, 0, 12);
		if (this.moveX) {
			this.rotY.rotateY(-this.moveX * delta * SENS);
		}

		if (this.moveY) {
			this.rotX.rotateX(-this.moveY * delta * SENS);
		}

		this.rotY.position.set(playerPos.x, playerPos.y + HEIGHT, playerPos.z);

		this.rotX.rotation.x = clamp(this.rotX.rotation.x, -(Math.PI / 2), 0.16);

		this.moveX = 0;
		this.moveY = 0;
	}

	checkCollision(playerPos) {
		let localPos = new THREE.Vector3(0, 0, 12);
		this.localToWorld(localPos);
		let globalPos = localPos;

		let deltaPos = new THREE.Vector3(
			globalPos.x - playerPos.x,
			globalPos.y - playerPos.y,
			globalPos.z - playerPos.z
		);

		let dir = deltaPos.normalize();

		this.raycast.set(this.rotY.position, dir);

		const intersects = this.raycast.intersectObjects(
			Level.cameraCollisionObjects
		);
		if (intersects.length > 0) {
			const isct = intersects[0];
			if (isct.distance < 12) {
				this.position.z = isct.distance - 1;
			}
		}
	}
}

const clamp = (number, min, max) => {
	return Math.max(min, Math.min(number, max));
};
