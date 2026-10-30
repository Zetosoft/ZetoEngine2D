import { ZetoEventObject } from './ZetoEventObject.js';
import { Matter, libEngine, libEvents, libComposite } from './ZetoPhysics.js';
import { ZetoPhysicsBody } from './ZetoPhysicsBody.js';
import { began, ended } from './constants.js';

class ZetoPhysicsEngine extends ZetoEventObject {
	paused = true;

	debugColor = '#FF880077';

	libEngine;
	libWorld;
	engine;
	bodies = [];

	maxDelta = 1000 / 30;
	fallbackFixedDelta = 16;

	listeners = {
		collision: [],
	};

	constructor(engine, options = {}) {
		super();

		this.engine = engine;

		this.libEngine = libEngine.create({
			positionIterations: options.positionIterations ?? 2,
			velocityIterations: options.velocityIterations ?? 2,
			constraintIterations: options.constraintIterations ?? 1,
		});
		this.libWorld = this.libEngine.world;

		this.collisionBind = this.collision.bind(this);
		libEvents.on(this.libEngine, 'collisionStart', this.collisionBind);
		libEvents.on(this.libEngine, 'collisionEnd', this.collisionBind);
	}

	isMatter() {
		return !!Matter && !!Matter.Engine && libEngine === Matter.Engine;
	}

	isZeto() {
		return !this.isMatter();
	}

	collision(event) {
		var pairs = event.pairs;
		for (var index = 0; index < pairs.length; index++) {
			var pair = pairs[index];

			var libBodyA = pair.bodyA;
			var libBodyB = pair.bodyB;

			var bodyA = libBodyA.zBody;
			var bodyB = libBodyB.zBody;

			var phase = event.name == 'collisionStart' ? began : ended;
			var contact = pair.contacts.find((contact) => contact != undefined);
			var zEvent = {
				x: contact.vertex.x,
				y: contact.vertex.y,
				phase: phase,
				target: bodyA,
				other: bodyB,
				collision: pair.collision,
				pair: pair,
			};
			if (bodyA.hasEventListener('collision')) {
				bodyA.dispatchEvent('collision', zEvent);
			}
			if (bodyB.hasEventListener('collision')) {
				zEvent.target = bodyB;
				zEvent.other = bodyA;
				bodyB.dispatchEvent('collision', zEvent);
			}
			this.dispatchEvent('collision', zEvent);
		}
	}

	update(event) {
		if (this.paused) {
			return;
		}

		for (var bodyIndex = 0; bodyIndex < this.bodies.length; bodyIndex++) {
			var body = this.bodies[bodyIndex];
			body.update(event);
		}

		var delta;
		if (this.isZeto()) {
			delta = this.fallbackFixedDelta;
		} else {
			delta = event.delta > this.maxDelta ? this.maxDelta : event.delta; // Prevent huge physics jumps/tunnelings
		}
		libEngine.update(this.libEngine, delta);
	}

	debugDraw(context, body) {
		// This is the last draw call, so we can safely change the context and not worry about restoring it
		context.scale(body.object.internal.xScaleInverse, body.object.internal.yScaleInverse);
		context.lineWidth = 1;
		context.fillStyle = body.debugColor ?? this.debugColor;
		context.fill(body.path.path);
	}

	addBody(object, bodyType, options) {
		object.body = new ZetoPhysicsBody(this, object, bodyType, options);
		libComposite.add(this.libWorld, object.body.libBody);
		this.bodies.push(object.body);
	}

	removeBody(object) {
		this.removeBodyByBody(object?.body);
	}

	removeBodyByBody(body) {
		if (!body) {
			return;
		}

		let object = body.object;
		if (object) {
			object.removeEventListener('finalize', body.finalizeBind ?? body.finalize);
		}

		let bodyIndex = this.bodies.indexOf(body);
		if (bodyIndex > -1) {
			this.bodies.splice(bodyIndex, 1);
		}

		if (this.libWorld && body.libBody) {
			libComposite.remove(this.libWorld, body.libBody);
		}

		if (object && object.body == body) {
			object.body = null;
		}
	}

	setGravity(x, y) {
		this.libEngine.gravity.x = x;
		this.libEngine.gravity.y = y;
	}

	start() {
		this.paused = false;
	}

	pause() {
		this.paused = true;
	}

	stop() {
		this.paused = true;
	}

}

export { ZetoPhysicsEngine };
