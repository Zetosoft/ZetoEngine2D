import { ZetoWidget } from './ZetoWidget.js';
import { ZetoTextObject } from './ZetoTextObject.js';
import { mathMax, mathFloor, began, hold, ended } from './constants.js';

class ZetoButton extends ZetoWidget {
	defaultGroup;
	pressedGroup;
	disabledGroup;

	onTapListener;
	onPressListener;
	onReleaseListener;

	label;
	tapTimestamp = -300;

	holding = false;

	constructor(engine, options = {}) {
		super(engine, options.x, options.y, options.tag);

		this.anchorChildren = true;

		this.defaultGroup = engine.newGroup();
		this.defaultGroup.anchorChildren = true;
		this.insert(this.defaultGroup);

		this.pressedGroup = engine.newGroup();
		this.pressedGroup.anchorChildren = true;
		this.pressedGroup.isVisible = false;
		this.insert(this.pressedGroup);

		this.disabledGroup = engine.newGroup();
		this.disabledGroup.anchorChildren = true;
		this.disabledGroup.isVisible = false;
		this.insert(this.disabledGroup);

		this.#buildButtonView(options);

		this.onTapListener = options.onTap;
		this.onReleaseListener = options.onRelease;
		this.onHoldListener = options.onHold;
		this.onPressListener = options.onPress;

		this.addEventListener('tap', this.onTap.bind(this));
		this.addEventListener('touch', this.onTouch.bind(this));
		this.addEventListener('hover', this.onHover.bind(this));
		this.addEventListener('exitframe', this.#exitframe.bind(this));
	}

	#buildButtonView(options) {
		if (options.sheet) {
			var sheet = options.sheet;

			if (sheet.numFrames == 2 || sheet.numFrames == 3) {
				this.#build3FrameView(this.defaultGroup, sheet.image, sheet.frameData[0]);
				this.#build3FrameView(this.pressedGroup, sheet.image, sheet.frameData[1]);
				this.#build3FrameView(this.disabledGroup, sheet.image, sheet.frameData[2]);
			} else if (sheet.numFrames == 6 || sheet.numFrames == 9) {
				this.#build9FrameView(this.defaultGroup, sheet.image, options.width, sheet.frameData[0], sheet.frameData[1], sheet.frameData[2]);
				this.#build9FrameView(this.pressedGroup, sheet.image, options.width, sheet.frameData[3], sheet.frameData[4], sheet.frameData[5]);
				this.#build9FrameView(this.disabledGroup, sheet.image, options.width, sheet.frameData[6], sheet.frameData[7], sheet.frameData[8]);
			}
		} else if (options.shape) {
			this.#buildShapeView(options);
		}

		var labelOptions = {
			x: options.labelXOffset,
			y: options.labelYOffset,
			font: options.font,
			fontSize: options.fontSize,
			text: options.label,
			align: options.labelAlign,
		};
		this.label = new ZetoTextObject(this.engine, labelOptions);
		this.label.anchorX = options.labelAnchorX ?? 0.5;
		this.label.anchorY = options.labelAnchorY ?? 0.5;
		this.label.fillColor = options.labelColor ?? this.engine.fillColor;
		this.insert(this.label);

		this.updateBounds();
	}

	#buildShapeView(options) {
		const { shape, width, height, radius, fillColor, strokeColor, strokeWidth } = options;

		let defaultShape, pressedShape, disabledShape;

		switch (shape) {
			case 'roundedRect':
				defaultShape = this.engine.newRoundedRect(0, 0, width, height, radius);
				pressedShape = this.engine.newRoundedRect(0, 0, width, height, radius);
				disabledShape = this.engine.newRoundedRect(0, 0, width, height, radius);
				break;
			case 'circle':
				defaultShape = this.engine.newCircle(0, 0, radius);
				pressedShape = this.engine.newCircle(0, 0, radius);
				disabledShape = this.engine.newCircle(0, 0, radius);
				break;
			default:
				defaultShape = this.engine.newRect(0, 0, width, height);
				pressedShape = this.engine.newRect(0, 0, width, height);
				disabledShape = this.engine.newRect(0, 0, width, height);
				break;
		}

