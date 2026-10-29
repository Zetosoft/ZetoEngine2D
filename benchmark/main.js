const defaultConfig = {
	seed: 1337,
	startCount: 1000,
	endCount: 10000,
	step: 1000,
	spawnPerFrame: 120,
	warmupFrames: 20,
	measureFrames: 180,
	stopP95Ms: 20,
	physicsStopP95Ms: 20,
};

class SeededRandom {
	constructor(seed) {
		this.state = seed >>> 0;
	}

	next() {
		this.state = (1664525 * this.state + 1013904223) >>> 0;
		return this.state / 0x100000000;
	}

	range(min, max) {
		return min + (max - min) * this.next();
	}
}

function buildCheckpoints(startCount, endCount, step) {
	const checkpoints = [];
	for (let count = startCount; count <= endCount; count += step) {
		checkpoints.push(count);
	}
	return checkpoints;
}

function buildScenarioCheckpoints(scenarioName, startCount, endCount, step) {
	let scenarioStep = step;
	if (scenarioName === 'physics-structured') {
		scenarioStep = Math.min(500, Math.max(200, step));
	}
	return buildCheckpoints(startCount, endCount, scenarioStep);
}

function createTextureDataUrl(size, fillStyle, strokeStyle = null) {
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const context = canvas.getContext('2d');
	context.fillStyle = fillStyle;
	context.fillRect(0, 0, size, size);
	if (strokeStyle) {
		context.strokeStyle = strokeStyle;
		context.lineWidth = 2;
		context.strokeRect(1, 1, size - 2, size - 2);
	}
	return canvas.toDataURL('image/png');
}

function installPhaseProfiler(engine) {
	const phases = ['clear', 'input', 'draw', 'touchPoints', 'timer', 'transition', 'physics', 'particles'];
	const current = {
		clear: 0,
		input: 0,
		draw: 0,
		touchPoints: 0,
		timer: 0,
		transition: 0,
		physics: 0,
		particles: 0,
	};
	const originals = [];

	function resetCurrent() {
		for (let index = 0; index < phases.length; index++) {
			current[phases[index]] = 0;
		}
	}

	function wrap(target, methodName, phaseName) {
		const original = target[methodName].bind(target);
		originals.push({ target: target, methodName: methodName, original: original });
		target[methodName] = function (...args) {
			const start = performance.now();
			const result = original(...args);
			current[phaseName] += performance.now() - start;
			return result;
		};
	}

	wrap(engine, 'clearCanvas', 'clear');
	wrap(engine, 'updateInput', 'input');
	wrap(engine, 'drawUpdate', 'draw');
	wrap(engine, 'updateTouchPoints', 'touchPoints');
	wrap(engine.timer, 'update', 'timer');
	wrap(engine.transition, 'update', 'transition');
	wrap(engine.physics, 'update', 'physics');
	wrap(engine.particles, 'update', 'particles');

	engine.addEventListener('enterframe', resetCurrent);

	return {
		snapshot(delta) {
			const phase = {};
			let phaseTotal = 0;
			for (let index = 0; index < phases.length; index++) {
				const phaseName = phases[index];
				phase[phaseName] = current[phaseName];
				phaseTotal += current[phaseName];
			}
			return {
				delta: delta,
				phase: phase,
				phaseTotal: phaseTotal,
			};
		},
		restore() {
			for (let index = 0; index < originals.length; index++) {
				const wrapped = originals[index];
				wrapped.target[wrapped.methodName] = wrapped.original;
			}
		},
	};
}

function percentile(sortedValues, fraction) {
	if (sortedValues.length <= 0) {
		return 0;
	}
	const maxIndex = sortedValues.length - 1;
	const index = Math.min(maxIndex, Math.max(0, Math.floor(maxIndex * fraction)));
	return sortedValues[index];
}

