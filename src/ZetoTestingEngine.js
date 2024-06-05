const colors = {
	reset: '\x1b[0m',
	fgRed: '\x1b[31m',
	fgGreen: '\x1b[32m',
	fgOrange: '\x1b[38;5;208m',
};

class ZetoTestingEngine {
	expectedAsserts;
	assertCount;
	errors;
	expectedCalls;
	callIndex;

	disabled = false;
	filter = false;
	testSetup = false;

	constructor(options = {}) {
		if (options.disabled) {
			this.disabled = true;
			return;
		}
		this.filter = options.filter ?? false;
	}

	setup(setup) {
		this.testSetup = setup;
	}

	test(name, testCase) {
		if (this.disabled) {
			return;
		}

		if (this.filter && name.indexOf(this.filter) == -1) {
			return;
		}

		this.errors = [];
		this.expectedCalls = [];
		this.callIndex = 0;
		this.expectedAsserts = 0;
		this.assertCount = 0;

		try {
			testCase(this.testSetup?.() ?? {});
		} catch (error) {
			this.errors.push('Exception on test: ' + name + ' - ' + error);
		}

		for (let index = 0; index < this.expectedCalls.length; index++) {
			let expectedCall = this.expectedCalls[index];
			if (expectedCall.numCalls != expectedCall.times) {
				this.errors.push('Call error: ' + expectedCall.message + ' was called ' + expectedCall.numCalls + '/' + expectedCall.times + ' times');
			} else if (expectedCall.times == 0) {
				this.expectedAsserts++;
				this.assertCount++;
			}

			if (expectedCall.errors.length > 0) {
				for (let errorIndex = 0; errorIndex < expectedCall.errors.length; errorIndex++) {
					this.errors.push(expectedCall.errors[errorIndex]);
				}
			}
		}

		if (this.expectedAsserts != this.assertCount || this.errors.length > 0) {
			console.error(colors.fgRed + 'Test failed: ' + colors.reset + name + ' (' + this.assertCount + '/' + this.expectedAsserts + ' assertions)');
			if (this.errors.length > 0) {
				for (let index = 0; index < this.errors.length; index++) {
					console.error(colors.fgOrange + this.errors[index]);
				}
			}

			return false;
		}

		console.log(colors.fgGreen + 'Test passed: ' + colors.reset + name + ' (' + this.assertCount + '/' + this.expectedAsserts + ' assertions)');

		return true;
	}

	assert(what, value, message) {
		this.expectedAsserts++;
		if (what != value) {
			this.errors.push('Error asserting that ' + what + ' equals ' + value + ', checking ' + message);
		} else {
			this.assertCount++;
		}
	}

	expectCall(message, times = 1, args) {
		this.expectedAsserts += times;

		let callIndex = this.callIndex;
		this.expectedCalls[callIndex] = { times: times, message: message, args: args, numCalls: 0, errors: [] };
		this.callIndex++;

		return (...args) => {
			let expectedCall = this.expectedCalls[callIndex];
			let numCall = expectedCall.numCalls;
			let expectedArgs = expectedCall.times > 1 ? (expectedCall.args ? expectedCall.args[numCall] ?? expectedCall.args : null) : expectedCall.args;

			if (expectedArgs) {
				for (let index = 0; index < expectedArgs.length; index++) {
					if (args[index] != expectedArgs[index]) {
						expectedCall.errors.push('Call error: ' + message + ' argument ' + index + ' expected ' + expectedArgs[index] + ' but got ' + args[index]);
					}
				}
			}

			expectedCall.numCalls++;
			this.assertCount++;
		};
	}
}

export { ZetoTestingEngine };
