import { ZetoEventObject } from './ZetoEventObject.js';
import { mEngine, mEvents, mComposite } from './constants.js';
import { ZetoPhysicsBody } from './ZetoPhysicsBody.js';
import { began, ended } from './constants.js';

class ZetoPhysicsEngine extends ZetoEventObject {
	paused = true;

	debugColor = '#FF880077';

	matterEngine;
	matterWorld;
	engine;
	bodies = [];

	maxDelta = 1000 / 30;

	listeners = {
		collision: [],
	};

	constructor(engine, options = {}) {
		super();

		this.engine = engine;

		if (this.disabled) {
			return console.warn('Matter.js not found, physics engine is disabled');
		}

		this.matterEngine = mEngine.create({
			positionIterations: options.positionIterations ?? 2,
			velocityIterations: options.velocityIterations ?? 2,
			constraintIterations: options.constraintIterations ?? 1,
		});
		this.matterWorld = this.matterEngine.world;

		this.collisionBind = this.collision.bind(this);
		mEvents.on(this.matterEngine, 'collisionStart', this.collisionBind);
		mEvents.on(this.matterEngine, 'collisionEnd', this.collisionBind);
	}

	collision(event) {
		var pairs = event.pairs;
		for (var index = 0; index < pairs.length; index++) {
			var pair = pairs[index];

			var matterBodyA = pair.bodyA;
			var matterBodyB = pair.bodyB;

			var bodyA = matterBodyA.zBody;
			var bodyB = matterBodyB.zBody;

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

		var delta = event.delta > this.maxDelta ? this.maxDelta : event.delta; // Prevent huge physics jumps/tunnelings
		mEngine.update(this.matterEngine, delta);
	}

	debugDraw(context, body) {
		// This is the last draw call, so we can safely change the context and not worry about restoring it
		context.scale(body.object.internal.xScaleInverse, body.object.internal.yScaleInverse);
		context.lineWidth = 1;
		context.fillStyle = body.debugColor ?? this.debugColor;
		context.fill(body.path.path);
	}

	addBody(object, bodyType, options) {
		if (this.disabled) {
			return;
		}

		object.body = new ZetoPhysicsBody(this, object, bodyType, options);
		mComposite.add(this.matterWorld, object.body.matterBody);
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

		if (this.matterWorld && body.matterBody) {
			mComposite.remove(this.matterWorld, body.matterBody);
		}

		if (object && object.body == body) {
			object.body = null;
		}
	}

	setGravity(x, y) {
		if (this.disabled) {
			return;
		}
		
		this.matterEngine.gravity.x = x;
		this.matterEngine.gravity.y = y;
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

	get disabled() {
		return mEngine == undefined;
	}
}

export { ZetoPhysicsEngine };
