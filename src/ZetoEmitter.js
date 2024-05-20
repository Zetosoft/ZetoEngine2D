import { ZetoGroup } from './ZetoGroup.js';
import { ZetoParticleEngine } from './ZetoParticleEngine.js';

class ZetoEmitter extends ZetoGroup {
	particleEngine;

	emitterType = ZetoParticleEngine.particleTypeGravity;

	texture;

	sourcePositionx = 0;
	sourcePositiony = 0;

	sourcePositionVariancex = 0;
	sourcePositionVariancey = 0;

	speed = 0;
	speedVariance = 0;
	particleLifespan = 0;
	particleLifespanVariance = 0;
	angle = 0;
	angleVariance = 0;

	gravityx = 0;
	gravityy = 0;

	radialAcceleration = 0;
	radialAccelVariance = 0;
	tangentialAcceleration = 0;
	tangentialAccelVariance = 0;

	startColorAlpha = 0;
	startColorVarianceAlpha = 0;
	finishColorAlpha = 0;
	finishColorVarianceAlpha = 0;

	// TODO: implement colors (On hold until webgl & shaders are implemented)

	maxParticles = 0;
	startParticleSize = 0;
	startParticleSizeVariance = 0;
	finishParticleSize = 0;
	finishParticleSizeVariance = 0;
	duration = 0;
	blendFuncSource = 0;
	blendFuncDestination = 0;

	maxRadius = 0;
	maxRadiusVariance = 0;
	minRadius = 0;
	minRadiusVariance = 0;
	rotatePerSecond = 0;
	rotatePerSecondVariance = 0;
	rotationStart = 0;
	rotationStartVariance = 0;
	rotationEnd = 0;
	rotationEndVariance = 0;

	emissionRate = 0;
	emitCounter = 0;

	active = true;
	elapsedTime = 0;

	absolute = false;
	particles = [];

	state = 'playing';

	constructor(engine, emitterParams) {
		super(engine, emitterParams.x, emitterParams.y);

		this.particleEngine = engine.particles;
		this.texture = engine.getImageFill(emitterParams.configName);

		for (var key in emitterParams) {
			this[key] = emitterParams[key];
		}

		this.emissionRate = this.maxParticles / this.particleLifespan;
	}

	start() {
		this.state = 'playing';
		this.active = true;
	}

	stop() {
		this.active = false;
		this.elapsedTime = 0;
		this.emitCounter = 0;

		this.state = 'stopped';
	}

	pause() {
		this.state = 'paused';
	}
}

export { ZetoEmitter };