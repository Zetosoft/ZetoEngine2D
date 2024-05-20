import { ZetoEventObject } from './ZetoEventObject.js';
import { mathAbs, mathCos, mathSin, randomSideFloat, radianMultiplier } from './constants.js';

class ZetoParticleEngine extends ZetoEventObject {
	static particleTypeGravity = 0;
	static particleTypeRadial = 1;

	engine;

	emitters = [];

	constructor(engine) {
		super();

		this.engine = engine;
	}

	normalize(point, scale) {
		// var magnitude = mathSqrt((point.x * point.x) + (point.y * point.y));
		// TODO check if this is faster than mathSqrt (It should be) visually i can't see a difference
		var magnitude = mathAbs(point.x) + mathAbs(point.y);
		if (magnitude != 0) {
			return {
				x: (scale * point.x) / magnitude,
				y: (scale * point.y) / magnitude,
			};
		} else {
			return {
				x: 0,
				y: 0,
			};
		}
	}

	update(event) {
		var delta = event.delta * 0.001;
		if (this.emitters.length > 0) {
			for (var emitterIndex = 0; emitterIndex < this.emitters.length; emitterIndex++) {
				var emitter = this.emitters[emitterIndex];

				if (emitter.state != 'paused') {
					if (emitter.active && emitter.emissionRate > 0) {
						var rate = 1.0 / emitter.emissionRate;

						if (emitter.particles.length < emitter.maxParticles) {
							emitter.emitCounter += delta;
						}

						while (emitter.particles.length < emitter.maxParticles && emitter.emitCounter > rate) {
							this.addParticle(emitter);
							emitter.emitCounter -= rate;
						}

						emitter.elapsedTime += delta;

						if (emitter.duration != -1 && emitter.duration < emitter.elapsedTime) {
							this.stopParticleEmitter(emitter);
						}
					}

					for (var particleIndex = emitter.particles.length - 1; particleIndex >= 0; particleIndex--) {
						var particle = emitter.particles[particleIndex];

						particle.timeToLive -= delta;
						if (particle.timeToLive > 0) {
							this.updateParticle(emitter, particle, delta);
						} else {
							this.removeParticleAtIndex(emitter, particleIndex);

							if (emitter.particles.length <= 0 && emitter.duration != -1) {
								this.removeEmitter({ target: emitter });
								return;
							}
						}
					}
				}
			}
		}
	}

	initParticle(emitter, particle) {
		particle.position.x = emitter.sourcePositionx + emitter.sourcePositionVariancex * randomSideFloat();
		particle.position.y = emitter.sourcePositiony + emitter.sourcePositionVariancey * randomSideFloat();
		particle.startPos.x = emitter.sourcePositionx;
		particle.startPos.y = emitter.sourcePositiony;

		if (particle.image.parent != emitter) {
			var relativeX = 0;
			var relativeY = 0;
			var parent = emitter;

			// TODO: this does not work if the emitter and absolute parent are not in the same branch
			// TODO: implement localToContent and contentToLocal funcs, should fix this
			// maybe with contet.getTransform? Needs to be fast
			while (parent && parent != particle.image.parent) {
				var parentRotation = parent.rotation * radianMultiplier;
				var cos = mathCos(parentRotation);
				var sin = mathSin(parentRotation);
				var rotatedX = relativeX * cos - relativeY * sin;
				var rotatedY = relativeX * sin + relativeY * cos;

				relativeX = rotatedX + parent.x;
				relativeY = rotatedY + parent.y;

				parent = parent.parent;
			}

			particle.position.x += relativeX;
			particle.position.y += relativeY;

			particle.image.toBack();
		}

		var newAngle = (emitter.angle + emitter.angleVariance * randomSideFloat()) * radianMultiplier;

		var vector = {
			x: mathCos(newAngle),
			y: mathSin(newAngle),
		};

		var vectorSpeed = emitter.speed + emitter.speedVariance * randomSideFloat();

		particle.direction = {
			x: vector.x * vectorSpeed,
			y: vector.y * vectorSpeed,
		};

		var timeToLive = emitter.particleLifespan + emitter.particleLifespanVariance * randomSideFloat();
		particle.timeToLive = timeToLive > 0 ? timeToLive : 0;

		particle.radius = emitter.maxRadius + emitter.maxRadiusVariance * randomSideFloat();
		particle.radiusDelta = (particle.radius - emitter.maxRadius) / particle.timeToLive;
		particle.angle = (emitter.angle + emitter.angleVariance * randomSideFloat()) * radianMultiplier;
		particle.degreesPerSecond = (emitter.rotatePerSecond + emitter.rotatePerSecondVariance * randomSideFloat()) * radianMultiplier;

		particle.radialAcceleration = emitter.radialAcceleration + emitter.radialAccelVariance * randomSideFloat();
		particle.tangentialAcceleration = emitter.tangentialAcceleration + emitter.tangentialAccelVariance * randomSideFloat();

		var particleStartSize = emitter.startParticleSize + emitter.startParticleSizeVariance * randomSideFloat();
		var particleFinishSize = emitter.finishParticleSize + emitter.finishParticleSizeVariance * randomSideFloat();
		particle.particleSizeDelta = (particleFinishSize - particleStartSize) / particle.timeToLive;
		particle.particleSize = particleStartSize > 0 ? particleStartSize : 0;

		var startRotation = emitter.rotationStart + emitter.rotationStartVariance * randomSideFloat();
		var endRotation = emitter.rotationEnd + emitter.rotationEndVariance * randomSideFloat();
		particle.rotation = startRotation;
		particle.rotationDelta = (endRotation - startRotation) / particle.timeToLive;

		particle.alpha = emitter.startColorAlpha + emitter.startColorVarianceAlpha * randomSideFloat();
		var endAlpha = emitter.finishColorAlpha + emitter.finishColorVarianceAlpha * randomSideFloat();
		particle.deltaAlpha = (endAlpha - particle.alpha) / particle.timeToLive;

		particle.image.x = particle.position.x;
		particle.image.y = particle.position.y;
		particle.image.rotation = particle.rotation;
		particle.image.width = particle.particleSize;
		particle.image.height = particle.particleSize;
		particle.image.alpha = particle.alpha;
		particle.image.isVisible = true;
	}