function summarizeSamples(samples) {
	const frameTimes = samples.map((sample) => sample.delta);
	const sorted = frameTimes.slice().sort((a, b) => a - b);
	const phaseTotals = {
		clear: 0,
		input: 0,
		draw: 0,
		touchPoints: 0,
		timer: 0,
		transition: 0,
		physics: 0,
		particles: 0,
		total: 0,
	};

	let over16 = 0;
	let over24 = 0;
	let over33 = 0;
	for (let index = 0; index < samples.length; index++) {
		const sample = samples[index];
		if (sample.delta > 16.7) {
			over16++;
		}
		if (sample.delta > 24) {
			over24++;
		}
		if (sample.delta > 33.3) {
			over33++;
		}
		phaseTotals.total += sample.phaseTotal;
		phaseTotals.clear += sample.phase.clear;
		phaseTotals.input += sample.phase.input;
		phaseTotals.draw += sample.phase.draw;
		phaseTotals.touchPoints += sample.phase.touchPoints;
		phaseTotals.timer += sample.phase.timer;
		phaseTotals.transition += sample.phase.transition;
		phaseTotals.physics += sample.phase.physics;
		phaseTotals.particles += sample.phase.particles;
	}

	const sampleCount = samples.length || 1;
	return {
		frames: samples.length,
		frameMs: {
			average: frameTimes.reduce((sum, time) => sum + time, 0) / sampleCount,
			median: percentile(sorted, 0.5),
			p95: percentile(sorted, 0.95),
			p99: percentile(sorted, 0.99),
			max: sorted.length > 0 ? sorted[sorted.length - 1] : 0,
		},
		phaseMsAverage: {
			clear: phaseTotals.clear / sampleCount,
			input: phaseTotals.input / sampleCount,
			draw: phaseTotals.draw / sampleCount,
			touchPoints: phaseTotals.touchPoints / sampleCount,
			timer: phaseTotals.timer / sampleCount,
			transition: phaseTotals.transition / sampleCount,
			physics: phaseTotals.physics / sampleCount,
			particles: phaseTotals.particles / sampleCount,
			totalMeasured: phaseTotals.total / sampleCount,
		},
		stutterFrames: {
			over16ms: over16,
			over24ms: over24,
			over33ms: over33,
		},
	};
}

function createSpriteScenario(engine, random) {
	const group = engine.newGroup(0, 0);
	group.x = engine.cX;
	group.y = engine.cY;
	const sprites = [];
	const velocities = [];

	const halfWidth = engine.width * 0.48;
	const halfHeight = engine.height * 0.48;

	function spawnOne(index) {
		const x = random.range(-halfWidth, halfWidth);
		const y = random.range(-halfHeight, halfHeight);
		const sprite = engine.newImage('benchmark-sprite', x, y, false);
		sprite.alpha = 0.92;
		group.insert(sprite, true, true);

		const vx = random.range(-0.45, 0.45);
		const vy = random.range(-0.45, 0.45);
		sprites.push(sprite);
		velocities.push({ x: vx, y: vy });
	}

	return {
		name: 'sprite-progressive',
		count() {
			return sprites.length;
		},
		spawnUntil(targetCount, maxAdditions) {
			let added = 0;
			while (sprites.length < targetCount && added < maxAdditions) {
				spawnOne(sprites.length);
				added++;
			}
		},
		update() {
			for (let index = 0; index < sprites.length; index++) {
				const sprite = sprites[index];
				const velocity = velocities[index];
				sprite.x += velocity.x;
				sprite.y += velocity.y;

				if (sprite.x < -halfWidth || sprite.x > halfWidth) {
					velocity.x = -velocity.x;
					sprite.x += velocity.x;
				}
				if (sprite.y < -halfHeight || sprite.y > halfHeight) {
					velocity.y = -velocity.y;
					sprite.y += velocity.y;
				}
			}
		},
		cleanup() {
			group.destroy();
		},
	};
}

function createParticleScenario(engine) {
	const emitter = engine.particles.newEmitter({
		configName: 'benchmark-particle',
		x: engine.cX,
		y: engine.cY,
		sourcePositionx: 0,
		sourcePositiony: 0,
		sourcePositionVariancex: engine.width * 0.25,
		sourcePositionVariancey: engine.height * 0.25,
		speed: 14,
		speedVariance: 4,
		particleLifespan: 2.2,
		particleLifespanVariance: 0.2,
		angle: 0,
		angleVariance: 180,
		gravityx: 0,
		gravityy: 2.5,
		radialAcceleration: 0,
		radialAccelVariance: 0,
		tangentialAcceleration: 0,
		tangentialAccelVariance: 0,
		startColorAlpha: 0.8,
		startColorVarianceAlpha: 0.1,
		finishColorAlpha: 0,
		finishColorVarianceAlpha: 0,
		maxParticles: defaultConfig.startCount,
		startParticleSize: 12,
		startParticleSizeVariance: 2,
		finishParticleSize: 2,
		finishParticleSizeVariance: 1,
		duration: -1,
		maxRadius: 0,
		maxRadiusVariance: 0,
		minRadius: 0,
		minRadiusVariance: 0,
		rotatePerSecond: 0,
		rotatePerSecondVariance: 0,
		rotationStart: 0,
		rotationStartVariance: 0,
		rotationEnd: 0,
		rotationEndVariance: 0,
	});

	function syncEmissionRate() {
		emitter.emissionRate = emitter.maxParticles / emitter.particleLifespan;
	}

	syncEmissionRate();
	emitter.start();

	return {
		name: 'particle-progressive',
		count() {
			return emitter.maxParticles;
		},
		spawnUntil(targetCount, maxAdditions) {
			if (emitter.maxParticles >= targetCount) {
				return;
			}
			const nextTarget = Math.min(targetCount, emitter.maxParticles + maxAdditions);
			emitter.maxParticles = nextTarget;
			syncEmissionRate();
		},
		update() {},
		cleanup() {
			engine.particles.removeEmitter({ target: emitter });
		},
	};
}

