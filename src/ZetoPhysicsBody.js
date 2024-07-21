import { ZetoEventObject } from './ZetoEventObject.js';
import { ZetoPath } from './ZetoPath.js';
import { mBodies, mBody, mComposite, mVertices, radianMultiplier, degreeMultiplier } from './constants.js';

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

	matterBody;

	constructor(physicsEngine, object, bodyType, options = {}) {
		super();

		this.object = object;
		this.engine = object.engine;
		this.physics = physicsEngine;
		this.bodyType = bodyType;

		this.createMatterBody(options);
		this.createPath();

		this.matterBody.isSensor = options.isSensor ?? false;

		this.object.addEventListener('finalize', this.finalize.bind(this));
	}

	get fixedRotation() {
		return this.matterBody.inertia == Infinity;
	}

	set fixedRotation(value) {
		this.matterBody.inertia = value ? Infinity : this.matterBody.inertia;
	}

	set x(value) {
		mBody.setPosition(this.matterBody, { x: value, y: this.matterBody.position.y }, true);
	}

	get x() {
		return this.matterBody.position.x;
	}

	set y(value) {
		mBody.setPosition(this.matterBody, { x: this.matterBody.position.x, y: value }, true);
	}

	get y() {
		return this.matterBody.position.y;
	}

	set rotation(value) {
		mBody.setAngle(this.matterBody, value * radianMultiplier);
	}

	get rotation() {
		return this.matterBody.angle * degreeMultiplier;
	}

	set isSensor(value) {
		this.matterBody.isSensor = value;
	}

	get isSensor() {
		return this.matterBody.isSensor;
	}

	set xScale(value) {
		mBody.scale(this.matterBody, value, this.object.yScale);
	}

	set yScale(value) {
		mBody.scale(this.matterBody, this.object.xScale, value);
	}

	createPath() {
		var vertices = this.matterBody.vertices;
		this.path = new ZetoPath();
		var x = this.object.x + this.object.internal.anchorOffsetX;
		var y = this.object.y + this.object.internal.anchorOffsetY;
		for (var vertexIndex = 0; vertexIndex < vertices.length; vertexIndex++) {
			var vertex = vertices[vertexIndex];
			this.path.lineTo(vertex.x - x, vertex.y - y);
		}
		this.path.closePath();
	}

	createMatterBody(options = {}) {
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
		};

		if (shape) {
			this.shapeType = 'polygon';
			this.matterBody = mBodies.fromVertices(0, 0, shape, bodyOptions);
			var centre = mVertices.centre(shape);
			// resulting vertices are reorientated about their centre of mass, offset using centre
			mBody.translate(this.matterBody, { x: this.object.x + centre.x, y: this.object.y + centre.y });
			this.internal.offsetX = -centre.x; // Wtf Matter-JS, so counter intuitive
			this.internal.offsetY = -centre.y; // Lucky I'm a genius
		} else if (radius) {
			this.shapeType = 'circle';
			this.matterBody = mBodies.circle(this.object.x, this.object.y, radius, bodyOptions, resolution);
		} else {
			this.shapeType = 'box';
			this.matterBody = mBodies.rectangle(this.object.x, this.object.y, this.object.width, this.object.height, bodyOptions);
		}

		var anchorOffsetX = this.object.internal.anchorOffsetX;
		var anchorOffsetY = this.object.internal.anchorOffsetY;
		mBody.translate(this.matterBody, { x: anchorOffsetX, y: anchorOffsetY });
		this.internal.offsetX += -anchorOffsetX;
		this.internal.offsetY += -anchorOffsetY;

		this.matterBody.collisionFilter = collisionFilter;
		this.matterBody.zBody = this; // Custom property
		mBody.scale(this.matterBody, this.object.xScale, this.object.yScale);
	}

	update(event) {
		this.object.x = this.matterBody.position.x + this.internal.offsetX;
		this.object.y = this.matterBody.position.y + this.internal.offsetY;
		this.object.rotation = (this.matterBody.angle * degreeMultiplier) % 360;
	}

	applyForce(x, y) {
		mBody.applyForce(this.matterBody, this.matterBody.position, { x: x, y: y });
	}

	setLinearVelocity(x, y) {
		mBody.setVelocity(this.matterBody, { x: x, y: y });
	}

	getLinearVelocity() {
		return this.matterBody.velocity;
	}

	applyTorque(torque) {
		this.matterBody.torque = torque;
	}

	getAngularVelocity() {
		return this.matterBody.angularVelocity;
	}

	setAngularVelocity(angularVelocity) {
		mBody.setAngularVelocity(this.matterBody, angularVelocity);
	}

	setMass(mass) {
		mBody.setMass(this.matterBody, mass);
	}

	getMass() {
		return this.matterBody.mass;
	}

	finalize(event) {
		mComposite.remove(this.physics.matterWorld, this.matterBody);
	}
}

export { ZetoPhysicsBody };