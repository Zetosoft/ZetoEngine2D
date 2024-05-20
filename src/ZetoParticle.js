import { isGroup } from './constants.js';

class ZetoParticle {
	image;

	position = {
		x: 0,
		y: 0,
	};
	direction = {
		x: 0,
		y: 0,
	};
	startPos = {
		x: 0,
		y: 0,
	};

	startAlpha = 0;
	endAlpha = 0;
	deltaAlpha = 0;

	rotation = 0;
	rotationDelta = 0;
	radialAcceleration = 0;
	tangentialAcceleration = 0;
	radius = 0;
	radiusDelta = 0;
	angle = 0;
	degreesPerSecond = 0;
	particleSize = 0;
	particleSizeDelta = 0;
	timeToLive = 0;

	constructor(emitter) {
		var engine = emitter.engine;
		this.image = engine.newImage(emitter.texture.id, 0, 0); // TODO: extend EngineObject and implement own draw() function
		this.image.isVisible = false;

		var parent = emitter;
		if (emitter.absolutePosition == true) {
			parent = emitter.parent;
		} else if (isGroup(emitter.absolutePosition)) {
			parent = emitter.absolutePosition;
		}
		parent.insert(this.image, true);
	}
}

export { ZetoParticle };