import { ZetoTimerEngine } from '../src/ZetoTimerEngine.js';

export function test({ tester }) {
	tester.setup(() => {
		return {
			timerEngine: new ZetoTimerEngine(tester),
		};
	});

	tester.test('performWithDelay creates timer', (setup) => {
		let timer1 = setup.timerEngine.performWithDelay(0, () => {});
		tester.assertSame(setup.timerEngine.timers.length, 1, 'timers should have 1 item');

		let timer2 = setup.timerEngine.performWithDelay(0, () => {});
		tester.assertSame(setup.timerEngine.timers.length, 2, 'timers should have 2 items');
	});

	tester.test('performWithDelay with delay is executed after delta', (setup) => {
		let timer = setup.timerEngine.performWithDelay(1200, tester.expectCall('timer listener'));
		setup.timerEngine.update({ delta: 1200 });
	});

	tester.test('performWithDelay with no delay is executed on next frame', (setup) => {
		let timer = setup.timerEngine.performWithDelay(0, tester.expectCall('timer listener'));
		setup.timerEngine.update({ delta: 0 });
	});

	tester.test('performWithDelay listener is executed expected positive times', (setup) => {
		let timer = setup.timerEngine.performWithDelay(1200, tester.expectCall('timer listener', 3), 3);
		setup.timerEngine.update({ delta: 1200 });
		setup.timerEngine.update({ delta: 1200 });
		setup.timerEngine.update({ delta: 1200 });
		setup.timerEngine.update({ delta: 1200 });
	});

	tester.test('performWithDelay listener is executed expected infinite times', (setup) => {
		let infiniteTimes = 50;
		let timer = setup.timerEngine.performWithDelay(1200, tester.expectCall('timer listener', infiniteTimes), -1);
		for (let index = 0; index < infiniteTimes; index++) {
			setup.timerEngine.update({ delta: 1200 });
		}
	});

	tester.test('cancel removes timer', (setup) => {
		let timer = setup.timerEngine.performWithDelay(1200, () => {});
		tester.assertSame(setup.timerEngine.timers.length, 1, 'timers should have 1 items');
		setup.timerEngine.cancel(timer);
		setup.timerEngine.update({ delta: 0 });
		tester.assertSame(setup.timerEngine.timers.length, 0, 'timers should have 0 items');
	});

	tester.test('cancel prevents timer listener execution', (setup) => {
		let timer = setup.timerEngine.performWithDelay(1200, tester.expectCall('timer listener', 0));
		setup.timerEngine.cancel(timer);
		setup.timerEngine.update({ delta: 1200 });
		setup.timerEngine.update({ delta: 1200 });
	});
}
