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
		tester.assertSame(true, setup.true, 'true should be true');
		tester.assertSame(false, setup.false, 'false should be false');
		tester.assertSame(null, setup.null, 'null should be null');
		tester.assertSame(undefined, setup.undefined, 'undefined should be undefined');
		tester.assertSame(setup.undefined, setup.null, 'null and undefined are both nothing');
		tester.assertSame(0, setup.zero, 'zero should be 0');
		tester.assertSame(1, setup.truthy, 'truthy and one are both truthy');
		tester.assertSame(0, setup.falsy, 'falsy and zero are both falsy');
	});

	tester.test('test setup & assertNotSame', (setup) => {
		tester.assertNotSame(false, setup.true, 'true should not be false');
		tester.assertNotSame(true, setup.false, 'false should not be true');
		tester.assertNotSame(1, setup.zero, 'zero should not be 1');
		tester.assertNotSame(0, setup.truthy, 'truthy should not be 0');
		tester.assertNotSame(1, setup.falsy, 'falsy should not be 1');
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