function createPhysicsScenario(engine, random) {
	const group = engine.newGroup(0, 0);
	group.x = engine.cX;
	group.y = engine.cY;
	const objects = [];
	engine.physics.start();
	engine.physics.setGravity(0, 0.08);

	const halfInnerWidth = Math.min(engine.width * 0.42, 720);
	const halfInnerHeight = Math.min(engine.height * 0.36, 420);
	const wallThickness = 40;

	function createBoundary(x, y, width, height) {
		const boundary = engine.newRect(x, y, width, height, false);
		group.insert(boundary, true, true);
		engine.physics.addBody(boundary, 'static', { bounce: 0.15, friction: 0.2 });
		return boundary;
	}

	// Concealed container walls: left, right, and floor only (no ceiling).
	createBoundary(-halfInnerWidth - wallThickness * 0.5, 0, wallThickness, halfInnerHeight * 2 + wallThickness);
	createBoundary(halfInnerWidth + wallThickness * 0.5, 0, wallThickness, halfInnerHeight * 2 + wallThickness);
	createBoundary(0, halfInnerHeight + wallThickness * 0.5, halfInnerWidth * 2 + wallThickness * 2, wallThickness);

	function spawnOne(index) {
		const spacing = 14;
		const spawnHalfWidth = halfInnerWidth - 18;
		const cols = Math.max(1, Math.floor((spawnHalfWidth * 2) / spacing));
		const col = index % cols;
		const row = Math.floor(index / cols) % 28;
		const startX = -spawnHalfWidth + col * spacing;
		const startY = -halfInnerHeight + 18 + row * spacing;

		const rect = engine.newRect(startX, startY, 10, 10, false);
		rect.fillColor = '#77AAFF';
		group.insert(rect, true, true);
		engine.physics.addBody(rect, 'dynamic', { bounce: 0.1, friction: 0.005 });

		const vx = random.range(-0.7, 0.7);
		const vy = random.range(-0.15, 0.15);
		rect.body.setLinearVelocity(vx, vy);
		objects.push(rect);
	}

	return {
		name: 'physics-progressive',
		count() {
			return objects.length;
		},
		spawnUntil(targetCount, maxAdditions) {
			let added = 0;
			while (objects.length < targetCount && added < maxAdditions) {
				spawnOne(objects.length);
				added++;
			}
		},
		update() {},
		cleanup() {
			group.destroy();
			engine.physics.pause();
		},
	};
}

function createPhysicsSimpleScenario(engine, random) {
	const group = engine.newGroup(0, 0);
	group.x = engine.cX;
	group.y = engine.cY;
	const objects = [];
	engine.physics.start();
	engine.physics.setGravity(0, 0.08);

	return {
		name: 'physics-simple',
		count() {
			return objects.length;
		},
		spawnUntil(targetCount, maxAdditions) {
			let added = 0;
			while (objects.length < targetCount && added < maxAdditions) {
				// Implement spawn logic for simple scenario here
				added++;
			}
		},
		update() {},
		cleanup() {
			group.destroy();
			engine.physics.pause();
		},
	};
}

