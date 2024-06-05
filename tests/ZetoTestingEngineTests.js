import { ZetoTimerEngine } from '../src/ZetoTimerEngine.js';

export function test({ tester }) {
	tester.setup(() => {
		return {
			true: true,
			false: false,
			null: null,
			undefined: undefined,
			zero: 0,
			truthy: 1,
			falsy: 0,
		};
	});

	tester.test('test setup & assertSame', (setup) => {
		tester.assertSame(setup.true, true, 'true should be true');
		tester.assertSame(setup.false, false, 'false should be false');
		tester.assertSame(setup.null, null, 'null should be null');
		tester.assertSame(setup.undefined, undefined, 'undefined should be undefined');
        tester.assertSame(setup.null, setup.undefined, 'null and undefined are both nothing');
		tester.assertSame(setup.zero, 0, 'zero should be 0');
		tester.assertSame(setup.truthy, 1, 'truthy and one are both truthy');
		tester.assertSame(setup.falsy, 0, 'falsy and zero are both falsy');
	});

    tester.test('test setup & assertNotSame', (setup) => {
        tester.assertNotSame(setup.true, false, 'true should not be false');
        tester.assertNotSame(setup.false, true, 'false should not be true');
        tester.assertNotSame(setup.zero, 1, 'zero should not be 1');
        tester.assertNotSame(setup.truthy, 0, 'truthy should not be 0');
        tester.assertNotSame(setup.falsy, 1, 'falsy should not be 1');
    });

    tester.test('test assert is true', (setup) => {
        tester.assertTrue(true, 'true should be true');
    });

    tester.test('test assert is false', (setup) => {
        tester.assertFalse(false, 'false should be false');
    });

	tester.test('test expectCall is called', (setup) => {
		let listener1 = tester.expectCall('listener', 1);
		listener1();

		let listener2 = tester.expectCall('listener', 2);
		listener2();
		listener2();
	});

	tester.test('test expectCall is not called', (setup) => {
		let listener1 = tester.expectCall('listener', 0);
	});
}
