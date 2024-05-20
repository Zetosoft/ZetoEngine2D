import { ZetoEngine } from './ZetoEngine.js';

class ZetoTestingEngine {
	engine;
	physics;

	assertCount;
	disabled = false;
	filter = false;

	constructor(options = {}) {
		if (options.disabled) {
			this.disabled = true;
			return;
		}
		this.filter = options.filter ?? false;
		this.engine = new ZetoEngine();
		this.physics = this.engine.physics;

		this.engine.paused = true;
	}

	test(name, testCase) {
		if (this.disabled) {
			return;
		}

		if (this.filter && name.indexOf(this.filter) == -1) {
			return;
		}

		this.assertCount = 0;
		try {
			testCase();
			console.log('Test passed: ' + name + ' (' + this.assertCount + ' assertions)');
		} catch (error) {
			console.error('Test failed: ' + name, error);
		}
	}

	assert(what, value, message) {
		this.assertCount++;
		if (what != value) {
			throw new Error('Error asserting that ' + what + ' equals ' + value + ', checking ' + message);
		}
	}
}

export { ZetoTestingEngine };