function createPhysicsStructuredScenario(engine, random) {
	const group = engine.newGroup(0, 0);
	group.x = engine.cX;
	group.y = engine.cY;
	const objects = [];
	engine.physics.start();
	engine.physics.setGravity(0, 0.08);

	const halfW = Math.min(engine.width * 0.52, 860);
	const floorY = 600;
	const wallThickness = 40;

	const createStaticBody = (x, y, width, height, options = {}) => {
		const body = engine.newRect(x, y, width, height, false);
		body.fillColor = '#444444';
		group.insert(body, true, true);
		engine.physics.addBody(body, 'static', { bounce: 0.08, friction: 0.4, ...options });
		return body;
	};

	const createStaticPolygon = (x, y, points, options = {}) => {
		const poly = engine.newPolygon(x, y, points, false);
		group.insert(poly, true, true);
		engine.physics.addBody(poly, 'static', { bounce: 0.08, friction: 0.4, shape: points, ...options });
		return poly;
	};

	createStaticBody(-halfW - wallThickness * 0.5, 0, wallThickness, 420);
	createStaticBody(halfW + wallThickness * 0.5, 28, wallThickness, 520);
	createStaticBody(0, floorY + 8, halfW * 2 + wallThickness * 3, 30);
	createStaticPolygon(
		-halfW + 120,
		floorY - 60,
		[
			{ x: -170, y: 60 },
			{ x: 25, y: -60 },
			{ x: 220, y: 60 },
			{ x: 220, y: 110 },
			{ x: -170, y: 110 },
		],
		{ bounce: 0.06, friction: 0.55 },
	);
	createStaticPolygon(
		110,
		floorY - 200,
		[
			{ x: -180, y: 0 },
			{ x: 25, y: -130 },
			{ x: 180, y: 0 },
		],
		{ bounce: 0.06, friction: 0.45 },
	);

	function spawnDynamicOne(type, x, y, width, height, radius) {
		let body;
		if (type === 'circle') {
			body = engine.newCircle(x, y, radius, false);
			body.fillColor = '#66D9FF';
			engine.physics.addBody(body, 'dynamic', { radius: radius, bounce: 0.18, friction: 0.04 });
		} else if (type === 'box') {
			body = engine.newRect(x, y, width, height, false);
			body.fillColor = '#B1FF77';
			engine.physics.addBody(body, 'dynamic', { bounce: 0.15, friction: 0.05 });
		} else {
			const vertices = [
				{ x: -width * 0.5, y: -height * 0.35 },
				{ x: width * 0.15, y: -height * 0.7 },
				{ x: width * 0.55, y: -height * 0.2 },
				{ x: width * 0.4, y: height * 0.6 },
				{ x: -width * 0.45, y: height * 0.5 },
			];
			body = engine.newPolygon(x, y, vertices, false);
			body.fillColor = '#FFB366';
			engine.physics.addBody(body, 'dynamic', { shape: vertices, bounce: 0.18, friction: 0.04 });
		}
		group.insert(body, true, true);
		body.body.setLinearVelocity(random.range(-1.1, 1.1), random.range(-0.8, 0.3));
		body.body.setAngularVelocity(random.range(-0.25, 0.25));
		objects.push(body);
		return body;
	}

	return {
		name: 'physics-structured',
		count() {
			return objects.length;
		},
		spawnUntil(targetCount, maxAdditions) {
			let added = 0;
			const step = Math.max(200, Math.min(1000, Math.floor(targetCount / 24)));
			while (objects.length < targetCount && added < maxAdditions) {
				const mode = objects.length % 3;
				const column = objects.length % 12;
				const row = Math.floor(objects.length / 12) % 12;
				const x = -halfW + 100 + column * ((halfW * 1.6) / 11) + random.range(-18, 18);
				const y = -200 + row * 28 + random.range(-10, 10);
				if (mode === 0) {
					spawnDynamicOne('box', x, y, 18 + random.range(0, 12), 18 + random.range(0, 12));
				} else if (mode === 1) {
					spawnDynamicOne('circle', x, y, 0, 0, 9 + random.range(0, 12));
				} else {
					spawnDynamicOne('polygon', x, y, 20 + random.range(0, 18), 20 + random.range(0, 18));
				}
				added++;
			}
		},
		update() {},
		cleanup() {
			group.destroy();
			engine.physics.pause();
		},
	};
}

