import { ZetoTestingEngine } from './ZetoTestingEngine.js';

const args = process.argv.slice(2);
const options = {};

args.forEach((arg) => {
	const [key, value] = arg.split('=');
	options[key] = value;
});

let mockContext = {};
let mockCanvas = {
	style: {},
	getContext: () => {
		return mockContext;
	},
};
globalThis.window = {
	innerWidth: 1024,
	innerHeight: 768,
	addEventListener: () => {},
	requestAnimationFrame: () => {},
};
globalThis.navigator = {
	maxTouchPoints: 1,
};
globalThis.document = {
	addEventListener: () => {},
	getElementById: (id) => {
		if (id === 'canvas') {
			return mockCanvas;
		}
		return { style: {} };
	},
	hidden: false,
	documentElement: {
		style: {},
	},
	body: {
		style: {},
	},
};
globalThis.DOMMatrix = class DOMMatrix {
	constructor() {
		this.a = 1;
		this.b = 0;
		this.c = 0;
		this.d = 1;
		this.e = 0;
		this.f = 0;
		this.translateSelf = () => {};
		this.preMultiplySelf = () => {};
	}
};
globalThis.Path2D = class Path2D {
	constructor() {
		this.addPath = () => {};
	}
};

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
