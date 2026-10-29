import { ZetoEngine } from '../src/ZetoEngine.js';
import { ZetoPhysicsEngine } from '../src/ZetoPhysicsEngine.js';

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
			matterBody: {},
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
}