		this.#buildShape(this.defaultGroup, defaultShape, fillColor.default, strokeColor?.default, strokeWidth);
		this.#buildShape(this.pressedGroup, pressedShape, fillColor.over, strokeColor?.over, strokeWidth);
		this.#buildShape(this.disabledGroup, disabledShape, fillColor.disabled, strokeColor?.disabled, strokeWidth);
	}

	#buildShape(group, shape, fillColor, strokeColor, strokeWidth) {
		shape.fillColor = fillColor ?? this.fillColor;
		shape.stroke = strokeColor ?? null;
		shape.strokeWidth = strokeWidth ?? 0;
		group.insert(shape);
	}

	#build3FrameView(group, sheetImage, frameData) {
		var rect = this.engine.newRect(0, 0, frameData.width, frameData.height);
		rect.fill = { image: sheetImage, sheet: frameData };
		group.insert(rect);
	}

	#build9FrameView(group, sheetImage, desiredWidth, leftFrameData, middleFrameData, rightFrameData) {
		var minWidth = leftFrameData.width + rightFrameData.width;
		var width = mathMax(desiredWidth ?? minWidth + middleFrameData.width, minWidth);
		var middleWidth = width - minWidth;
		var height = leftFrameData.height;
		var hMiddleWidth = mathFloor(middleWidth * 0.5);

		var leftRect = this.engine.newRect(-hMiddleWidth, 0, leftFrameData.width, height);
		leftRect.anchorX = 1;
		leftRect.fill = { image: sheetImage, sheet: leftFrameData };
		group.insert(leftRect);

		var middleRect = this.engine.newRect(0, 0, middleWidth + 2, height);
		middleRect.fill = { image: sheetImage, sheet: middleFrameData };
		group.insert(middleRect);

		var rightRect = this.engine.newRect(hMiddleWidth, 0, rightFrameData.width, height);
		rightRect.anchorX = 0;
		rightRect.fill = { image: sheetImage, sheet: rightFrameData };
		group.insert(rightRect);
	}

	setLabel(labelText) {
		if (labelText != this.label.text) {
			this.label.text = labelText;
		}
	}

	setEnabled(enabled) {
		if (this.enabled != enabled) {
			this.disabledGroup.isVisible = !enabled;
			this.defaultGroup.isVisible = enabled;
			this.pressedGroup.isVisible = false;
		}
		this.enabled = enabled;
	}

	#exitframe(event) {
		if (this.onTapListener) {
			if (this.engine.frameEvent.timeStamp - this.tapTimestamp < this.engine.tapTime) {
				this.#setPressedView(true);
			} else {
				this.#setPressedView(false);
			}
		}
	}

	#setPressedView(pressed) {
		if (pressed) {
			if (!this.pressedGroup.isVisible) {
				this.pressedGroup.isVisible = true;
				this.defaultGroup.isVisible = false;
			}
		} else if (!this.defaultGroup.isVisible) {
			this.pressedGroup.isVisible = false;
			this.defaultGroup.isVisible = true;
		}
	}

	onTap(event) {
		if (this.enabled) {
			this.tapTimestamp = this.engine.frameEvent.timeStamp;
			if (this.onTapListener) {
				this.onTapListener(event);
			}
			return true;
		}
	}

	onTouch(event) {
		if (this.enabled) {
			if (event.phase == began) {
				if (this.onPressListener) {
					this.onPressListener(event);
				}
				this.holding = this.engine.frameEvent.frame;
				this.#setPressedView(true);
			} else if (event.phase == hold) {
				this.#setPressedView(true);
				if (this.onHoldListener) {
					this.onHoldListener({ target: this, frame: this.engine.frameEvent.frame - this.holding });
				}
			} else if (event.phase == ended) {
				if (this.onReleaseListener) {
					this.onReleaseListener(event);
				}
				this.holding = false;
				this.#setPressedView(false);
			}
			return true;
		}
	}

	onHover(event) {
		if (event.phase == began) {
			if (this.enabled) {
				document.body.style.cursor = 'pointer';
			}
		} else if (event.phase == ended) {
			document.body.style.cursor = 'default';
		}
	}
}

export { ZetoButton };