class BenchmarkRunner {
	constructor(engine, profiler, config, outputElement) {
		this.engine = engine;
		this.profiler = profiler;
		this.config = config;
		this.outputElement = outputElement;
		this.random = new SeededRandom(config.seed);
		this.results = [];
		this.scenarioIndex = 0;
		this.checkpointIndex = 0;
		this.phase = 'spawning';
		this.phaseFrameCount = 0;
		this.samples = [];
		this.scenarioFactories = [];
		if (engine.physics.isMatter()) {
			this.scenarioFactories.push(() => createPhysicsScenario(engine, this.random));
			this.scenarioFactories.push(() => createPhysicsStructuredScenario(engine, this.random));
		} else {
			this.scenarioFactories.push(() => createPhysicsSimpleScenario(engine, this.random));
		}

		this.scenarios = [];
		this.checkpoints = [];
		this.refreshCheckpoints();
	}

	ensureScenario(index) {
		if (!this.scenarioFactories || index >= this.scenarioFactories.length) {
			return this.scenarios[index];
		}
		if (!this.scenarios[index]) {
			this.scenarios[index] = this.scenarioFactories[index]();
		}
		return this.scenarios[index];
	}

	refreshCheckpoints() {
		const scenario = this.currentScenario?.();
		this.checkpoints = buildScenarioCheckpoints(scenario?.name ?? 'sprite-progressive', this.config.startCount, this.config.endCount, this.config.step);
		this.checkpointIndex = 0;
	}

	currentScenario() {
		return this.ensureScenario(this.scenarioIndex);
	}

	targetCount() {
		return this.checkpoints[this.checkpointIndex];
	}

	log(message) {
		if (this.outputElement) {
			this.outputElement.textContent += message + '\n';
		}
		console.log('[benchmark] ' + message);
	}

	recordCheckpoint() {
		const scenario = this.currentScenario();
		const summary = summarizeSamples(this.samples);
		const result = {
			scenario: scenario.name,
			targetCount: this.targetCount(),
			seed: this.config.seed,
			checkpointIndex: this.checkpointIndex,
			summary: summary,
		};
		this.results.push(result);
		this.log(`${scenario.name} @ ${this.targetCount()} -> avg ${summary.frameMs.average.toFixed(2)}ms, p95 ${summary.frameMs.p95.toFixed(2)}ms, p99 ${summary.frameMs.p99.toFixed(2)}ms`);

		let stopScenario = false;
		const threshold = this.config.stopP95Ms > 0 ? this.config.stopP95Ms : this.config.physicsStopP95Ms;
		if (threshold > 0 && summary.frameMs.p95 >= threshold) {
			stopScenario = true;
			this.log(`Stopping scenario early at ${this.targetCount()} (p95 ${summary.frameMs.p95.toFixed(2)}ms >= threshold ${threshold}ms)`);
		}

		return stopScenario;
	}

	cleanupCurrentScenario() {
		const scenario = this.scenarios[this.scenarioIndex];
		if (scenario) {
			scenario.cleanup();
			this.scenarios[this.scenarioIndex] = null;
		}
	}

	nextCheckpointOrScenario(forceScenarioStop = false) {
		if (forceScenarioStop) {
			this.cleanupCurrentScenario();
			this.scenarioIndex++;
			this.checkpointIndex = 0;
			this.phase = 'spawning';
			this.phaseFrameCount = 0;
			this.samples = [];

			if (this.scenarioIndex >= this.scenarioFactories.length) {
				this.finish();
				return;
			}

			this.refreshCheckpoints();
			this.log('Starting scenario: ' + this.currentScenario().name);
			return;
		}

		this.checkpointIndex++;
		this.phase = 'spawning';
		this.phaseFrameCount = 0;
		this.samples = [];

		if (this.checkpointIndex < this.checkpoints.length) {
			return;
		}

		this.cleanupCurrentScenario();
		this.scenarioIndex++;
		this.checkpointIndex = 0;
		this.phase = 'spawning';
		this.phaseFrameCount = 0;
		this.samples = [];

		if (this.scenarioIndex >= this.scenarioFactories.length) {
			this.finish();
			return;
		}

		this.refreshCheckpoints();
		this.log('Starting scenario: ' + this.currentScenario().name);
	}

	finish() {
		this.cleanupCurrentScenario();
		this.engine.removeEventListener('exitframe', this.exitframeBind);
		window.__zetoBenchmarkResults = {
			config: this.config,
			checkpoints: this.checkpoints,
			results: this.results,
		};

		const resultJson = JSON.stringify(window.__zetoBenchmarkResults, null, 2);
		this.log('Benchmark completed. Results are available in window.__zetoBenchmarkResults');

		if (this.outputElement) {
			this.outputElement.textContent += '\nJSON:\n' + resultJson;
		}
	}

