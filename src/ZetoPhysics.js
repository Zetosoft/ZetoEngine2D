const defaultVertexSet = (x, y, radius, segments) => {
	var vertices = [];
	for (var index = 0; index < segments; index++) {
		var angle = (index / segments) * Math.PI * 2;
		vertices.push({
			x: x + Math.cos(angle) * radius,
			y: y + Math.sin(angle) * radius,
		});
	}
	return vertices;
};

const defaultBodyApi = {
	setPosition(body, position, isRelative = false) {
		if (!body) {
			return body;
		}
		var target = isRelative
			? {
					x: body.position.x + position.x,
					y: body.position.y + position.y,
				}
			: position;
		body.position.x = target.x;
		body.position.y = target.y;
		body.positionPrev = { x: target.x, y: target.y };
		return body;
	},
	translate(body, position) {
		if (!body) {
			return body;
		}
		body.position.x += position.x ?? 0;
		body.position.y += position.y ?? 0;
		body.positionPrev = { x: body.position.x, y: body.position.y };
		return body;
	},
	scale(body, xScale, yScale) {
		if (!body) {
			return body;
		}
		if (body.type == 'circle') {
			body.radius = Math.max(Math.abs(body.radius * xScale), 0.0001);
			body.vertices = defaultVertexSet(body.position.x, body.position.y, body.radius, body.segments ?? 12);
		} else {
			body.width = Math.max((body.width ?? 0) * (xScale ?? 1), 0.0001);
			body.height = Math.max((body.height ?? 0) * (yScale ?? 1), 0.0001);
			var halfWidth = (body.width ?? 0) * 0.5;
			var halfHeight = (body.height ?? 0) * 0.5;
			var cx = body.position.x;
			var cy = body.position.y;
			body.vertices = [
				{ x: cx - halfWidth, y: cy - halfHeight },
				{ x: cx + halfWidth, y: cy - halfHeight },
				{ x: cx + halfWidth, y: cy + halfHeight },
				{ x: cx - halfWidth, y: cy + halfHeight },
			];
		}
		return body;
	},
	applyForce(body, position, force) {
		if (!body) {
			return;
		}
		body.force = body.force ?? { x: 0, y: 0 };
		body.force.x += force.x ?? 0;
		body.force.y += force.y ?? 0;
		return body;
	},
	setVelocity(body, velocity) {
		if (!body) {
			return body;
		}
		body.velocity = {
			x: velocity.x ?? 0,
			y: velocity.y ?? 0,
		};
		return body;
	},
	setAngularVelocity(body, angularVelocity) {
		if (!body) {
			return body;
		}
		body.angularVelocity = angularVelocity ?? 0;
		return body;
	},
	setMass(body, mass) {
		if (!body) {
			return body;
		}
		body.mass = mass;
		body.inertia = mass == Infinity ? Infinity : body.mass * 1000;
		return body;
	},
	setAngle(body, angle) {
		if (!body) {
			return body;
		}
		body.angle = angle;
		return body;
	},
};

const defaultBodiesApi = {
	circle(x, y, radius, options = {}, segments = 16) {
		var body = {
			type: 'circle',
			position: { x, y },
			positionPrev: { x, y },
			velocity: { x: 0, y: 0 },
			force: { x: 0, y: 0 },
			mass: options.isStatic ? Infinity : (options.density ?? 1),
			inertia: options.isStatic ? Infinity : (options.density ?? 1) * 1000,
			angle: options.angle ?? 0,
			angularVelocity: 0,
			radius: radius,
			segments,
			isStatic: options.isStatic ?? false,
			isSensor: options.isSensor ?? false,
			collisionFilter: options.collisionFilter ?? { category: 1, mask: 1, group: 0 },
			restitution: options.restitution ?? 0.1,
			friction: options.friction ?? 0.1,
			density: options.density ?? 1,
			vertices: defaultVertexSet(x, y, radius, segments),
		};
		return body;
	},
	rectangle(x, y, width, height, options = {}) {
		var body = {
			type: 'rectangle',
			position: { x, y },
			positionPrev: { x, y },
			velocity: { x: 0, y: 0 },
			force: { x: 0, y: 0 },
			mass: options.isStatic ? Infinity : (options.density ?? 1),
			inertia: options.isStatic ? Infinity : (options.density ?? 1) * 1000,
			angle: options.angle ?? 0,
			angularVelocity: 0,
			width: width,
			height: height,
			isStatic: options.isStatic ?? false,
			isSensor: options.isSensor ?? false,
			collisionFilter: options.collisionFilter ?? { category: 1, mask: 1, group: 0 },
			restitution: options.restitution ?? 0.1,
			friction: options.friction ?? 0.1,
			density: options.density ?? 1,
		};
		var halfWidth = width * 0.5;
		var halfHeight = height * 0.5;
		body.vertices = [
			{ x: x - halfWidth, y: y - halfHeight },
			{ x: x + halfWidth, y: y - halfHeight },
			{ x: x + halfWidth, y: y + halfHeight },
			{ x: x - halfWidth, y: y + halfHeight },
		];
		return body;
	},
	fromVertices(x, y, shape, options = {}) {
		var vertices = (shape ?? []).map((vertex) => ({ x: x + (vertex.x ?? 0), y: y + (vertex.y ?? 0) }));
		var body = {
			type: 'polygon',
			position: { x, y },
			positionPrev: { x, y },
			velocity: { x: 0, y: 0 },
			force: { x: 0, y: 0 },
			mass: options.isStatic ? Infinity : (options.density ?? 1),
			inertia: options.isStatic ? Infinity : (options.density ?? 1) * 1000,
			angle: options.angle ?? 0,
			angularVelocity: 0,
			isStatic: options.isStatic ?? false,
			isSensor: options.isSensor ?? false,
			collisionFilter: options.collisionFilter ?? { category: 1, mask: 1, group: 0 },
			restitution: options.restitution ?? 0.1,
			friction: options.friction ?? 0.1,
			density: options.density ?? 1,
			vertices,
		};
		body.width = Math.max(...vertices.map((vertex) => vertex.x)) - Math.min(...vertices.map((vertex) => vertex.x));
		body.height = Math.max(...vertices.map((vertex) => vertex.y)) - Math.min(...vertices.map((vertex) => vertex.y));
		return body;
	},
};

