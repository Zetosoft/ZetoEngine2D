import { readdirSync } from 'fs';
import { ZetoTestingEngine } from './ZetoTestingEngine.js';

async function runTests() {
	const testFiles = readdirSync('./tests').filter((file) => file.endsWith('.js'));
	let allTestsPassed = true;

	for (const file of testFiles) {
		const testingEngine = new ZetoTestingEngine();
		const testModule = await import(`../tests/${file}`);
		if (typeof testModule.test === 'function') {
			console.log(`Running tests from ${file}`);
			try {
				if (!testModule.test({ tester: testingEngine })) {
					allTestsPassed = false;
				}
			} catch (error) {
				console.error(`Test failed: ${file}`, error);
				allTestsPassed = false;
			}
		} else {
			console.warn(`No test function exported from ${file}`);
		}
	}

	if (!allTestsPassed) {
		process.exit(1); // Exit with an error code if any tests failed
	}
}

runTests().catch((error) => {
	console.error('Error running tests:', error);
	process.exit(1);
});
