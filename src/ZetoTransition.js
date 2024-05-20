import { ZetoEasing as Easing } from './ZetoEasing.js';
import { isObject, isString, isNumber } from './constants.js';

class ZetoTransition {
	id;
	target;
	easing;

	targetValues = {};
	targetObjects = {};
	startValues = {};
	deltaValues = {};
	stringFlags = {};

	onComplete;
	onStart;

	delay;
	time;

	currentDelay = 0;
	currentTime = 0;

	remove = false;

	constructor(target, delay = 0, time = 300, easing = null, onStart = null, onComplete = null, targetValues = null, fromValues = null) {
		this.target = target;
		this.easing = easing;
		this.onComplete = onComplete;
		this.onStart = onStart;
		this.delay = delay;
		this.time = time;

		if (!this.easing) {
			this.easing = Easing.linear;
		}

		for (var key in targetValues) {
			var value = targetValues[key];

			if (isObject(value)) {
				this.startValues[key] = fromValues ? fromValues[key] : target[key];
				this.targetObjects[key] = value;
				this.targetValues[key] = value[key];
			} else if (isString(value)) {
				this.stringFlags[key] = true;
				this.startValues[key] = fromValues ? parseInt(fromValues[key]) : parseInt(target[key]);
				this.targetValues[key] = parseInt(value);
			} else if (isNumber(value)) {
				this.startValues[key] = fromValues ? fromValues[key] : target[key];
				this.targetValues[key] = value;
			}
			this.deltaValues[key] = this.targetValues[key] - this.startValues[key];

			if (fromValues && fromValues[key] != null) {
				target[key] = fromValues[key];
			}
		}
	}
}

export { ZetoTransition };