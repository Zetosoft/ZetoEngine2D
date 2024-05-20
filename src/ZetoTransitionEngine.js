import { ZetoEventObject } from './ZetoEventObject.js';
import { isFunction, isArray, isTransition } from './constants.js';

class ZetoTransitionEngine extends ZetoEventObject {
	engine;
	transitions = [];

	constructor(engine) {
		super();

		this.engine = engine;
	}

	#callListener(listener, target) {
		if (listener != null) {
			if (isFunction(listener)) {
				listener(target);
			} else if (isArray(listener)) {
				for (var listenerIndex = 0; listenerIndex < listener.length; listenerIndex++) {
					if (isFunction(listener[listenerIndex])) {
						listener[listenerIndex](target);
					}
				}
			}
		}
	}

	update(event) {
		for (var transitionIndex = this.transitions.length - 1; transitionIndex >= 0; transitionIndex--) {
			var transition = this.transitions[transitionIndex];

			if (transition.remove) {
				this.transitions.splice(transitionIndex, 1);
				transition.target.transitions.splice(transition.target.transitions.indexOf(transition), 1);

				continue;
			}

			if (transition.delay > 0 && transition.currentDelay < transition.delay) {
				transition.currentDelay += event.delta;
				if (transition.currentDelay >= transition.delay) {
					transition.currentDelay = transition.delay;
				}
			} else if (transition.time > 0 && transition.currentTime < transition.time) {
				if (transition.currentTime <= 0) {
					this.#callListener(transition.onStart, transition.target);
				}

				transition.currentTime += event.delta;
				if (transition.currentTime >= transition.time) {
					transition.currentTime = transition.time;
				}

				for (var key in transition.targetValues) {
					if (transition.targetObjects[key] != null) {
						transition.targetValues[key] = transition.targetObjects[key][key];
						transition.deltaValues[key] = transition.targetValues[key] - transition.startValues[key];
					}
					var value = transition.easing(transition.currentTime, transition.time, transition.startValues[key], transition.deltaValues[key]);
					transition.target[key] = transition.stringFlags[key] ? parseInt(value) : value;
				}
			} else {
				// Transition complete
				for (var key in transition.targetValues) {
					transition.target[key] = transition.targetValues[key];
				}
				this.#callListener(transition.onComplete, transition.target);
				transition.remove = true;
			}
		}
	}

	to(object, params = {}) {
		var targetValues = {};
		for (var key in params) {
			if (key != 'delay' && key != 'time' && key != 'easing' && key != 'onStart' && key != 'onComplete') {
				targetValues[key] = params[key];
			}
		}

		var transition = new ZetoTransition(object, params.delay, params.time, params.easing, params.onStart, params.onComplete, targetValues);
		this.transitions.push(transition);
		if (!object.transitions) {
			object.transitions = [];
		}
		object.transitions.push(transition);
		return transition;
	}

	from(object, params = {}) {
		var fromValues = {};
		var targetValues = {};
		for (var key in params) {
			if (key != 'delay' && key != 'time' && key != 'easing' && key != 'onStart' && key != 'onComplete') {
				fromValues[key] = params[key];
				targetValues[key] = object[key];
			}
		}

		var transition = new ZetoTransition(object, params.delay, params.time, params.easing, params.onStart, params.onComplete, targetValues, fromValues);
		this.transitions.push(transition);
		if (!object.transitions) {
			object.transitions = [];
		}
		object.transitions.push(transition);
		return transition;
	}

	cancel(object) {
		if (isTransition(object)) {
			object.remove = true;
		} else if (object.transitions) {
			for (var transitionIndex = object.transitions.length - 1; transitionIndex >= 0; transitionIndex--) {
				var transition = object.transitions[transitionIndex];
				transition.remove = true;
			}
		}
	}
}

export { ZetoTransitionEngine };