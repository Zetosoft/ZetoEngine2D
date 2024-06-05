import { readdirSync } from 'fs';

const colors = {
	reset: '\x1b[0m',
	fgRed: '\x1b[31m',
	fgGreen: '\x1b[32m',
	fgOrange: '\x1b[38;5;208m',
};

class ZetoTestingEngine {
	filter;
	testFiles;

	constructor(options = {}) {
		this.filter = options.filter ?? false;
	}

	async load(testDir = './tests') {
		this.testFiles = readdirSync(testDir).filter((file) => file.endsWith('.js'));
		if (this.filter) {
			this.testFiles = this.testFiles.filter((file) => file.includes(this.filter));
		}
	}

	async run() {
		let allTestsPassed = true;
		for (const file of this.testFiles) {
			const tester = new ZetoTester();
			const testModule = await import(`../tests/${file}`);
			console.log(`Running tests from ${file}`);
			try {
				testModule.test({ tester: tester });
				if (tester.failed) {
					allTestsPassed = false;
				}
			} catch (error) {
				console.error(`Test failed: ${file}`, error);
				allTestsPassed = false;
			}
		}
		return allTestsPassed;
	}
}

class ZetoTester {
	expectedAsserts;
	assertCount;
	errors;
	expectedCalls;
	callIndex;

	testSetup = false;
	failed = false;

	setup(setup) {
		this.testSetup = setup;
	}

	test(name, testCase) {
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
			this.failed = true;
		}

		console.log(colors.fgGreen + 'Test passed: ' + colors.reset + name + ' (' + this.assertCount + '/' + this.expectedAsserts + ' assertions)');
	}

	assertTrue(condition, message) {
		this.expectedAsserts++;
		if (condition) {
			this.assertCount++;
		} else {
			this.errors.push('Error asserting that ' + condition + ' is true, checking ' + message);
		}
	}

	assertFalse(condition, message) {
		this.expectedAsserts++;
		if (!condition) {
			this.assertCount++;
		} else {
			this.errors.push('Error asserting that ' + condition + ' is false, checking ' + message);
		}
	}

	assertSame(expected, actual, message) {
		this.expectedAsserts++;
		if (expected == actual) {
			this.assertCount++;
		} else {
			this.errors.push('Error asserting that ' + expected + ' is the same as ' + actual + ', checking ' + message);
		}
	}

	assertNotSame(unexpected, actual, message) {
		this.expectedAsserts++;
		if (unexpected != actual) {
			this.assertCount++;
		} else {
			this.errors.push('Error asserting that ' + unexpected + ' is not the same as ' + actual + ', checking ' + message);
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

export { ZetoTestingEngine, ZetoTester };
