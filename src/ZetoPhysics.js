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

const getBodyVertices = (body) => {
	if (!body) {
		return [];
	}
	if (body.type == 'circle') {
		return body.vertices ?? [];
	}
	if (body.type == 'rectangle') {
		var halfWidth = (body.width ?? 0) * 0.5;
		var halfHeight = (body.height ?? 0) * 0.5;
		var angle = body.angle ?? 0;
		var cos = Math.cos(angle);
		var sin = Math.sin(angle);
		var localVertices = [
			{ x: -halfWidth, y: -halfHeight },
			{ x: halfWidth, y: -halfHeight },
			{ x: halfWidth, y: halfHeight },
			{ x: -halfWidth, y: halfHeight },
		];
		return localVertices.map((vertex) => ({
			x: body.position.x + vertex.x * cos - vertex.y * sin,
			y: body.position.y + vertex.x * sin + vertex.y * cos,
		}));
	}
	if (Array.isArray(body.vertices)) {
		var angle = body.angle ?? 0;
		var cos = Math.cos(angle);
		var sin = Math.sin(angle);
		return body.vertices.map((vertex) => ({
			x: body.position.x + (vertex.x - body.position.x) * cos - (vertex.y - body.position.y) * sin,
			y: body.position.y + (vertex.x - body.position.x) * sin + (vertex.y - body.position.y) * cos,
		}));
	}
	return [];
};

const applyAngularImpulse = (body, impulseX, impulseY, contactX, contactY) => {
	if (!body || body.isStatic || body.inertia == Infinity) {
		return;
	}
	if (contactX == null || contactY == null) {
		return;
	}

	var offsetX = contactX - body.position.x;
	var offsetY = contactY - body.position.y;
	var torque = offsetX * impulseY - offsetY * impulseX;
	body.angularVelocity += torque / Math.max(body.inertia ?? 1, 1);
};

export const applyRadialResponse = (bodyA, bodyB) => {
	if (!bodyA || !bodyB) {
		return;
	}
	var sourceBody = bodyA?.radialResponseStrength > 0 ? bodyA : bodyB?.radialResponseStrength > 0 ? bodyB : null;
	if (!sourceBody || sourceBody.isStatic) {
		return;
	}
	var targetBody = sourceBody == bodyA ? bodyB : bodyA;
	if (!targetBody || targetBody.isStatic) {
		return;
	}
	var dx = targetBody.position.x - sourceBody.position.x;
	var dy = targetBody.position.y - sourceBody.position.y;
	var distance = Math.hypot(dx, dy) || 1;
	var strength = sourceBody.radialResponseStrength ?? 0;
	if (strength <= 0) {
		return;
	}
	var normalX = dx / distance;
	var normalY = dy / distance;
	targetBody.velocity.x += normalX * strength;
	targetBody.velocity.y += normalY * strength;
};

