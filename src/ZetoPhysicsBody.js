import { ZetoEventObject } from './ZetoEventObject.js';
import { ZetoPath } from './ZetoPath.js';
import { libBodies, libBody, libVertices } from './ZetoPhysics.js';
import { radianMultiplier, degreeMultiplier } from './constants.js';

class ZetoPhysicsBody extends ZetoEventObject {
	bodyType = 'dynamic';
	shapeType;

	listeners = {
		collision: [],
	};

	internal = {
		offsetX: 0,
		offsetY: 0,
	};

	path;
	radius;

	object;
	physics;
	engine;

	libBody;
	finalizeBind;

	constructor(physicsEngine, object, bodyType, options = {}) {
		super();

		this.object = object ?? {};
		this.object.internal = this.object.internal ?? { anchorOffsetX: 0, anchorOffsetY: 0, xScale: 1, yScale: 1 };
		this.object.x ??= 0;
		this.object.y ??= 0;
		this.object.rotation ??= 0;
		this.object.xScale ??= 1;
		this.object.yScale ??= 1;
		this.object.width ??= 0;
		this.object.height ??= 0;
		this.object.addEventListener ??= () => {};
		this.object.removeEventListener ??= () => {};
		this.object.hasEventListener ??= () => false;
		this.engine = object?.engine ?? physicsEngine?.engine;
		this.physics = physicsEngine;
		this.bodyType = bodyType;

		this.createLibBody(options);
		this.createPath();

		this.libBody.isSensor = options.isSensor ?? false;

		this.finalizeBind = this.finalize.bind(this);
		this.object.addEventListener('finalize', this.finalizeBind);
	}

	get fixedRotation() {
		return this.libBody.inertia == Infinity;
	}

	set fixedRotation(value) {
		this.libBody.inertia = value ? Infinity : this.libBody.inertia;
	}

	set x(value) {
		libBody.setPosition(this.libBody, { x: value, y: this.libBody.position.y }, true);
	}

	get x() {
		return this.libBody.position.x;
	}

	set y(value) {
		libBody.setPosition(this.libBody, { x: this.libBody.position.x, y: value }, true);
	}

	get y() {
		return this.libBody.position.y;
	}

	set rotation(value) {
		libBody.setAngle(this.libBody, value * radianMultiplier);
	}

	get rotation() {
		return this.libBody.angle * degreeMultiplier;
	}

	set isSensor(value) {
		this.libBody.isSensor = value;
	}

	get isSensor() {
		return this.libBody.isSensor;
	}

	set xScale(value) {
		libBody.scale(this.libBody, value, this.object.yScale);
	}

	set yScale(value) {
		libBody.scale(this.libBody, this.object.xScale, value);
	}

	createPath() {
		var vertices = this.libBody.vertices;
		this.path = new ZetoPath();
		var x = this.object.x + this.object.internal.anchorOffsetX;
		var y = this.object.y + this.object.internal.anchorOffsetY;
		for (var vertexIndex = 0; vertexIndex < vertices.length; vertexIndex++) {
			var vertex = vertices[vertexIndex];
			this.path.lineTo(vertex.x - x, vertex.y - y);
		}
		this.path.closePath();
	}

	createLibBody(options = {}) {
		var radius = options.radius ?? false;
		var shape = options.shape ?? false;
		var resolution = options.resolution ?? 10;
		var collisionFilter = options.filter ?? {
			category: 1,
			mask: 1,
			group: 0,
		};

		var isStatic = this.bodyType == 'static';

		this.radius = radius;

		var bodyOptions = {
			isStatic: isStatic,
			density: this.density ?? 1,
			restitution: options.bounce ?? 0.1,
			friction: options.friction ?? 0.1,
			angle: this.object.rotation * radianMultiplier,
			collisionFilter: collisionFilter,
		};

		if (shape) {
			this.shapeType = 'polygon';
			this.libBody = libBodies.fromVertices(0, 0, shape, bodyOptions);
			var centre = libVertices.centre(shape);
			// resulting vertices are reorientated about their centre of mass, offset using centre
			libBody.translate(this.libBody, { x: this.object.x + centre.x, y: this.object.y + centre.y });
			this.internal.offsetX = -centre.x; // Wtf Matter-JS, so counter intuitive
			this.internal.offsetY = -centre.y; // Lucky I'm a genius
		} else if (radius) {
			this.shapeType = 'circle';
			this.libBody = libBodies.circle(this.object.x, this.object.y, radius, bodyOptions, resolution);
		} else {
			this.shapeType = 'box';

			var boxOptions = options.box ?? {};
			var boxX = boxOptions.x ? this.object.x + boxOptions.x : this.object.x;
			var boxY = boxOptions.y ? this.object.y + boxOptions.y : this.object.y;
			var boxWidth = boxOptions.width ? boxOptions.width : boxOptions.halfWidth ? boxOptions.halfWidth * 2 : this.object.width;
			var boxHeight = boxOptions.height ? boxOptions.height : boxOptions.halfHeight ? boxOptions.halfHeight * 2 : this.object.height;

			this.libBody = libBodies.rectangle(boxX, boxY, boxWidth, boxHeight, bodyOptions);
		}

		var anchorOffsetX = this.object.internal.anchorOffsetX;
		var anchorOffsetY = this.object.internal.anchorOffsetY;
		libBody.translate(this.libBody, { x: anchorOffsetX, y: anchorOffsetY });
		this.internal.offsetX += -anchorOffsetX;
		this.internal.offsetY += -anchorOffsetY;

		this.libBody.zBody = this; // Custom property
		libBody.scale(this.libBody, this.object.xScale, this.object.yScale);
	}

	update(event) {
		this.object.x = this.libBody.position.x + this.internal.offsetX;
		this.object.y = this.libBody.position.y + this.internal.offsetY;
		this.object.rotation = (this.libBody.angle * degreeMultiplier) % 360;
	}

	applyForce(x, y) {
		libBody.applyForce(this.libBody, this.libBody.position, { x: x, y: y });
	}

	setLinearVelocity(x, y) {
		libBody.setVelocity(this.libBody, { x: x, y: y });
	}

	getLinearVelocity() {
		return this.libBody.velocity;
	}

	applyTorque(torque) {
		this.libBody.torque = torque;
	}

	getAngularVelocity() {
		return this.libBody.angularVelocity;
	}

	setAngularVelocity(angularVelocity) {
		libBody.setAngularVelocity(this.libBody, angularVelocity);
	}

	setMass(mass) {
		libBody.setMass(this.libBody, mass);
	}

	getMass() {
		return this.libBody.mass;
	}

	finalize(event) {
		this.physics.removeBodyByBody(this);
	}
}

export { ZetoPhysicsBody };
