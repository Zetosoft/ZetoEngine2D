import { ZetoTestingEngine } from './ZetoTestingEngine.js';

const args = process.argv.slice(2);
const options = {};

args.forEach((arg) => {
	const [key, value] = arg.split('=');
	options[key] = value;
});

globalThis.window = {};

async function runTests() {
	const testingEngine = new ZetoTestingEngine(options);
	await testingEngine.load();
	const allTestsPassed = await testingEngine.run();

	if (!allTestsPassed) {
		process.exit(1);
	}
}

runTests().catch((error) => {
	console.error('Error running tests:', error);
	process.exit(1);
});
