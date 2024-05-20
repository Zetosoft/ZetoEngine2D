import { degreeMultiplier } from './constants.js';

class ZetoFill {
	pattern;
	matrix;

	internal = {
		x: 0,
		y: 0,
		xScale: 1,
		yScale: 1,
		rotation: 0,
		width: 0,
		height: 0,
	};

	constructor(pattern, width, height) {
		this.pattern = pattern;
		this.matrix = new DOMMatrix();
		this.pattern.setTransform(this.matrix);

		this.internal.width = width;
		this.internal.height = height;
		this.x = width * 0.5;
		this.y = height * 0.5;
	}

	set width(value) {
		this.x = value * 0.5;
		this.xScale = value / this.internal.width;
	}

	set height(value) {
		this.y = value * 0.5;
		this.yScale = value / this.internal.height;
	}

	get width() {
		return this.internal.width * this.internal.xScale;
	}

	get height() {
		return this.internal.height * this.internal.yScale;
	}

	set x(value) {
		var xDiff = value - this.internal.x;
		this.matrix.translateSelf(xDiff, 0);
		this.pattern.setTransform(this.matrix);
		this.internal.x = value;
	}

	set y(value) {
		var yDiff = value - this.internal.y;
		this.matrix.translateSelf(0, yDiff);
		this.pattern.setTransform(this.matrix);
		this.internal.y = value;
	}

	set xScale(value) {
		var xDiff = value / this.internal.xScale;
		this.matrix.scaleSelf(xDiff, 1);
		this.pattern.setTransform(this.matrix);
		this.internal.xScale = value;
	}

	set yScale(value) {
		var yDiff = value / this.internal.yScale;
		this.matrix.scaleSelf(1, yDiff);
		this.pattern.setTransform(this.matrix);
		this.internal.yScale = value;
	}

	set rotation(value) {
		var rotationDiff = value - this.internal.rotation;
		this.matrix.rotateSelf(rotationDiff * degreeMultiplier);
		this.pattern.setTransform(this.matrix);
		this.internal.rotation = value;
	}

	get x() {
		return this.internal.x;
	}

	get y() {
		return this.internal.y;
	}

	get xScale() {
		return this.internal.xScale;
	}

	get yScale() {
		return this.internal.yScale;
	}

	get rotation() {
		return this.internal.rotation;
	}
}

export { ZetoFill };