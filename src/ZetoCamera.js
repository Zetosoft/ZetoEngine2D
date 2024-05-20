import { ZetoGroup } from './ZetoGroup.js';
import { mathCos, mathSin, radianMultiplier } from './constants.js';

class ZetoCamera extends ZetoGroup {
	targetRotation = 0;
	focusAngle = 0;
	rotationX = 0;
	rotationY = 0;
	otherRotationX = 0;
	otherRotationY = 0;
	finalX = 0;
	finalY = 0;

	values = {
		x1: -Number.MAX_VALUE,
		x2: Number.MAX_VALUE,
		y1: -Number.MAX_VALUE,
		y2: Number.MAX_VALUE,

		damping: 0,
		dampingMultiplier: 1,

		defaultRotation: 0,
		x: 0,
		y: 0,

		zoom: 1,

		rotationOffset: 0,
		trackRotation: false,
		isTracking: false,
	};

	view;

	constructor(engine, x, y) {
		super(engine, x, y);

		this.view = engine.newGroup();
		this.insert(this.view);
	}

	add(object, isFocus) {
		if (isFocus) {
			this.values.focus = object;
		}

		this.view.insert(object);
	}

	set zoom(zoom) {
		this.values.zoom = zoom;
		this.view.xScale = zoom;
		this.view.yScale = zoom;
	}

	get zoom() {
		return this.values.zoom;
	}

	set damping(damping) {
		// 0 means no damping (Instant tracking), 1 means no movement
		damping = damping > 1 ? 1 : damping < 0 ? 0 : damping;
		this.values.damping = damping;
		this.values.dampingMultiplier = 1 - damping;
	}

	get damping() {
		return this.values.damping;
	}

	update(event) {
		super.update(event);

		if (this.values.focus) {
			this.targetRotation = this.values.trackRotation ? -(this.values.focus.rotation + this.values.rotationOffset) : this.values.defaultRotation;

			this.view.rotation = this.view.rotation - (this.view.rotation - this.targetRotation) * this.values.dampingMultiplier;

			this.focusAngle = this.view.rotation * radianMultiplier;

			this.values.targetX = this.values.targetX - (this.values.targetX - this.values.focus.x) * this.values.dampingMultiplier;
			this.values.targetY = this.values.targetY - (this.values.targetY - this.values.focus.y) * this.values.dampingMultiplier;

			this.values.targetX = this.values.x1 < this.values.targetX ? this.values.targetX : this.values.x1;
			this.values.targetX = this.values.x2 > this.values.targetX ? this.values.targetX : this.values.x2;

			this.values.targetY = this.values.y1 < this.values.targetY ? this.values.targetY : this.values.y1;
			this.values.targetY = this.values.y2 > this.values.targetY ? this.values.targetY : this.values.y2;

			this.otherRotationX = mathSin(this.focusAngle) * this.values.targetY;
			this.rotationX = mathCos(this.focusAngle) * this.values.targetX;
			this.finalX = (-this.rotationX + this.otherRotationX) * this.values.zoom;

			this.otherRotationY = mathCos(this.focusAngle) * this.values.targetY;
			this.rotationY = mathSin(this.focusAngle) * this.values.targetX;
			this.finalY = (-this.rotationY - this.otherRotationY) * this.values.zoom;

			this.view.x = this.finalX;
			this.view.y = this.finalY;
		}
	}

	removeFocus() {
		this.values.focus = null;
	}

	setFocus(object, options = {}) {
		var trackRotation = options.trackRotation;
		var soft = options.soft;

		if (object && !isNaN(object.x) && !isNaN(object.y) && this.values.focus != object) {
			this.values.focus = object;

			if (!soft) {
				this.values.targetX = object.x;
				this.values.targetY = object.y;
			}
		} else {
			this.values.focus = null;
		}

		this.values.defaultRotation = 0; //Reset rotation
		if (!soft) {
			this.view.rotation = 0;
		}
		this.values.trackRotation = trackRotation;
	}
}

export { ZetoCamera };
