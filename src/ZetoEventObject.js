import { ended, hover } from './constants.js';

class ZetoEventObject {
	listeners = {
		finalize: [],
	};

	dispatchEvent(eventName, event) {
		if (this.listeners[eventName]) {
			var index = this.listeners[eventName].length;
			while (index--) {
				if (this.listeners[eventName][index](event)) {
					return true;
				}
			}
		}
	}

	addEventListener(eventName, listener) {
		if (this.listeners[eventName] && listener && 'function' == typeof listener) {
			this.listeners[eventName].push(listener);
		}
	}

	removeEventListener(eventName, listener) {
		if (this.listeners[eventName]) {
			var index = this.listeners[eventName].indexOf(listener);
			if (index > -1) {
				this.listeners[eventName].splice(index, 1);
			}
		}
	}

	hasEventListener(eventName, listener) {
		var hasListeners = this.listeners[eventName] && this.listeners[eventName].length > 0;
		if (!listener) {
			return hasListeners ? this : false;
		} else {
			return hasListeners && this.listeners[eventName].indexOf(listener) > -1 ? this : false;
		}
	}

	destroy() {
		this.dispatchEvent('finalize', { target: this });

		for (var key in this.listeners) {
			if (key == hover) {
				if (this.hover == this.engine.frameEvent.frame) {
					this.hover = false;
					var hoverEvent = { x: this.mouseX, y: this.mouseY, phase: ended };
					this.engine.dispatchObjectEvent(this, hover, hoverEvent);
				}
			}
			delete this.listeners[key];
		}
	}
}

export { ZetoEventObject };