const applyBodyCollisionResponse = (bodyA, bodyB, normalX, normalY, overlap, contactX = null, contactY = null) => {
	if (!bodyA || !bodyB || overlap <= 0) {
		return;
	}
	if (bodyA.isStatic && bodyB.isStatic) {
		return;
	}

	var inverseMassA = bodyA.isStatic || bodyA.mass == Infinity ? 0 : 1 / bodyA.mass;
	var inverseMassB = bodyB.isStatic || bodyB.mass == Infinity ? 0 : 1 / bodyB.mass;
	var totalInverseMass = inverseMassA + inverseMassB;
	if (totalInverseMass <= 0) {
		return;
	}

	var moveBodyA = inverseMassA / totalInverseMass;
	var moveBodyB = inverseMassB / totalInverseMass;

	if (!bodyA.isStatic) {
		bodyA.position.x -= normalX * overlap * moveBodyA;
		bodyA.position.y -= normalY * overlap * moveBodyA;
	}
	if (!bodyB.isStatic) {
		bodyB.position.x += normalX * overlap * moveBodyB;
		bodyB.position.y += normalY * overlap * moveBodyB;
	}

	var relativeVelocityX = bodyB.velocity.x - bodyA.velocity.x;
	var relativeVelocityY = bodyB.velocity.y - bodyA.velocity.y;
	var velocityAlongNormal = relativeVelocityX * normalX + relativeVelocityY * normalY;
	if (velocityAlongNormal >= 0) {
		applyRadialResponse(bodyA, bodyB);
		return;
	}

	var restitution = Math.min(bodyA.restitution ?? 0.1, bodyB.restitution ?? 0.1);
	var impulseMagnitude = (-(1 + restitution) * velocityAlongNormal) / totalInverseMass;
	var impulseX = impulseMagnitude * normalX;
	var impulseY = impulseMagnitude * normalY;

	if (!bodyA.isStatic) {
		bodyA.velocity.x -= impulseX * inverseMassA;
		bodyA.velocity.y -= impulseY * inverseMassA;
		if (!bodyB.isStatic) {
			applyAngularImpulse(bodyA, -impulseX, -impulseY, contactX, contactY);
		}
	}
	if (!bodyB.isStatic) {
		bodyB.velocity.x += impulseX * inverseMassB;
		bodyB.velocity.y += impulseY * inverseMassB;
		if (!bodyA.isStatic) {
			applyAngularImpulse(bodyB, impulseX, impulseY, contactX, contactY);
		}
	}
	applyRadialResponse(bodyA, bodyB);
};

const resolveCircleCollision = (bodyA, bodyB) => {
	if (!bodyA || !bodyB || (bodyA.isStatic && bodyB.isStatic)) {
		return;
	}
	if (bodyA.type != 'circle' || bodyB.type != 'circle') {
		return;
	}

	var dx = bodyB.position.x - bodyA.position.x;
	var dy = bodyB.position.y - bodyA.position.y;
	var minDistance = (bodyA.radius ?? 0) + (bodyB.radius ?? 0);
	var minDistanceSquared = minDistance * minDistance;
	var distanceSquared = dx * dx + dy * dy;
	if (distanceSquared > minDistanceSquared) {
		return;
	}

	var distance = Math.sqrt(Math.max(distanceSquared, 0.000001));
	if (distance <= 0.000001) {
		distance = 1;
		dx = 1;
		dy = 0;
	}

	var normalX = dx / distance;
	var normalY = dy / distance;
	var overlap = Math.max(0, minDistance - distance);
	var contactX = bodyA.position.x + normalX * (bodyA.radius ?? 0);
	var contactY = bodyA.position.y + normalY * (bodyA.radius ?? 0);
	applyBodyCollisionResponse(bodyA, bodyB, normalX, normalY, overlap, contactX, contactY);
};

const rotateVector = (x, y, angle) => {
	var cos = Math.cos(angle);
	var sin = Math.sin(angle);
	return {
		x: x * cos - y * sin,
		y: x * sin + y * cos,
	};
};

const inverseRotateVector = (x, y, angle) => {
	var cos = Math.cos(-angle);
	var sin = Math.sin(-angle);
	return {
		x: x * cos - y * sin,
		y: x * sin + y * cos,
	};
};

