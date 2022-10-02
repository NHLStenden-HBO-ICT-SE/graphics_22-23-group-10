import * as THREE from "../node_modules/three/build/three.module.js";
import { clamp } from "three/src/math/MathUtils.js";

const FOV = 80;
const ASPECT = 2;
const NEAR = 0.1;
const FAR = 1500.0;

const CANVAS = document.getElementById("webgl");
let self;

export class Camera extends THREE.PerspectiveCamera {
	raycast = new THREE.Raycaster();
	moveX;
	moveY;
	camDir = new THREE.Vector3(0, 0, 1);
	rotX = new THREE.Object3D();
	rotY = new THREE.Object3D();

	constructor(playerPos) {
		super(FOV, ASPECT, NEAR, FAR);
		this._init(playerPos);
		self = this;
	}

	_init(playerPos) {
		this.rotY.add(this.rotX);
		this.rotX.add(this);
		this.rotY.position.set(playerPos.x, playerPos.y, playerPos.z);
		this.position.z = 12;

		// this.position.set(playerPos.x, playerPos.y, playerPos.z);
		// this.raycast.set(playerPos, new THREE.Vector3(0, 0, 1));
		// let targetpos = new THREE.Vector3();
		// this.raycast.ray.at(12, targetpos);
		// this.position.z = targetpos.z;
		// this.position.y += 10;

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

		CANVAS.addEventListener("click", function () {
			CANVAS.requestPointerLock =
				CANVAS.requestPointerLock ||
				CANVAS.mozRequestPointerLock ||
				CANVAS.webkitRequestPointerLock;

			// Ask the browser to lock the pointer)
			CANVAS.requestPointerLock();
		});
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
			CANVAS.onmousemove = () => {};
		}
	}

	moveCallback(e) {
		self.moveX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
		self.moveY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
	}

	update(delta, playerPos) {
		if (this.moveX) {
			this.rotY.rotateY(-this.moveX * delta);
		}

		console.log(this.rotY.rotation, this.rotX.rotation);

		if (this.moveY) {
			this.rotX.rotateX(-this.moveY * delta);
		}

		this.rotY.position.set(playerPos.x, playerPos.y, playerPos.z);

		this.rotX.rotation.x = clamp(
			this.rotX.rotation.x,
			-(Math.PI / 2),
			Math.PI / 2
		);

		this.moveX = 0;
		this.moveY = 0;
	}
}