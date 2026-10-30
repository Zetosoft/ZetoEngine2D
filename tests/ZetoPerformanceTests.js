import { ZetoEngine } from '../src/ZetoEngine.js';
import { ZetoPhysicsEngine } from '../src/ZetoPhysicsEngine.js';
import { applyRadialResponse, libEngine } from '../src/ZetoPhysics.js';

export function test({ tester }) {
	tester.setup(() => {
		const engine = new ZetoEngine({ warn: false });
		return {
			engine: engine,
		};
	});

	tester.test('newRect can be created detached from root group', (setup) => {
		const rootChildren = setup.engine.rootGroup.children.length;
		const detachedRect = setup.engine.newRect(0, 0, 10, 10, false);
		tester.assertSame(rootChildren, setup.engine.rootGroup.children.length, 'detached object should not be inserted to root group');
		tester.assertSame(null, detachedRect.parent, 'detached object should not have a parent');
	});

	tester.test('newRect default behavior still inserts to root group', (setup) => {
		const rect = setup.engine.newRect(0, 0, 10, 10);
		tester.assertSame(setup.engine.rootGroup, rect.parent, 'default newRect should be inserted in root group');
	});

	tester.test('dispatchObjectEvent skips work when object has no listeners for event', (setup) => {
		const rect = setup.engine.newRect(0, 0, 10, 10, false);
		const result = setup.engine.dispatchObjectEvent(rect, 'enterframe', { frame: 1, delta: 16, timeStamp: 16 });
		tester.assertSame(false, result, 'dispatchObjectEvent should return false when listeners are missing');
	});

	tester.test('pointInObjectLocalBounds handles default anchor and anchor offset correctly', (setup) => {
		const rect = setup.engine.newRect(0, 0, 10, 10, false);

		tester.assertTrue(setup.engine.pointInObjectLocalBounds(rect, 0, 0), 'center point should be inside default anchored bounds');
		tester.assertFalse(setup.engine.pointInObjectLocalBounds(rect, 20, 0), 'far point should be outside default anchored bounds');

		rect.anchorX = 0;
		tester.assertTrue(setup.engine.pointInObjectLocalBounds(rect, 8, 0), 'point should be inside after anchor offset is applied');
		tester.assertFalse(setup.engine.pointInObjectLocalBounds(rect, -2, 0), 'point should be outside after anchor offset is applied');
	});

	tester.test('removeBodyByBody removes body from update list and object reference', (setup) => {
		const physics = new ZetoPhysicsEngine(setup.engine, false);
		const removeListener = tester.expectCall('removeEventListener', 1);
		const object = {
			removeEventListener: removeListener,
			body: null,
		};
		const body = {
			object: object,
			finalizeBind: () => {},
			libBody: {},
		};
		object.body = body;
		physics.bodies.push(body);

		physics.removeBodyByBody(body);

		tester.assertSame(0, physics.bodies.length, 'removed body should be removed from bodies list');
		tester.assertSame(null, object.body, 'removed body reference should be cleared from object');
	});

	tester.test('container anchorChildren defaults true and false decouples children from anchor', (setup) => {
		const container = setup.engine.newContainer(0, 0, 100, 100, false);
		const child = setup.engine.newRect(0, 0, 10, 10, false);
		container.insert(child);

		container.anchorX = 0;
		tester.assertSame(50, container.internal.anchorOffsetX, 'container anchor should move clip bounds with width-based offset');
		tester.assertSame(0, container.view.x, 'children should remain lock-step with clip bounds when anchorChildren is true');

		container.anchorChildren = false;
		container.anchorX = 1;
		tester.assertSame(-50, container.internal.anchorOffsetX, 'container anchor should still update clip-bounds offset when decoupled');
		tester.assertSame(100, container.view.x, 'children should be decoupled from clip-bounds anchor movement when anchorChildren is false');
	});

	tester.test('scroll view defaults to anchorChildren true and width updates preserve anchor offsets', (setup) => {
		const scrollView = setup.engine.widgets.newScrollView({
			x: 0,
			y: 0,
			width: 100,
			height: 80,
		});

		tester.assertSame(true, scrollView.anchorChildren, 'scroll view should default anchorChildren to true');

		scrollView.anchorX = 0;
		tester.assertSame(50, scrollView.internal.anchorOffsetX, 'scroll view anchor offset should use viewport width');

		scrollView.width = 200;
		tester.assertSame(100, scrollView.internal.anchorOffsetX, 'scroll view width changes should refresh anchor offset');
	});

	tester.test('fallback physics uses fixed deterministic 16ms step per frame', (setup) => {
		const physics = new ZetoPhysicsEngine(setup.engine, false);
		let capturedDelta = null;
		const originalUpdate = libEngine.update;

		try {
			libEngine.update = function (engine, delta) {
				capturedDelta = delta;
				return engine;
			};

			physics.start();
			physics.update({ delta: 33.3333 });
		} finally {
			libEngine.update = originalUpdate;
		}

		tester.assertSame(16, capturedDelta, 'fallback physics should ignore event.delta and always use fixed 16ms');
	});

	tester.test('fallback physics skips updates while paused', (setup) => {
		const physics = new ZetoPhysicsEngine(setup.engine, false);
		let updateCalls = 0;
		const originalUpdate = libEngine.update;

		try {
			libEngine.update = function (engine, delta) {
				updateCalls++;
				return engine;
			};

			physics.update({ delta: 99 });
		} finally {
			libEngine.update = originalUpdate;
		}

		tester.assertSame(0, updateCalls, 'paused physics should not call the physics engine update');
	});

	tester.test('fallback physics advances by equal steps regardless of incoming delta value', (setup) => {
		const physics = new ZetoPhysicsEngine(setup.engine, false);
		const object = setup.engine.newRect(0, 0, 20, 20, false);
		physics.addBody(object, 'dynamic', {});
		physics.setGravity(0, 0);
		object.body.setLinearVelocity(1, 0);
		physics.start();

		physics.update({ delta: 1.5 });
		const first = object.body.libBody.position.x;
		physics.update({ delta: 75.2 });
		const second = object.body.libBody.position.x;
		physics.update({ delta: 0.1 });
		const third = object.body.libBody.position.x;

		const stepA = second - first;
		const stepB = third - second;
		tester.assertSame(stepA, stepB, 'fallback physics displacement per frame should be deterministic and frame-based');
	});

	tester.test('box radial response applies outward velocity on collision', (setup) => {
		const physics = new ZetoPhysicsEngine(setup.engine, false);
		const boxA = setup.engine.newRect(0, 0, 20, 20, false);
		const boxB = setup.engine.newRect(10, 0, 20, 20, false);
		physics.addBody(boxA, 'dynamic', { radialResponseStrength: 0.5 });
		physics.addBody(boxB, 'dynamic', {});
		boxA.body.libBody.radialResponseStrength = 0.5;
		boxB.body.libBody.velocity.x = 0;
		boxB.body.libBody.velocity.y = 0;
		applyRadialResponse(boxA.body.libBody, boxB.body.libBody);

		tester.assertTrue(Math.abs(boxB.body.libBody.velocity.x - 0.5) < 0.000001, 'radial response should push the target body away from the source body');
	});

	tester.test('dynamic box collision can generate angular velocity without static-floor spin', (setup) => {
		const physics = new ZetoPhysicsEngine(setup.engine, false);
		const boxA = setup.engine.newRect(0, 0, 20, 20, false);
		const boxB = setup.engine.newRect(30, 0, 20, 20, false);
		physics.addBody(boxA, 'dynamic', {});
		physics.addBody(boxB, 'dynamic', {});
		physics.setGravity(0, 0);
		boxA.body.setLinearVelocity(0, 0);
		boxB.body.setLinearVelocity(-1, 0);
		physics.start();

		for (let index = 0; index < 20; index++) {
			physics.update({ delta: 16 });
		}

		tester.assertTrue(Math.abs(boxA.body.getAngularVelocity()) > 0.000001 || Math.abs(boxB.body.getAngularVelocity()) > 0.000001, 'dynamic-vs-dynamic box collision should produce angular velocity');
	});
}