const resolveCircleRectCollision = (circle, rect) => {
	if (!circle || !rect) {
		return;
	}
	if (circle.type != 'circle' || (rect.type != 'rectangle' && rect.type != 'polygon')) {
		return;
	}

	var rectHalfWidth = (rect.width ?? 0) * 0.5;
	var rectHalfHeight = (rect.height ?? 0) * 0.5;
	var rectAngle = rect.angle ?? 0;
	var relX = circle.position.x - rect.position.x;
	var relY = circle.position.y - rect.position.y;
	var localPosition = inverseRotateVector(relX, relY, rectAngle);
	var closestX = Math.min(Math.max(localPosition.x, -rectHalfWidth), rectHalfWidth);
	var closestY = Math.min(Math.max(localPosition.y, -rectHalfHeight), rectHalfHeight);
	var deltaX = localPosition.x - closestX;
	var deltaY = localPosition.y - closestY;
	var radius = circle.radius ?? 0;
	var distanceSquared = deltaX * deltaX + deltaY * deltaY;
	if (distanceSquared > radius * radius) {
		return;
	}

	var normalLocalX = 0;
	var normalLocalY = 0;
	var overlap = 0;
	if (distanceSquared <= 0.0001) {
		var overlapX = rectHalfWidth + radius - Math.abs(localPosition.x);
		var overlapY = rectHalfHeight + radius - Math.abs(localPosition.y);
		if (overlapX < overlapY) {
			normalLocalX = localPosition.x >= 0 ? 1 : -1;
			normalLocalY = 0;
			overlap = overlapX;
		} else {
			normalLocalX = 0;
			normalLocalY = localPosition.y >= 0 ? 1 : -1;
			overlap = overlapY;
		}
	} else {
		var distance = Math.sqrt(distanceSquared);
		normalLocalX = (closestX - localPosition.x) / distance;
		normalLocalY = (closestY - localPosition.y) / distance;
		overlap = radius - distance;
	}

	var normalWorld = rotateVector(normalLocalX, normalLocalY, rectAngle);
	var contactLocal = { x: closestX, y: closestY };
	var contactWorldDelta = rotateVector(contactLocal.x, contactLocal.y, rectAngle);
	var contactX = rect.position.x + contactWorldDelta.x;
	var contactY = rect.position.y + contactWorldDelta.y;
	applyBodyCollisionResponse(circle, rect, normalWorld.x, normalWorld.y, overlap, contactX, contactY);
};

const getSupportVertex = (vertices, axisX, axisY) => {
	if (!vertices || vertices.length <= 0) {
		return { x: 0, y: 0 };
	}
	var bestVertex = vertices[0];
	var bestProjection = bestVertex.x * axisX + bestVertex.y * axisY;
	for (var index = 1; index < vertices.length; index++) {
		var vertex = vertices[index];
		var projection = vertex.x * axisX + vertex.y * axisY;
		if (projection > bestProjection) {
			bestProjection = projection;
			bestVertex = vertex;
		}
	}
	return bestVertex;
};

const resolveRectangleCollision = (bodyA, bodyB) => {
	if (!bodyA || !bodyB || (bodyA.isStatic && bodyB.isStatic)) {
		return;
	}
	if ((bodyA.type != 'rectangle' && bodyA.type != 'polygon') || (bodyB.type != 'rectangle' && bodyB.type != 'polygon')) {
		return;
	}

	var verticesA = getBodyVertices(bodyA);
	var verticesB = getBodyVertices(bodyB);
	var axes = [];
	var angleA = bodyA.angle ?? 0;
	var angleB = bodyB.angle ?? 0;
	axes.push({ x: Math.cos(angleA), y: Math.sin(angleA) });
	axes.push({ x: -Math.sin(angleA), y: Math.cos(angleA) });
	axes.push({ x: Math.cos(angleB), y: Math.sin(angleB) });
	axes.push({ x: -Math.sin(angleB), y: Math.cos(angleB) });

	var smallestOverlap = Infinity;
	var bestAxis = null;
	for (var axisIndex = 0; axisIndex < axes.length; axisIndex++) {
		var axis = axes[axisIndex];
		var axisLengthSquared = axis.x * axis.x + axis.y * axis.y;
		if (axisLengthSquared <= 0.0001) {
			continue;
		}
		var projectionA = verticesA.reduce((result, vertex) => {
			var projection = vertex.x * axis.x + vertex.y * axis.y;
			result.min = Math.min(result.min, projection);
			result.max = Math.max(result.max, projection);
			return result;
		}, { min: Infinity, max: -Infinity });
		var projectionB = verticesB.reduce((result, vertex) => {
			var projection = vertex.x * axis.x + vertex.y * axis.y;
			result.min = Math.min(result.min, projection);
			result.max = Math.max(result.max, projection);
			return result;
		}, { min: Infinity, max: -Infinity });
		var overlap = Math.min(projectionA.max, projectionB.max) - Math.max(projectionA.min, projectionB.min);
		if (overlap <= 0 || projectionA.max < projectionB.min || projectionB.max < projectionA.min) {
			return;
		}
		if (overlap < smallestOverlap) {
			smallestOverlap = overlap;
			bestAxis = axis;
		}
	}

	if (!bestAxis) {
		return;
	}
	var centerDeltaX = bodyB.position.x - bodyA.position.x;
	var centerDeltaY = bodyB.position.y - bodyA.position.y;
	if (centerDeltaX * bestAxis.x + centerDeltaY * bestAxis.y < 0) {
		bestAxis = { x: -bestAxis.x, y: -bestAxis.y };
	}

	var supportA = getSupportVertex(verticesA, bestAxis.x, bestAxis.y);
	var supportB = getSupportVertex(verticesB, -bestAxis.x, -bestAxis.y);
	var contactX = (supportA.x + supportB.x) * 0.5;
	var contactY = (supportA.y + supportB.y) * 0.5;
	applyBodyCollisionResponse(bodyA, bodyB, bestAxis.x, bestAxis.y, smallestOverlap, contactX, contactY);
};