const defaultCompositeApi = {
	add(world, body) {
		if (!world || !body) {
			return body;
		}
		world.bodies = world.bodies ?? [];
		if (world.bodies.indexOf(body) == -1) {
			world.bodies.push(body);
		}
		return body;
	},
	remove(world, body) {
		if (!world || !body) {
			return body;
		}
		world.bodies = world.bodies ?? [];
		var index = world.bodies.indexOf(body);
		if (index > -1) {
			world.bodies.splice(index, 1);
		}
		return body;
	},
};

const defaultVerticesApi = {
	centre(vertices) {
		var allVertices = vertices ?? [];
		if (!allVertices.length) {
			return { x: 0, y: 0 };
		}
		var totalX = allVertices.reduce((sum, vertex) => sum + (vertex.x ?? 0), 0);
		var totalY = allVertices.reduce((sum, vertex) => sum + (vertex.y ?? 0), 0);
		return { x: totalX / allVertices.length, y: totalY / allVertices.length };
	},
};

const defaultEventsApi = {
	on() {},
	off() {},
	trigger() {},
};

const defaultEngineApi = {
	create(options = {}) {
		return {
			world: {
				bodies: [],
			},
			gravity: { x: 0, y: 1 },
			positionIterations: options.positionIterations ?? 2,
			velocityIterations: options.velocityIterations ?? 2,
			constraintIterations: options.constraintIterations ?? 1,
		};
	},
	update(engine, delta = 16.67) {
		if (!engine || !engine.world) {
			return engine;
		}
		var world = engine.world;
		var dt = Math.max(delta, 1) / 1000;
		for (var bodyIndex = 0; bodyIndex < world.bodies.length; bodyIndex++) {
			var body = world.bodies[bodyIndex];
			if (!body || body.isStatic) {
				continue;
			}
			body.velocity.x += ((body.force.x ?? 0) * dt) / Math.max(body.mass || 1, 1);
			body.velocity.y += ((body.force.y ?? 0) * dt) / Math.max(body.mass || 1, 1);
			body.velocity.x += engine.gravity.x * dt;
			body.velocity.y += engine.gravity.y * dt;
			body.position.x += body.velocity.x * dt * 60;
			body.position.y += body.velocity.y * dt * 60;
			body.angle += (body.angularVelocity ?? 0) * dt * 60;
			body.force.x = 0;
			body.force.y = 0;
			if (body.type == 'circle') {
				body.vertices = defaultVertexSet(body.position.x, body.position.y, body.radius, body.segments ?? 12);
			} else if (body.type == 'rectangle' || body.type == 'polygon') {
				var halfWidth = (body.width ?? 0) * 0.5;
				var halfHeight = (body.height ?? 0) * 0.5;
				var cx = body.position.x;
				var cy = body.position.y;
				body.vertices = [
					{ x: cx - halfWidth, y: cy - halfHeight },
					{ x: cx + halfWidth, y: cy - halfHeight },
					{ x: cx + halfWidth, y: cy + halfHeight },
					{ x: cx - halfWidth, y: cy + halfHeight },
				];
			}
		}
		return engine;
	},
};

///////////////////////////////////////////// Matter.js
export const Matter = window?.Matter ?? globalThis?.Matter ?? undefined;

export const libBody = Matter?.Body ?? defaultBodyApi;
export const libBodies = Matter?.Bodies ?? defaultBodiesApi;
export const libEngine = Matter?.Engine ?? defaultEngineApi;
export const libComposite = Matter?.Composite ?? defaultCompositeApi;
export const libVertices = Matter?.Vertices ?? defaultVerticesApi;
export const libEvents = Matter?.Events ?? defaultEventsApi;

