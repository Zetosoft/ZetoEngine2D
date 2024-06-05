const colors = {
	reset: '\x1b[0m',
	fgRed: '\x1b[31m',
	fgGreen: '\x1b[32m',
	fgOrange: '\x1b[38;5;208m'
};

class ZetoTestingEngine {
	expectedAsserts;
	assertCount;
	errors;
	callErrors;
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
		this.callErrors = [];
		this.callIndex = 0;
		this.expectedAsserts = 0;
		this.assertCount = 0;

		try {
			testCase(this.testSetup?.() ?? {});
		} catch (error) {
			this.errors.push('Exception on test: ' + name + ' - ' + error);
		}

		for (let index = 0; index < this.callErrors.length; index++) {
			if (this.callErrors[index]) {
				this.errors.push('Expected function to be called: ' + this.callErrors[index][1]);
			}
		}

		if (this.expectedAsserts != this.assertCount || this.errors.length > 0) {
			console.error(colors.fgRed + 'Test failed: ' + colors.reset + name + ' (' + this.assertCount + '/' + this.expectedAsserts + ' assertions)');
			if (this.errors.length > 0) {
				for (let index = 0; index < this.errors.length; index++) {
					console.error(colors.fgOrange + this.errors[index]);
				}
			}
		} else {
			console.log(colors.fgGreen + 'Test passed: ' + colors.reset + name + ' (' + this.assertCount + '/' + this.expectedAsserts + ' assertions)');
		}
	}

	assert(what, value, message) {
		this.expectedAsserts++;
		if (what != value) {
			errors.push('Error asserting that ' + what + ' equals ' + value + ', checking ' + message);
		} else {
			this.assertCount++;
		}
	}

	expectCall(message, expectedArgs) {
		this.expectedAsserts++;

		let callIndex = this.callIndex;
		this.callErrors[callIndex] = [expectedArgs, message];
		this.callIndex++;

		return (...args) => {
			if (expectedArgs) {
				for (let index = 0; index < expectedArgs.length; index++) {
					if (args[index] != expectedArgs[index]) {
						this.callErrors[callIndex] = null;
						this.errors.push('Error asserting that ' + args[index] + ' equals ' + expectedArgs[index] + ', checking ' + message);
						return;
					}
				}
			}

			this.callErrors[callIndex] = null;
			this.assertCount++;
		};
	}
}

export { ZetoTestingEngine };
