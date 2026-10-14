import { ZetoTransitionEngine } from '../src/ZetoTransitionEngine.js';

export function test({ tester }) {
	tester.setup(() => {
		return {
			transitionEngine: new ZetoTransitionEngine(tester),
		};
	});

	tester.test('to and from create transition', (setup) => {
		let object = {};
		let toTransition = setup.transitionEngine.to(object, { x: 100, y: 200 });
		tester.assertSame(1, setup.transitionEngine.transitions.length, 'transitions should have 1 item');
		tester.assertSame(1, object.transitions.length, 'object should have 1 transition');

		let fromTransition = setup.transitionEngine.from(object, { x: 0, y: 0 });
		tester.assertSame(2, setup.transitionEngine.transitions.length, 'transitions should have 2 items');
		tester.assertSame(2, object.transitions.length, 'object should have 2 transitions');
	});

	tester.test('cancel removes transition after update', (setup) => {
		let object = {};
		let transition = setup.transitionEngine.to(object, { x: 100, y: 200 });
		tester.assertSame(1, setup.transitionEngine.transitions.length, 'transitions should have 1 item');
		setup.transitionEngine.cancel(transition);
		setup.transitionEngine.update({ delta: 0 });
		tester.assertSame(0, setup.transitionEngine.transitions.length, 'transitions should have 0 items');
	});

	tester.test('cancel works with transition and object', (setup) => {
		let object = {};
		let transition = setup.transitionEngine.to(object, { x: 100, y: 200 });
		tester.assertSame(1, setup.transitionEngine.transitions.length, 'transitions should have 1 item');
		setup.transitionEngine.cancel(object);
		setup.transitionEngine.update({ delta: 0 });
		tester.assertSame(0, setup.transitionEngine.transitions.length, 'transitions should have 0 items');
	});

	tester.test('onComplete is called after transition complete', (setup) => {
		let object = {};
		let transition = setup.transitionEngine.to(object, { time: 200, x: 100, y: 200, onComplete: tester.expectCall('transition onComplete') });
		setup.transitionEngine.update({ delta: 200 });
	});

	tester.test('onComplete is called after update when time is 0', (setup) => {
		let object = {};
		let transition = setup.transitionEngine.to(object, { time: 0, x: 100, y: 200, onComplete: tester.expectCall('transition onComplete') });
		setup.transitionEngine.update({ delta: 0 });
	});

	tester.test('cancel prevents transition onComplete', (setup) => {
		let object = {};
		let transition = setup.transitionEngine.to(object, { time: 200, x: 100, y: 200, onComplete: tester.expectCall('transition onComplete', 0) });
		setup.transitionEngine.cancel(transition);
		setup.transitionEngine.update({ delta: 200 });
	});

	tester.test('onStart is called after first update', (setup) => {
		let object = {};
		let transition = setup.transitionEngine.to(object, { time: 200, x: 100, y: 200, onStart: tester.expectCall('transition onStart') });
		setup.transitionEngine.update({ delta: 0 });
	});

	tester.test('onStart is called after first update when time is 0', (setup) => {
		let object = {};
		let transition = setup.transitionEngine.to(object, { time: 0, x: 100, y: 200, onStart: tester.expectCall('transition onStart') });
		setup.transitionEngine.update({ delta: 0 });
	});

	tester.test('cancel prevents transition onStart', (setup) => {
		let object = {};
		let transition = setup.transitionEngine.to(object, { time: 200, x: 100, y: 200, onStart: tester.expectCall('transition onStart', 0) });
		setup.transitionEngine.cancel(transition);
		setup.transitionEngine.update({ delta: 0 });
	});

	tester.test('transition to updates target values', (setup) => {
		let object = { x: 0, y: 0 };
		let transition = setup.transitionEngine.to(object, { time: 200, x: 100, y: 200 });
		tester.assertSame(0, object.x, 'object x should be 100');
		tester.assertSame(0, object.y, 'object y should be 200');

		setup.transitionEngine.update({ delta: 200 });
		tester.assertSame(100, object.x, 'object x should be 100');
		tester.assertSame(200, object.y, 'object y should be 200');
	});

	tester.test('transition from updates target values', (setup) => {
		let object = { x: 100, y: 200 };
		let transition = setup.transitionEngine.from(object, { time: 200, x: 0, y: 0 });
		tester.assertSame(0, object.x, 'object x should be 0');
		tester.assertSame(0, object.y, 'object y should be 0');

		setup.transitionEngine.update({ delta: 200 });
		tester.assertSame(100, object.x, 'object x should be 100');
		tester.assertSame(200, object.y, 'object y should be 200');
	});

	tester.test('transition to with delay updates target values', (setup) => {
		let object = { x: 0, y: 0 };
		let transition = setup.transitionEngine.to(object, { delay: 200, time: 200, x: 100, y: 200 });
		tester.assertSame(0, object.x, 'object x should be 0');
		tester.assertSame(0, object.y, 'object y should be 0');
		setup.transitionEngine.update({ delta: 200 });
		tester.assertSame(0, object.x, 'object x should be 0');
		tester.assertSame(0, object.y, 'object y should be 0');
		setup.transitionEngine.update({ delta: 200 });
		tester.assertSame(100, object.x, 'object x should be 100');
		tester.assertSame(200, object.y, 'object y should be 200');
	});

	tester.test('transition to with delay fires onStart and onComplete', (setup) => {
		let object = { x: 0, y: 0 };
		let transition = setup.transitionEngine.to(object, {
			delay: 200,
			time: 200,
			x: 100,
			y: 200,
			onStart: tester.expectCall('transition onStart'),
			onComplete: tester.expectCall('transition onComplete'),
		});
		setup.transitionEngine.update({ delta: 200 });
		setup.transitionEngine.update({ delta: 200 });
	});

	tester.test('transition cancel with delay fires onStart and interrupts onComplete', (setup) => {
		let object = { x: 0, y: 0 };
		let transition = setup.transitionEngine.to(object, {
			delay: 200,
			time: 200,
			x: 100,
			y: 200,
			onStart: tester.expectCall('transition onStart'),
			onComplete: tester.expectCall('transition onComplete', 0),
		});
		setup.transitionEngine.update({ delta: 200 });
		setup.transitionEngine.cancel(transition);
		setup.transitionEngine.update({ delta: 200 });
	});

	tester.test('transition follows other object when object is parameter', (setup) => {
		let object = { x: 0, y: 0 };
		let follow = { x: 100, y: 200 };
		let transition = setup.transitionEngine.to(object, { time: 200, x: follow, y: follow });
		setup.transitionEngine.update({ delta: 200 });
		tester.assertSame(100, object.x, 'object x should be 100');
		tester.assertSame(200, object.y, 'object y should be 200');
		tester.assertSame(follow.x, object.x, 'object x should be the same as follow x');
		tester.assertSame(follow.y, object.y, 'object y should be the same as follow y');
	});

	tester.test('transition follows other object when object is parameter and is changing', (setup) => {
		let object = { x: 0, y: 0 };
		let follow = { x: 100, y: 200 };
		let transition = setup.transitionEngine.to(object, { time: 200, x: follow, y: follow });
		let transitionFollow = setup.transitionEngine.to(follow, { time: 200, x: 200, y: 300 });
		setup.transitionEngine.update({ delta: 200 });

		tester.assertSame(follow.x, object.x, 'object x should be the same as follow x');
		tester.assertSame(follow.y, object.y, 'object y should be the same as follow y');

		tester.assertSame(200, follow.x, 'follow x should be 200');
		tester.assertSame(300, follow.y, 'follow y should be 300');
	});

	tester.test('transition works on integer text values', (setup) => {
		let object = { text: '0' };
		let transition = setup.transitionEngine.to(object, { time: 200, text: '25' });
		setup.transitionEngine.update({ delta: 200 });
		tester.assertSame('25', object.text, 'object text should be 25');
	});

	tester.test('transition cancel by tag', (setup) => {
		let tagObject = { x: 0, y: 0 };
		let tagTransition = setup.transitionEngine.to(tagObject, {
			tag: 'move',
			time: 200,
			x: 100,
			y: 200,
			onStart: tester.expectCall('transition onStart'),
			onComplete: tester.expectCall('transition onComplete', 0), // No calls to on Complete
		});

		let normalObject = { x: 0, y: 0 };
		let normalTransition = setup.transitionEngine.to(normalObject, {
			time: 200,
			x: 50,
			y: 100,
			onStart: tester.expectCall('normal transition onStart'),
			onComplete: tester.expectCall('normal transition onComplete'),
		});

		setup.transitionEngine.update({ delta: 100 });
		setup.transitionEngine.cancel('move');
		setup.transitionEngine.update({ delta: 200 });

		tester.assertTrue(tagObject.x > 0, 'object x should be greater than 0 after cancel');
		tester.assertTrue(tagObject.y > 0, 'object y should be greater than 0 after cancel');
		tester.assertTrue(tagObject.x < 100, 'object x should be less than 100 after cancel');
		tester.assertTrue(tagObject.y < 200, 'object y should be less than 200 after cancel');

		tester.assertSame(50, normalObject.x, 'normal object x should be 50 after cancel');
		tester.assertSame(100, normalObject.y, 'normal object y should be 100 after cancel');
	});
}