	step(event) {
		const scenario = this.currentScenario();
		if (!scenario) {
			return;
		}

		scenario.update(event);
		const targetCount = this.targetCount();

		if (this.phase == 'spawning') {
			scenario.spawnUntil(targetCount, this.config.spawnPerFrame);
			if (scenario.count() >= targetCount) {
				this.phase = 'warmup';
				this.phaseFrameCount = 0;
				this.samples = [];
			}
			return;
		}

		if (this.phase == 'warmup') {
			this.phaseFrameCount++;
			if (this.phaseFrameCount >= this.config.warmupFrames) {
				this.phase = 'measuring';
				this.phaseFrameCount = 0;
			}
			return;
		}

		const sample = this.profiler.snapshot(this.engine.frameEvent.delta);
		this.samples.push(sample);
		this.phaseFrameCount++;

		if (this.phaseFrameCount >= this.config.measureFrames) {
			const stopScenario = this.recordCheckpoint();
			this.nextCheckpointOrScenario(stopScenario);
		}
	}

	start() {
		this.refreshCheckpoints();
		this.exitframeBind = this.step.bind(this);
		this.log('Starting scenario: ' + this.currentScenario().name);
		this.engine.addEventListener('exitframe', this.exitframeBind);
	}
}

function parseConfig() {
	const searchParams = new URLSearchParams(window.location.search);
	return {
		seed: Number(searchParams.get('seed') ?? defaultConfig.seed),
		startCount: Number(searchParams.get('startCount') ?? defaultConfig.startCount),
		endCount: Number(searchParams.get('endCount') ?? defaultConfig.endCount),
		step: Number(searchParams.get('step') ?? defaultConfig.step),
		spawnPerFrame: Number(searchParams.get('spawnPerFrame') ?? defaultConfig.spawnPerFrame),
		warmupFrames: Number(searchParams.get('warmupFrames') ?? defaultConfig.warmupFrames),
		measureFrames: Number(searchParams.get('measureFrames') ?? defaultConfig.measureFrames),
		stopP95Ms: Number(searchParams.get('stopP95Ms') ?? searchParams.get('physicsStopP95Ms') ?? defaultConfig.stopP95Ms),
		physicsStopP95Ms: Number(searchParams.get('physicsStopP95Ms') ?? searchParams.get('stopP95Ms') ?? defaultConfig.physicsStopP95Ms),
	};
}

async function copyTextToClipboard(text) {
	if (navigator.clipboard && navigator.clipboard.writeText) {
		await navigator.clipboard.writeText(text);
		return;
	}

	const tempArea = document.createElement('textarea');
	tempArea.value = text;
	document.body.appendChild(tempArea);
	tempArea.select();
	document.execCommand('copy');
	document.body.removeChild(tempArea);
}

let engine;
let profiler;
let benchmarkRunner;

function startBenchmark() {
	const output = document.getElementById('benchmark-output');
	const copyButton = document.getElementById('benchmark-copy');
	if (copyButton && output) {
		copyButton.addEventListener('click', async () => {
			let text = output.textContent ?? '';
			if (window.__zetoBenchmarkResults) {
				text += '\n\nJSON:\n' + JSON.stringify(window.__zetoBenchmarkResults, null, 2);
			}
			await copyTextToClipboard(text);
			copyButton.textContent = 'Copied';
			window.setTimeout(() => {
				copyButton.textContent = 'Copy output';
			}, 1200);
		});
	}

	profiler = installPhaseProfiler(engine);
	benchmarkRunner = new BenchmarkRunner(engine, profiler, parseConfig(), output);
	benchmarkRunner.start();
}

function onAssetsLoaded() {
	startBenchmark();
}

export function create(event) {
	engine = event.engine;
	engine.clearColor = '#121212';
	engine.fillColor = '#DDDDDD';
	engine.physics.maxDelta = 1000 / 40;

	const images = [
		{ id: 'benchmark-sprite', filename: createTextureDataUrl(24, '#22CC88', '#117755') },
		{ id: 'benchmark-particle', filename: createTextureDataUrl(16, '#FFFFFF') },
	];

	engine.loadAssets(images, null, null, event.complete(onAssetsLoaded), event.progress());
}

export function destroy(event) {
	if (benchmarkRunner?.exitframeBind) {
		engine.removeEventListener('exitframe', benchmarkRunner.exitframeBind);
	}
	profiler?.restore();
	event.complete();
}
