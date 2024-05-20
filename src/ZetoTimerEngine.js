class ZetoTimerEngine {
	engine;
	timers = [];

	constructor(engine) {
		this.engine = engine;
	}

	update(event) {
		for (var timerIndex = this.timers.length - 1; timerIndex >= 0; timerIndex--) {
			var timer = this.timers[timerIndex];
			if (timer.remove) {
				this.timers.splice(timerIndex, 1);
				continue;
			} else if (timer.currentDelay > 0) {
				if (timer.iterations != 0) {
					timer.currentDelay -= event.delta;
					if (timer.currentDelay <= 0) {
						timer.listener({ target: timer });
						timer.iterations--;
						timer.currentDelay += timer.delay; // Reset delay plus any overflow
					}
				} else if (timer.iterations == 0) {
					this.timers.splice(timerIndex, 1);
				}
			}
		}
	}

	performWithDelay(delay, listener, iterations = 1) {
		if (!listener || typeof listener != 'function') {
			throw new Error('Invalid listener');
		}

		var timer = {
			delay: delay,
			listener: listener,
			iterations: iterations,
			currentDelay: delay,
			delay: delay,
			remove: false,
		};
		this.timers.push(timer);
		return timer;
	}

	cancel(timer) {
		// TODO: check if is timer?
		if (timer) {
			timer.remove = true;
		}
	}
}

export { ZetoTimerEngine };