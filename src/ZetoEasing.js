import { mathCos, mathSin, pi, hPi } from './constants.js';

class ZetoEasing {
	static linear(t, tMax, start, delta) {
		return (delta * t) / tMax + start;
	}

	static inQuad(t, tMax, start, delta) {
		t = t / tMax;
		return delta * (t * t) + start;
	}

	static outQuad(t, tMax, start, delta) {
		t = t / tMax;
		return -delta * t * (t - 2) + start;
	}

	static inOutQuad(t, tMax, start, delta) {
		t = (t / tMax) * 2;
		if (t < 1) {
			return (delta / 2) * (t * t) + start;
		} else {
			return (-delta / 2) * ((t - 1) * (t - 3) - 1) + start;
		}
	}

	static outBack(t, tMax, start, delta) {
		var s = 1.7;
		t = t / tMax - 1;
		return delta * (t * t * ((s + 1) * t + s) + 1) + start;
	}

	static inBack(t, tMax, start, delta) {
		var s = 1.7;
		t = t / tMax;
		return delta * t * t * ((s + 1) * t - s) + start;
	}

	static inOutBack(t, tMax, start, delta) {
		var s = 1.7 * 1.525;
		t = (t / tMax) * 2;
		if (t < 1) {
			return (delta / 2) * (t * t * ((s + 1) * t - s)) + start;
		} else {
			t = t - 2;
			return (delta / 2) * (t * t * ((s + 1) * t + s) + 2) + start;
		}
	}

	static inSine(t, tMax, start, delta) {
		return -delta * mathCos((t / tMax) * hPi) + delta + start;
	}

	static outSine(t, tMax, start, delta) {
		return delta * mathSin((t / tMax) * hPi) + start;
	}

	static inOutSine(t, tMax, start, delta) {
		return (-delta / 2) * (mathCos((pi * t) / tMax) - 1) + start;
	}
}

export { ZetoEasing };