const resolveBodyCollision = (bodyA, bodyB) => {
	if (!bodyA || !bodyB) {
		return;
	}
	if (bodyA.type == 'circle' && bodyB.type == 'circle') {
		resolveCircleCollision(bodyA, bodyB);
		return;
	}
	if (bodyA.type == 'circle' && (bodyB.type == 'rectangle' || bodyB.type == 'polygon')) {
		resolveCircleRectCollision(bodyA, bodyB);
		return;
	}
	if ((bodyA.type == 'rectangle' || bodyA.type == 'polygon') && bodyB.type == 'circle') {
		resolveCircleRectCollision(bodyB, bodyA);
		return;
	}
	if ((bodyA.type == 'rectangle' || bodyA.type == 'polygon') && (bodyB.type == 'rectangle' || bodyB.type == 'polygon')) {
		resolveRectangleCollision(bodyA, bodyB);
	}
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
		var bodies = world.bodies;
		var fixedStepMs = 1000 / 120;
		var maxSubSteps = 8;
		var remainingMs = Math.max(delta, 1);
		var subStepCount = 0;

		while (remainingMs > 0.0001 && subStepCount < maxSubSteps) {
			var subDelta = Math.min(remainingMs, fixedStepMs);
			var dt = subDelta / 1000;

			for (var bodyIndex = 0; bodyIndex < bodies.length; bodyIndex++) {
				var body = bodies[bodyIndex];
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
					var angle = body.angle ?? 0;
					var cos = Math.cos(angle);
					var sin = Math.sin(angle);
					var localVertices = [
						{ x: -halfWidth, y: -halfHeight },
						{ x: halfWidth, y: -halfHeight },
						{ x: halfWidth, y: halfHeight },
						{ x: -halfWidth, y: halfHeight },
					];
					body.vertices = localVertices.map((vertex) => ({
						x: cx + vertex.x * cos - vertex.y * sin,
						y: cy + vertex.x * sin + vertex.y * cos,
					}));
				}
			}

			for (var i = 0; i < bodies.length; i++) {
				var bodyA = bodies[i];
				if (!bodyA) {
					continue;
				}
				for (var j = i + 1; j < bodies.length; j++) {
					var bodyB = bodies[j];
					if (!bodyB) {
						continue;
					}
					resolveBodyCollision(bodyA, bodyB);
				}
			}

			remainingMs -= subDelta;
			subStepCount++;
		}
		return engine;
	},
};

///////////////////////////////////////////// Matter.js
export const Matter = globalThis?.Matter ?? undefined;

export const libBody = Matter?.Body ?? defaultBodyApi;
export const libBodies = Matter?.Bodies ?? defaultBodiesApi;
export const libEngine = Matter?.Engine ?? defaultEngineApi;
export const libComposite = Matter?.Composite ?? defaultCompositeApi;
export const libVertices = Matter?.Vertices ?? defaultVerticesApi;
export const libEvents = Matter?.Events ?? defaultEventsApi;
