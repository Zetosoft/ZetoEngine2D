import { ZetoEngine } from '../src/ZetoEngine.js';
import { isGroup, isTransition, isFunction, isArray, isString, isObject, randomSideFloat } from '../src/constants.js';

export function test({ tester }) {
	tester.setup(() => {
		return {
			engine: new ZetoEngine({ warn: false }),
		};
	});

	tester.test('test isGroup(o) checks if object is group', (setup) => {
		let group = setup.engine.newGroup();
		tester.assertTrue(isGroup(group), 'group is group');
		let object = {};
		tester.assertFalse(isGroup(object), 'object is not group');
	});

	tester.test('test isTransition(o) checks if object is transition', (setup) => {
		let trasitionObject = setup.engine.newGroup();
		let transition = setup.engine.transition.to(trasitionObject, {});
		tester.assertTrue(isTransition(transition), 'transition is transition');
		let object = {};
		tester.assertFalse(isTransition(object), 'object is not transition');
		tester.assertFalse(isTransition(trasitionObject), 'group is not transition');
	});

	tester.test('test isFunction', (setup) => {
		let func = () => {};
		tester.assertTrue(isFunction(func), 'function is function');
		let object = {};
		tester.assertFalse(isFunction(object), 'object is not function');
	});

	tester.test('test isArray', (setup) => {
		let array = [];
		tester.assertTrue(isArray(array), 'array is array');
		let object = {};
		tester.assertFalse(isArray(object), 'object is not array');
	});

	tester.test('test isString', (setup) => {
		let string = '';
		tester.assertTrue(isString(string), 'string is string');
		let object = {};
		tester.assertFalse(isString(object), 'object is not string');
	});

	tester.test('test isObject', (setup) => {
		let object = {};
		tester.assertTrue(isObject(object), 'object is object');
		let string = '';
		tester.assertFalse(isObject(string), 'string is not object');
	});

	tester.test('test randomSideFloat', (setup) => {
		for (let i = 0; i < 100; i++) {
			let value = randomSideFloat();
			tester.assertTrue(value >= -1 && value <= 1, 'value is between -1 and 1');
		}
	});
}
