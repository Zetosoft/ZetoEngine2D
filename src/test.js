import { readdirSync } from 'fs';
import { ZetoTestingEngine } from './ZetoTestingEngine.js';

async function runTests() {
	const testFiles = readdirSync('./tests').filter((file) => file.endsWith('.js'));

	for (const file of testFiles) {
		const testingEngine = new ZetoTestingEngine();
		const testModule = await import(`../tests/${file}`);
		if (typeof testModule.test === 'function') {
			console.log(`Running tests from ${file}`);
			testModule.test({ tester: testingEngine });
		} else {
			console.warn(`No test function exported from ${file}`);
		}
	}
}

runTests().catch((error) => {
	console.error('Error running tests:', error);
	process.exit(1);
});
