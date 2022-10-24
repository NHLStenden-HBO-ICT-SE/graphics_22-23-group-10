import * as THREE from "../../node_modules/three/build/three.module.js";
import { StaticBody } from "../CollisionSystem/StaticBody.js";
import { Level } from "../Level.js";

export class Wall extends StaticBody {
	constructor(posX, posZ, width, height) {
		super();

		const SCALE_FACTOR = Level.getScaleFactor;

		const mat = new THREE.MeshStandardMaterial({ color: 0x679bf0 });

		this.model = new THREE.Mesh(
			new THREE.BoxGeometry(
				SCALE_FACTOR * width,
				SCALE_FACTOR,
				SCALE_FACTOR * height
			),
			mat
		);

		this.model.layers.enable(1);
		this.model.receiveShadow = true;
		this.model.castShadow = true;
		this.model.position.x = posX * SCALE_FACTOR - 0.5 * SCALE_FACTOR;
		this.model.position.y = 0;
		this.model.position.z = posZ * SCALE_FACTOR - 0.5 * SCALE_FACTOR;

		this.calcExtents(this.model.geometry);
	}
}