	addParticle(emitter) {
		if (emitter.particles.length == emitter.maxParticles) {
			return false;
		}

		var particle = new ZetoParticle(emitter);
		emitter.particles.push(particle);
		this.initParticle(emitter, particle);

		return true;
	}

	stopParticleEmitter(emitter) {
		emitter.active = false;
		emitter.elapsedTime = 0;
		emitter.emitCounter = 0;

		emitter.state = 'stopped';
	}

	updateParticle(emitter, particle, delta) {
		if (emitter.emitterType == ZetoParticleEngine.particleTypeRadial) {
			particle.angle += particle.degreesPerSecond * delta;
			particle.radius += particle.radiusDelta * delta;

			particle.position.x = -mathCos(particle.angle) * particle.radius;
			particle.position.y = -mathSin(particle.angle) * particle.radius;
		} else {
			var radial = this.normalize(particle.position, 1);
			var tangential = {
				x: radial.x,
				y: radial.y,
			};

			radial.x = radial.x * particle.radialAcceleration;
			radial.y = radial.y * particle.radialAcceleration;

			var newy = tangential.x;
			tangential.x = -tangential.y;
			tangential.y = newy;
			tangential.x = tangential.x * particle.tangentialAcceleration;
			tangential.y = tangential.y * particle.tangentialAcceleration;

			var tmp = {
				x: radial.x + tangential.x + emitter.gravityx,
				y: radial.y + tangential.y + emitter.gravityy,
			};

			tmp.x = tmp.x * delta;
			tmp.y = tmp.y * delta;

			particle.direction.x = particle.direction.x + tmp.x;
			particle.direction.y = particle.direction.y + tmp.y;

			tmp.x = particle.direction.x * delta;
			tmp.y = particle.direction.y * delta;

			particle.position.x = particle.position.x + tmp.x;
			particle.position.y = particle.position.y + tmp.y;
		}

		particle.alpha = particle.alpha + particle.deltaAlpha * delta;

		particle.particleSize = particle.particleSize + particle.particleSizeDelta * delta;
		particle.particleSize = particle.particleSize > 0 ? particle.particleSize : 0;

		particle.rotation = particle.rotation + particle.rotationDelta * delta;

		particle.image.x = particle.position.x;
		particle.image.y = particle.position.y;
		particle.image.rotation = particle.rotation;
		particle.image.width = particle.particleSize;
		particle.image.height = particle.particleSize;
		particle.image.alpha = particle.alpha;
	}

	removeParticleAtIndex(emitter, index) {
		var particle = emitter.particles[index];
		this.engine.remove(particle.image);
		emitter.particles.splice(index, 1);
	}

	removeEmitter(event) {
		var emitter = event.target;
		var emitterIndex = this.emitters.indexOf(emitter);
		if (emitterIndex != -1) {
			this.emitters.splice(emitterIndex, 1);
		}
		this.engine.remove(emitter);
	}

	newEmitter(emitterParams) {
		var emitter = new ZetoEmitter(this.engine, emitterParams);
		this.emitters.push(emitter);
		return this.engine.rootGroup.insert(emitter, true);
	}
}

export { ZetoParticleEngine };