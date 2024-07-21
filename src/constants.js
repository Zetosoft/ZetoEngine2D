export const lockCanvasEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];
export const radianMultiplier = Math.PI / 180;
export const degreeMultiplier = 180 / Math.PI;
export const disableTests = true;
export const began = 'began';
export const hold = 'hold';
export const moved = 'moved';
export const ended = 'ended';
export const start = 'start';
export const hover = 'hover';

///////////////////////////////////////////// Helpers
export const isGroup = (o) => {
	return o?.children instanceof Array;
};
export const isTransition = (o) => {
	return o?.target && o?.easing;
};
export const isFunction = (f) => {
	return typeof f == 'function';
};
export const isArray = (o) => {
	return o instanceof Array;
};
export const isNumber = (value) => {
	return typeof value === 'number';
};
export const isString = (value) => {
	return typeof value === 'string';
};
export const isObject = (value) => {
	return typeof value === 'object';
};
export const randomSideFloat = () => {
	return mathRandom() * 2 - 1;
};

///////////////////////////////////////////// Math functions
export const mathCos = Math.cos;
export const mathSin = Math.sin;
export const pi = Math.PI;
export const hPi = pi * 0.5;
export const mathRound = Math.round;
export const mathFloor = Math.floor;
export const mathRandom = Math.random;
export const mathMax = Math.max;
export const mathMin = Math.min;
export const mathSqrt = Math.sqrt;
export const mathAbs = Math.abs;

export const TOUCH_BEGAN = 1;
export const TOUCH_HOLD = 2;

///////////////////////////////////////////// Matter.js
export const Matter = window.Matter;
export const mBody = Matter?.Body ?? undefined;
export const mBodies = Matter?.Bodies ?? undefined;
export const mEngine = Matter?.Engine ?? undefined;
export const mComposite = Matter?.Composite ?? undefined;
export const mVertices = Matter?.Vertices ?? undefined;
export const mEvents = Matter?.Events ?? undefined;
