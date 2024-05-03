///////////////////////////////////////////// ZetoEngine2D
/*
Copyright (c) ZetoSoft and Basilio Germán

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
///////////////////////////////////////////// Constants
const lockCanvasEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];
const radianMultiplier = Math.PI / 180;
const degreeMultiplier = 180 / Math.PI;
const disableTests = true;
const began = 'began';
const moved = 'moved';
const ended = 'ended';
const end = 'end';
const start = 'start';
const hover = 'hover';
///////////////////////////////////////////// Helpers
const isGroup = (object) => {
	return object instanceof ZetoGroup;
};
const isTransition = (object) => {
	return object instanceof ZetoTransition;
};
const mathCos = Math.cos;
const mathSin = Math.sin;
const pi = Math.PI;
const hPi = pi * 0.5;
const mathRound = Math.round;
const mathFloor = Math.floor;
const mathRandom = Math.random;
const mathMax = Math.max;
const mathSqrt = Math.sqrt;
const mathAbs = Math.abs;
const randomSideFloat = () => {
	return mathRandom() * 2 - 1;
};
const isNumber = (value) => {
	return typeof value === 'number';
};
const isString = (value) => {
	return typeof value === 'string';
};
const isObject = (value) => {
	return typeof value === 'object';
};
///////////////////////////////////////////// Matter.js
const Matter = window.Matter;
const mBody = Matter?.Body ?? undefined;
const mBodies = Matter?.Bodies ?? undefined;
const mEngine = Matter?.Engine ?? undefined;
const mComposite = Matter?.Composite ?? undefined;
const mVertices = Matter?.Vertices ?? undefined;
const mEvents = Matter?.Events ?? undefined;
///////////////////////////////////////////// Objects
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

class ZetoEngineObject extends ZetoEventObject {
	listeners = {
		tap: [],
		touch: [],
		hover: [],
		enterframe: [],
		exitframe: [],
		finalize: [],
	};

	bounds = {
		local: {
			x1: 0,
			x2: 0,
			y1: 0,
			y2: 0,
			width: 0,
			height: 0,
		},
		world: {
			x1: 0,
			x2: 0,
			y1: 0,
			y2: 0,
			width: 0,
			height: 0,

			rotation: 0,
		},
	};

	fillColor;
	alpha = 1;
	isVisible = true;

	parent;
	x = 0;
	y = 0;

	internal = {
		width: 0,
		height: 0,

		anchorX: 0.5,
		anchorY: 0.5,

		anchorOffsetX: 0,
		anchorOffsetY: 0,

		rotation: 0,
		xScale: 1,
		yScale: 1,

		xScaleInverse: 1,
		yScaleInverse: 1,

		fill: null,
	};

	engine;
	strokeWidth = 0;
	stroke;
	path = new ZetoPath();

	hover = false;

	constructor(engine, fill, x = 0, y = 0) {
		super();

		this.engine = engine;
		this.fill = fill; // Can be path or fill
		this.x = x;
		this.y = y;

		this.fillColor = engine.fillColor;

		if (this.fill) {
			this.calculatePath();
			this.updateBounds();
		}
	}

	calculatePath() {
		if (this.fill.image) {
			if (!this.fill.sheet) {
				// Image or ImageRect object
				this.createFillSheet(this.fill.image);
				this.calculateImagePath();
			} else {
				// Sprite object
				this.calculateSpritePath();
			}
		} else {
			// Path object
			this.createFillSheet(this.fill);
			this.path = this.fill;
		}
	}

	calculateImagePath() {
		var x = this.fill.sheet.x - (this.internal.anchorX - 0.5) * this.bounds.local.width;
		var y = this.fill.sheet.y - (this.internal.anchorY - 0.5) * this.bounds.local.height;
		this.path.rect(x, y, this.fill.sheet.width, this.fill.sheet.height);
	}

	calculateSpritePath() {
		this.path.rect(-this.fill.sheet.width * 0.5, -this.fill.sheet.height * 0.5, this.fill.sheet.width, this.fill.sheet.height);
	}

	get width() {
		return this.path.width ?? (this.fill ? this.fill.sheet.width : 0);
	}

	get height() {
		return this.path.height ?? (this.fill ? this.fill.sheet.height : 0);
	}

	set width(value) {
		this.path.width = value;
	}

	set height(value) {
		this.path.height = value;
	}

	set anchorX(value) {
		this.internal.anchorX = value;
		this.internal.anchorOffsetX = -(value - 0.5) * this.bounds.local.width;
	}

	set anchorY(value) {
		this.internal.anchorY = value;
		this.internal.anchorOffsetY = -(value - 0.5) * this.bounds.local.height;
	}

	get anchorX() {
		return this.internal.anchorX;
	}

	get anchorY() {
		return this.internal.anchorY;
	}

	set rotation(value) {
		if (value != this.internal.rotation) {
			this.internal.rotation = value;
			this.updateBounds();
		}
	}

	get rotation() {
		return this.internal.rotation;
	}

	set xScale(value) {
		if (value != this.internal.xScale && value != 0) {
			this.internal.xScale = value;
			this.internal.xScaleInverse = 1 / value;
			this.updateBounds();
		}
	}

	set yScale(value) {
		if (value != this.internal.yScale && value != 0) {
			this.internal.yScale = value;
			this.internal.yScaleInverse = 1 / value;
			this.updateBounds();
		}
	}

	get xScale() {
		return this.internal.xScale;
	}

	get yScale() {
		return this.internal.yScale;
	}

	set fill(value) {
		this.internal.fill = value;
		if (value && value.pattern) {
			var transformMatrix = new DOMMatrix();
			transformMatrix.translateSelf(value.x ?? 0, value.y ?? 0);
			transformMatrix.rotateSelf((value.rotation ?? 0) * degreeMultiplier);
			transformMatrix.scaleSelf(value.xScale ?? 1, value.yScale ?? 1);
			value.pattern.setTransform(transformMatrix);
			this.createFillSheet({ width: this.path.width, height: this.path.height });
		} else if (value && value.image && !value.sheet) {
			this.createFillSheet(value.image);
		}
	}

	get fill() {
		return this.internal.fill;
	}

	setFillColor(r, g, b, a = 1) {
		this.fillColor = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
	}

	createFillSheet(properties) {
		this.fill.sheet = {
			x: properties.x ?? 0,
			y: properties.y ?? 0,
			width: properties.width ?? 0,
			height: properties.height ?? 0,
		};
	}

	draw(event) {
		var fill = this.internal.fill;
		var path = this.path;

		if (fill) {
			if (fill.pattern) {
				this.engine.context.fillStyle = fill.pattern;
				this.engine.context.fill(path.path);
			} else if (fill.image) {
				var sheet = fill.sheet;
				this.engine.context.drawImage(fill.image, sheet.x, sheet.y, sheet.width, sheet.height, path.left, path.top, path.width, path.height);
			} else {
				// Shapes
				this.engine.context.fillStyle = this.fillColor;
				this.engine.context.scale(path.internal.xScale, path.internal.yScale);
				this.engine.context.fill(path.path);
			}
		} else {
			this.engine.context.fillStyle = this.fillColor;
		}

		if (this.strokeWidth > 0) {
			this.engine.context.lineWidth = this.strokeWidth;
			this.engine.context.strokeStyle = this.stroke;
			this.engine.context.stroke(path.path);
		}
	}

	update(event) {
		// Do nothing
	}

	destroy() {
		super.destroy();

		if (this.parent) {
			var index = this.parent.children.indexOf(this);
			this.parent.children.splice(index, 1);
		}

		this.parent = null;
		this.engine = null;
		this.fill = null;
		this.path = null;
		this.fillColor = null;
	}

	toFront() {
		if (this.parent) {
			var index = this.parent.children.indexOf(this);
			this.parent.children.splice(index, 1);
			this.parent.children.push(this);
		}
	}

	toBack() {
		if (this.parent) {
			var index = this.parent.children.indexOf(this);
			this.parent.children.splice(index, 1);
			this.parent.children.unshift(this);
		}
	}

	updateBounds(world = false, skipWorld = false, worldRotation = 0) {
		var bounds = world ? this.bounds.world : this.bounds.local;

		var cos = 0;
		var sin = 0;
		if (world) {
			cos = mathCos(this.rotation * radianMultiplier);
			sin = mathSin(this.rotation * radianMultiplier);

			bounds.rotation = this.rotation + worldRotation;
		}

		bounds.x1 = 0;
		bounds.x2 = 0;
		bounds.y1 = 0;
		bounds.y2 = 0;

		var hasSheet = this.fill && this.fill.sheet;
		var hasPath = this.path;

		var halfWidth = hasPath ? this.path.width * 0.5 : hasSheet ? this.fill.sheet.width * 0.5 : 0;
		var halfHeight = hasPath ? this.path.height * 0.5 : hasSheet ? this.fill.sheet.height * 0.5 : 0;

		var vertices = [
			{ x: -halfWidth, y: -halfHeight },
			{ x: halfWidth, y: -halfHeight },
			{ x: halfWidth, y: halfHeight },
			{ x: -halfWidth, y: halfHeight },
		];

		for (var vertexIndex = 0; vertexIndex < vertices.length; vertexIndex++) {
			var vertex = vertices[vertexIndex];
			var x = world ? vertex.x * cos - vertex.y * sin : vertex.x;
			var y = world ? vertex.x * sin + vertex.y * cos : vertex.y;

			if (x < bounds.x1) {
				bounds.x1 = x;
			}
			if (x > bounds.x2) {
				bounds.x2 = x;
			}
			if (y < bounds.y1) {
				bounds.y1 = y;
			}
			if (y > bounds.y2) {
				bounds.y2 = y;
			}
		}

		bounds.width = bounds.x2 - bounds.x1;
		bounds.height = bounds.y2 - bounds.y1;

		if (!world) {
			this.internal.anchorOffsetX = -(this.anchorX - 0.5) * bounds.width;
			this.internal.anchorOffsetY = -(this.anchorY - 0.5) * bounds.height;

			if (!skipWorld) {
				// Update world bounds too
				this.updateBounds(true, null, worldRotation);
			}
		}
	}
}

class ZetoTextObject extends ZetoEngineObject {
	values = {
		// Since internal is taken by EngineObject
		fontName: 'Arial',
		fontSize: 20,
		contextFont: '20px Arial',
		textString: '',
		width: 0,
		words: [],
		lines: [],
		lineHeight: 0,
		offsetY: 0,
		spacing: 0,
	};

	align = 'center';

	constructor(engine, options = {}) {
		super(engine);

		this.values.fontName = options.fontName ?? engine.defaultFontName;
		this.values.fontSize = options.fontSize ?? engine.defaultFontSize;
		this.values.textString = String(options.text) ?? '';
		this.values.width = options.width ?? 0;
		this.values.contextFont = this.values.fontSize + 'px ' + this.values.fontName;
		this.values.spacing = options.spacing ?? 0.5;

		this.align = options.align ?? 'center';

		this.x = options.x ?? 0;
		this.y = options.y ?? 0;

		this.calculateTextPath();
		this.updateBounds();
	}

	set fontName(value) {
		this.values.fontName = value;
		this.values.contextFont = this.fontSize + 'px ' + this.fontName;
		this.calculateTextPath(true);
		this.updateBounds();
	}

	get fontName() {
		return this.values.fontName;
	}

	set fontSize(value) {
		this.values.fontSize = value;
		this.values.contextFont = this.fontSize + 'px ' + this.fontName;
		this.calculateTextPath(true);
		this.updateBounds();
	}

	get fontSize() {
		return this.values.fontSize;
	}

	set text(value) {
		if (value != this.values.textString) {
			this.values.textString = String(value);
			this.calculateTextPath(true);
			this.updateBounds();
		}
	}

	get text() {
		return this.values.textString;
	}

	draw(event) {
		super.draw(event);

		this.engine.context.font = this.values.contextFont;
		this.engine.context.fillStyle = this.fillColor;
		for (var lineIndex = 0; lineIndex < this.values.lines.length; lineIndex++) {
			var line = this.values.lines[lineIndex];
			this.engine.context.fillText(line, 0, this.values.offsetY + (this.values.spacing + this.values.lineHeight) * lineIndex);
		}
	}

	calculateTextPath(newPath = false) {
		// TODO: take into account align
		var width = 0;
		var maxLineHeight = 0;

		this.values.lines = [];

		if (this.values.width > 0) {
			width = this.values.width;

			this.values.words = this.values.textString.replace(/\n/g, ' \n ').split(/ +/);
			var currentLine = 0;
			this.values.lines[currentLine] = this.values.words[0];
			if (this.values.words.length > 1) {
				for (var wordIndex = 1; wordIndex < this.values.words.length; wordIndex++) {
					var word = this.values.words[wordIndex];
					if (word == '\n') {
						// Newline character found, start new line
						currentLine++;
						this.values.lines[currentLine] = '';
						continue;
					}
					var line = this.values.lines[currentLine] ?? '';
					line = line == '' ? word : line + ' ' + word;

					this.engine.context.font = this.values.contextFont;
					var metrics = this.engine.context.measureText(line);

					// Check if line with new word fits
					if (metrics.width > this.values.width && line != word) {
						// Word does not fit, start new line
						currentLine++;
						this.values.lines[currentLine] = word;
					} else {
						// New word fits or is the first word in line
						var lineHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
						maxLineHeight = lineHeight > maxLineHeight ? lineHeight : maxLineHeight;
						this.values.lines[currentLine] = line;
					}
				}
				this.values.lineHeight = lineHeight > this.values.lineHeight ? lineHeight : this.values.lineHeight;
			} else {
				this.engine.context.font = this.values.contextFont;
				var metrics = this.engine.context.measureText(this.values.lines[currentLine]);
				maxLineHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
			}
		} else {
			this.values.lines = this.values.textString.split('\n');
			for (var lineIndex = 0; lineIndex < this.values.lines.length; lineIndex++) {
				var line = this.values.lines[lineIndex];
				this.engine.context.font = this.values.contextFont;
				var metrics = this.engine.context.measureText(line);
				if (metrics.width > width) {
					width = metrics.width;
				}
				var lineHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
				maxLineHeight = lineHeight > maxLineHeight ? lineHeight : maxLineHeight;
			}
		}

		this.values.lineHeight = this.values.lines.length > 1 ? maxLineHeight * (1 + this.values.spacing) : maxLineHeight;
		var totalHeight = this.values.lines.length * this.values.lineHeight - this.values.spacing;
		this.values.offsetY = -(this.values.lines.length - 1) * this.values.lineHeight * 0.5;

		var left = -width * 0.5;
		var top = -totalHeight * 0.5;

		if (newPath) {
			this.path = new ZetoPath();
		}
		this.path.rect(left, top, width, totalHeight);
	}
}

class ZetoGroup extends ZetoEngineObject {
	children = [];
	anchorChildren = false;

	constructor(engine, x = 0, y = 0) {
		super(engine, null, x, y);
	}

	get width() {
		return this.bounds.local.width;
	}

	get height() {
		return this.bounds.local.height;
	}

	insert(childObject, skipUpdate = false) {
		if (childObject.parent && childObject.parent != this) {
			var index = childObject.parent.children.indexOf(childObject);
			childObject.parent.children.splice(index, 1);

			childObject.parent.updateBounds();
		}

		if (childObject.parent != this) {
			this.children.push(childObject);
			childObject.parent = this;
		}

		if (!skipUpdate) {
			this.updateBounds();
		}

		return childObject;
	}

	updateBounds(world = false, skipWorld = false, worldRotation = 0) {
		super.updateBounds(world, skipWorld);

		if (this.children) {
			var bounds = world ? this.bounds.world : this.bounds.local;

			for (var childIndex = 0; childIndex < this.children.length; childIndex++) {
				var child = this.children[childIndex]; // Compare child bounds

				child.updateBounds(world, true, worldRotation + this.rotation, true);
				// TODO: this is not calculating bounds with anchors?
				var childBounds = world ? child.bounds.world : child.bounds.local;

				if (childBounds.x1 < bounds.x1) {
					bounds.x1 = childBounds.x1;
				}
				if (childBounds.x2 > bounds.x2) {
					bounds.x2 = childBounds.x2;
				}
				if (childBounds.y1 < bounds.y1) {
					bounds.y1 = childBounds.y1;
				}
				if (childBounds.y2 > bounds.y2) {
					bounds.y2 = childBounds.y2;
				}
			}

			bounds.width = bounds.x2 - bounds.x1;
			bounds.height = bounds.y2 - bounds.y1;

			if (!world && this.anchorChildren) {
				this.internal.anchorOffsetX = -(this.anchorX - 0.5) * bounds.width;
				this.internal.anchorOffsetY = -(this.anchorY - 0.5) * bounds.height;
			}
		}

		if (!world && !skipWorld) {
			// Update world bounds too
			this.updateBounds(true, null, worldRotation);
		}
	}

	destroy() {
		super.destroy();
		this.removeAll();
	}

	removeAll() {
		for (var childIndex = this.children.length - 1; childIndex >= 0; childIndex--) {
			this.children[childIndex].destroy();
		}
	}
}

class ZetoStrings extends ZetoEventObject {
	strings = [{ en: {} }, { es: {} }];
	engine;
	locale = 'en';

	listeners = {
		locale: [],
	};

	constructor(engine) {
		super();
		this.engine = engine;
	}

	setLocale(locale) {
		this.locale = locale;
		this.dispatchEvent('locale', { target: this, locale: locale });
	}

	add(strings) {
		for (var locale in strings) {
			if (!this.strings[locale]) {
				this.strings[locale] = {};
			}
			for (var key in strings[locale]) {
				this.strings[locale][key] = strings[locale][key];
			}
		}
	}

	get(key, replace) {
		let string = this.strings[this.locale][key] || key;
		if (replace && typeof replace === 'object') {
			Object.keys(replace).forEach((key) => {
				const placeholder = `:${key}`;
				const value = replace[key];
				string = string.replace(new RegExp(placeholder, 'g'), value);
			});
		}
		return string;
	}
}

class ZetoWidgets extends ZetoEventObject {
	widgets = {
		default: [],
	};
	enabled = {
		default: true,
	};
	engine;

	listeners = {
		enabled: [],
	};

	constructor(engine) {
		super();
		this.engine = engine;
	}

	newButton(options) {
		let button = new ZetoButton(this.engine, options);
		button.addEventListener('finalize', (event) => {
			let tag = event.target.tag;
			let index = this.widgets[tag].indexOf(event.target);
			if (index > -1) {
				this.widgets[tag].splice(index, 1);
			}
		});

		let tag = options.tag ?? 'default';
		this.widgets[tag] = this.widgets[tag] ?? [];
		this.widgets[tag].push(button);
		this.enabled[tag] = this.enabled[tag] ?? true;
		button.setEnabled(this.enabled[tag]);
		return this.engine.rootGroup.insert(button, true);
	}

	setEnabled(enabled, tag = 'default') {
		this.enabled[tag] = enabled;
		this.widgets[tag] = this.widgets[tag] ?? [];
		for (var index = 0; index < this.widgets[tag].length; index++) {
			var widget = this.widgets[tag][index];
			widget.setEnabled(enabled);
		}
		this.dispatchEvent('enabled', { target: this, enabled: enabled, tag: tag });
	}
}

class ZetoWidget extends ZetoGroup {
	tag;
	enabled = true;

	constructor(engine, x = 0, y = 0, tag = 'default') {
		super(engine, x, y);
		this.tag = tag;
	}

	setEnabled(enabled) {
		this.enabled = enabled;
	}
}

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

		this.#buildShape(this.defaultGroup, defaultShape, fillColor.default, strokeColor.default, strokeWidth);
		this.#buildShape(this.pressedGroup, pressedShape, fillColor.over, strokeColor.over, strokeWidth);
		this.#buildShape(this.disabledGroup, disabledShape, fillColor.disabled, strokeColor.disabled, strokeWidth);
	}

	#buildShape(group, shape, fillColor, strokeColor, strokeWidth) {
		shape.fillColor = fillColor ?? this.fillColor;
		shape.stroke = strokeColor ?? this.strokeColor;
		shape.strokeWidth = strokeWidth ?? 2;
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
		// TODO: should differentiate between hold and tap
		if (this.holding) {
			if (this.onHoldListener) {
				this.onHoldListener({ target: this, frame: this.engine.frameEvent.frame - this.holding });
			}
		}

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
		}
		return true;
	}

	onTouch(event) {
		if (this.enabled) {
			if (event.phase == began) {
				if (this.onPressListener) {
					this.onPressListener(event);
				}
				this.holding = this.engine.frameEvent.frame;
				this.#setPressedView(true);
			} else if (event.phase == ended) {
				if (this.onReleaseListener) {
					this.onReleaseListener(event);
				}
				this.holding = false;
				this.#setPressedView(false);
			}
		}
		return true;
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

class ZetoSprite extends ZetoEngineObject {
	imageSheet;
	sequenceData;

	sequenceMap = {};

	frame = 0;
	frameTime = 0;
	frameTimestamp = 0;

	sequence = false;
	playing = false;

	constructor(engine, imageSheet, sequenceData, x = 0, y = 0) {
		super(engine, imageSheet, x, y);

		this.imageSheet = imageSheet;
		this.sequenceData = sequenceData;

		this.sequenceData.forEach((sequence) => {
			this.sequenceMap[sequence.name] = sequence;
		});
	}

	setSequence(sequenceName) {
		if (this.sequenceMap[sequenceName]) {
			this.sequence = this.sequenceMap[sequenceName];
			this.frameTime = this.sequence.time / this.sequence.count;
		}
	}

	play() {
		this.playing = true;
	}

	stop() {
		this.playing = false;
	}

	update(event) {
		super.update(event);

		if (this.playing) {
			if (this.sequence) {
				if (this.frameTimestamp == 0) {
					this.frameTimestamp = event.timeStamp;
				}

				var deltaTime = event.timeStamp - this.frameTimestamp;
				var frameAdd = mathFloor(deltaTime / this.frameTime);

				if (frameAdd > 0) {
					if (this.sequence.count > 1 && this.sequence.time > 0) {
						this.frame += frameAdd;
						this.frameTimestamp = event.timeStamp - (deltaTime % this.frameTime);
						var rightLimit = this.sequence.start + this.sequence.count - 1;
						if (this.frame > rightLimit) {
							var frameDiff = ((this.frame - rightLimit) % this.sequence.count) - 1;
							this.frame = this.sequence.start + frameDiff;
						} else if (this.frame < this.sequence.start) {
							var frameDiff = (this.sequence.start - this.frame) % this.sequence.count;
							this.frame = this.sequence.start + this.sequence.count - frameDiff;
						}
					}

					var sheet = this.imageSheet.frameData[this.frame];
					if (sheet && sheet != this.fill.sheet) {
						this.fill.sheet = sheet;
					}
				}
			}
		}
	}
}

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
///////////////////////////////////////////// Engine
class ZetoEngine extends ZetoEventObject {
	debug = false;

	listeners = {
		enterframe: [],
		exitframe: [],
		resize: [],
		touch: [],
		wheel: [],
		tap: [],
		key: [],
	};

	mouseX = 0;
	mouseY = 0;
	mouseTouch = false;

	holdingKey = {};

	tapTime = 200;

	touchPoints = [];
	removeTouchPoints = [];
	startTouchPoints = [];
	activeTouchPoints = [];

	rootGroup;

	loadedImages = {};
	loadedAudio = {};
	loadedData = {};

	fillColor = 'white';
	clearColor = 'black';
	clearAlpha = 1;

	debugTapColor = '#FF00FFBB'; // magenta
	debugBoundsColor = '#FF0000BB'; // red
	debugColor = '#FFFFFFBB'; // white

	defaultFontName = 'Arial';
	defaultFontSize = 20;

	frameEvent = {
		frame: 0,
		timeStamp: 0,
		delta: 0,
	};
	canvasLocked = false;
	canvas;
	context;

	audioContext;

	cX;
	cY;
	width;
	height;

	paused = false;
	focus = true;

	pauseBind;

	showFPS = false;
	secondsPassed;
	oldTimeStamp;
	fps;

	physics;
	particles;
	transition;
	widgets;
	strings;

	timers = [];

	info = {
		isMobile: (navigator.maxTouchPoints & 0xff) > 1 || 'ontouchstart' in document ? true : false,
	};

	loadedIds = {
		image: {},
		audio: {},
		data: {},
		unknown: {},
	};

	constructor(options = {}) {
		super();

		var moduleName = options.moduleName ?? false;
		var moduleParams = options.moduleParams ?? {};
		var loadedListener = options.loadedListener ?? false;
		var progressListener = options.progressListener ?? false;
		var smoothing = options.smoothing ?? false;
		var canvas = options.canvas ?? 'canvas';

		this.rootGroup = new ZetoGroup(this);
		this.physics = new ZetoPhysicsEngine(this);
		this.particles = new ZetoParticleEngine(this);
		this.transition = new ZetoTransitionEngine(this);
		this.widgets = new ZetoWidgets(this);
		this.strings = new ZetoStrings(this);

		document.addEventListener('touchstart', {}); // Enables touch events on iOS if embedded in iframe

		window.addEventListener('visibilitychange', this.visibilityChange.bind(this));

		window.addEventListener('touchstart', this.touchStart.bind(this));
		window.addEventListener('touchmove', this.touchMove.bind(this), { passive: false });
		window.addEventListener('touchend', this.touchEnd.bind(this));
		window.addEventListener('touchcancel', this.touchCancel.bind(this));

		window.addEventListener('mousedown', this.mouseDown.bind(this));
		window.addEventListener('mousemove', this.mouseMove.bind(this));
		window.addEventListener('mouseup', this.mouseUp.bind(this));

		window.addEventListener('wheel', this.wheelEvent.bind(this));

		window.addEventListener('keydown', this.keyDown.bind(this));
		window.addEventListener('keyup', this.keyUp.bind(this));

		this.initAudioListeners();
		this.initCanvas(smoothing, canvas);

		window.onunload = function (event) {
			event.preventDefault();
		};

		if (moduleName) {
			this.load(moduleName, moduleParams, loadedListener, progressListener);
		}
	}

	visibilityChange(event) {
		if (document.hidden) {
			// mainLoop handles the re-focus
			this.focus = false;
		}
	}

	touchStart(event) {
		var touches = event.changedTouches?.length > 0 ? event.changedTouches : [event];
		for (var touchIndex = 0; touchIndex < touches.length; touchIndex++) {
			var touch = touches[touchIndex];

			var existingTouch = this.touchPoints[touch.identifier];
			if (!existingTouch) {
				this.activeTouchPoints.push(touch.identifier);
				this.touchPoints[touch.identifier] = {
					lastInputX: touch.pageX,
					lastInputY: touch.pageY,
					startX: touch.pageX,
					startY: touch.pageY,
					startTime: event.timeStamp,
					startFrame: this.frameEvent.frame,
					listenerObjects: [],
					started: false,
				};
			}
		}
	}

	inputTouch(event) {
		var touches = event.changedTouches?.length > 0 ? event.changedTouches : [event];
		for (var touchIndex = 0; touchIndex < touches.length; touchIndex++) {
			var touch = touches[touchIndex];

			var touchPoint = this.touchPoints[touch.identifier ?? 0];
			var deltaX = touch.pageX - touchPoint.lastInputX;
			var deltaY = touch.pageY - touchPoint.lastInputY;
			touchPoint.lastInputX = touch.pageX;
			touchPoint.lastInputY = touch.pageY;

			var touchEvent = { deltaX: deltaX, deltaY: deltaY, touchPoint: touchPoint, phase: moved };
			this.dispatchEvent('touch', touchEvent);

			if (touchPoint.listenerObjects.length > 0) {
				for (var objectIndex = 0; objectIndex < touchPoint.listenerObjects.length; objectIndex++) {
					var object = touchPoint.listenerObjects[objectIndex];
					if (object.hasEventListener('touch')) {
						var touchEvent = {
							x: touchPoint.lastInputX,
							y: touchPoint.lastInputY,
							deltaX: deltaX,
							deltaY: deltaY,
							touchPoint: touchPoint,
							phase: moved,
						};
						this.dispatchObjectEvent(object, 'touch', touchEvent);
					}
				}
			}
		}
	}

	touchMove(event) {
		event.preventDefault();
		this.inputTouch(event);
	}

	touchEnd(event) {
		var touches = event.changedTouches?.length > 0 ? event.changedTouches : [event];
		for (var touchIndex = 0; touchIndex < touches.length; touchIndex++) {
			var touch = touches[touchIndex];

			var touchPoint = this.touchPoints[touch.identifier ?? 0];
			touchPoint.lastInputX = touch.pageX;
			touchPoint.lastInputY = touch.pageY;

			var touchDiff = event.timeStamp - touchPoint.startTime;
			var tapEvent = false;
			if (touchDiff < this.tapTime) {
				tapEvent = {
					x: touchPoint.lastInputX,
					y: touchPoint.lastInputY,
					time: touchDiff,
				};
				this.dispatchEvent('tap', tapEvent); // Engine level
			}

			if (touchPoint.listenerObjects.length > 0) {
				// Object level
				for (var objectIndex = 0; objectIndex < touchPoint.listenerObjects.length; objectIndex++) {
					var object = touchPoint.listenerObjects[objectIndex];
					if (tapEvent && object.hasEventListener('tap')) {
						this.dispatchObjectEvent(object, 'tap', tapEvent);
					}
					if (object.hasEventListener('touch')) {
						var touchEvent = {
							x: touchPoint.lastInputX,
							y: touchPoint.lastInputY,
							touchPoint: touchPoint,
							phase: ended,
						};
						this.dispatchObjectEvent(object, 'touch', touchEvent);
					}
				}
			}

			this.removeTouchPoints.push(touch.identifier ?? 0);
			touchPoint.listenerObjects = false;
		}
	}

	touchCancel(event) {
		this.touchEnd(event);
	}

	mouseDown(event) {
		if (event.button == 0) {
			this.mouseTouch = true;
			this.activeTouchPoints.push(0);
			this.touchPoints[0] = {
				// Mouse is identifier 0
				lastInputX: event.pageX,
				lastInputY: event.pageY,
				startX: event.pageX,
				startY: event.pageY,
				startTime: event.timeStamp,
				startFrame: this.frameEvent.frame,
				listenerObjects: [],
				started: false,
			};
		}
	}

	mouseMove(event) {
		if (this.mouseTouch) {
			this.inputTouch(event);
		}
		this.mouseX = event.pageX;
		this.mouseY = event.pageY;
	}

	mouseUp(event) {
		if (event.button == 0) {
			this.mouseTouch = false;
			this.touchEnd(event);
		}
	}

	wheelEvent(event) {
		var wEvent = {
			deltaX: event.wheelDeltaX,
			deltaY: event.wheelDeltaY,
		};
		this.dispatchEvent('wheel', wEvent);
	}

	inputKey(event, phase, frame = 0) {
		var kEvent = {
			phase: phase,
			key: event.key,
			code: event.code,

			shiftKey: event.shiftKey,
			ctrlKey: event.ctrlKey,
			altKey: event.altKey,

			frame: frame,
		};
		this.dispatchEvent('key', kEvent);
	}

	keyDown(event) {
		this.inputKey(event, began);
		this.holdingKey[event.code ?? event.key] = {
			event: event,
			frame: 0,
		};
	}

	keyUp(event) {
		this.inputKey(event, ended, -1); // TODO: get holdingKey last frame?
		this.holdingKey[event.code ?? event.key] = false;
	}

	initAudio() {
		try {
			if (!this.audioContext) {
				window.AudioContext = window.AudioContext || window.webkitAudioContext;
				this.audioContext = new AudioContext();

				this.removeEventListener('tap', this.initAudioBind);
				this.removeEventListener('touch', this.initAudioBind);
				this.removeEventListener('key', this.initAudioBind);
			}
		} catch (e) {
			console.error('Could not init audio context');
		}
	}

	initAudioListeners() {
		this.initAudioBind = this.initAudio.bind(this);
		this.addEventListener('tap', this.initAudioBind);
		this.addEventListener('touch', this.initAudioBind);
		this.addEventListener('key', this.initAudioBind);
	}

	initCanvas(smoothing = false, canvasId = 'canvas') {
		this.canvas = document.getElementById(canvasId);
		this.context = canvas.getContext('2d');
		this.resizeCanvas();

		this.context.mozImageSmoothingEnabled = smoothing;
		this.context.webkitImageSmoothingEnabled = smoothing;
		this.context.msImageSmoothingEnabled = smoothing;
		this.context.imageSmoothingEnabled = smoothing;

		canvas.style.outline = 'none';
		canvas.style.webkitTapHighlightColor = 'rgba(255, 255, 255, 0)';
		canvas.style.webkitTouchCallout = 'none';
		canvas.style.webkitUserSelect = 'none';
		canvas.style.khtmlUserSelect = 'none';
		canvas.style.mozUserSelect = 'none';
		canvas.style.msUserSelect = 'none';
		canvas.style.userSelect = 'none';

		document.documentElement.style.overscrollBehavior = 'none';
		document.body.style.overscrollBehavior = 'none';

		window.addEventListener('resize', this.resizeCanvas.bind(this), false);
		window.requestAnimationFrame(this.mainLoop.bind(this));
	}

	mainLoop(timeStamp) {
		if (!this.focus) {
			this.focus = true; // requestAnimationFrame only happens when on focus on most browsers
			this.frameEvent.timeStamp = timeStamp; // This prevents a huge delta time when re-focusing
		}

		if (this.paused) {
			return window.requestAnimationFrame(this.mainLoop.bind(this));
		}

		this.frameEvent.frame++;
		this.frameEvent.delta = timeStamp - this.frameEvent.timeStamp;
		this.frameEvent.timeStamp = timeStamp;

		this.dispatchEvent('enterframe', this.frameEvent);

		this.clearCanvas();
		this.updateInput();
		this.drawUpdate(this.rootGroup); // Scene graph update
		this.updateTimers();
		this.updateTouchPoints();

		this.transition.update(this.frameEvent);
		this.physics.update(this.frameEvent);
		this.particles.update(this.frameEvent);

		this.dispatchEvent('exitframe', this.frameEvent);

		if (this.showFPS) {
			this.drawFPS(timeStamp);
		}
		window.requestAnimationFrame(this.mainLoop.bind(this));
	}

	updateTouchPoints() {
		for (var touchIndex = 0; touchIndex < this.startTouchPoints.length; touchIndex++) {
			var touchPoint = this.startTouchPoints[touchIndex];
			for (var objectIndex = 0; objectIndex < touchPoint.listenerObjects.length; objectIndex++) {
				var object = touchPoint.listenerObjects[objectIndex];
				if (object.hasEventListener('touch')) {
					// TODO: this check can be optimized
					var touchEvent = {
						x: touchPoint.lastInputX,
						y: touchPoint.lastInputY,
						touchPoint: touchPoint,
						phase: began,
					};
					this.dispatchObjectEvent(object, 'touch', touchEvent);
				}
			}
		}

		for (var touchIndex = this.removeTouchPoints.length - 1; touchIndex >= 0; touchIndex--) {
			var touchId = this.removeTouchPoints[touchIndex];

			var activeIndex = this.activeTouchPoints.indexOf(touchId);
			if (activeIndex > -1) {
				// TODO: check alternatives
				this.activeTouchPoints.splice(activeIndex, 1);
			}
			delete this.touchPoints[touchId];
			this.removeTouchPoints.splice(touchIndex, 1);
		}
	}

	updateTimers() {
		for (var timerIndex = this.timers.length - 1; timerIndex >= 0; timerIndex--) {
			var timer = this.timers[timerIndex];
			if (timer.remove) {
				this.timers.splice(timerIndex, 1);
				continue;
			} else if (timer.executeTime <= this.frameEvent.timeStamp) {
				if (timer.iterations != 0) {
					// less than 0 is infinite iterations
					timer.listener({ target: timer });
					timer.executeTime = this.frameEvent.timeStamp + timer.delay;
					timer.iterations--;
				} else if (timer.iterations == 0) {
					this.timers.splice(timerIndex, 1);
				}
			}
		}
	}

	drawFPS(timeStamp) {
		this.secondsPassed = (timeStamp - this.oldTimeStamp) / 1000;
		this.oldTimeStamp = timeStamp;
		this.fps = mathRound(1 / this.secondsPassed);
		this.context.font = '25px Arial';
		this.context.fillStyle = this.fillColor;
		this.context.fillText('FPS: ' + this.fps, 60, 30);
	}

	clearCanvas() {
		this.context.fillStyle = this.clearColor;
		this.context.globalAlpha = this.clearAlpha;
		this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
	}

	updateInput() {
		for (var key in this.holdingKey) {
			var holdEvent = this.holdingKey[key];
			if (holdEvent) {
				if (holdEvent.frame > 0) {
					this.inputKey(holdEvent.event, 'hold', holdEvent.frame);
				}
				holdEvent.frame++;
			}
		}
	}

	updatePhysics(event) {
		this.physics.update(event);
	}

	touchUpdate(object, parentTouch = false) {
		if (this.activeTouchPoints.length <= 0) {
			return false;
		}

		var touchObject = object.hasEventListener('tap') || object.hasEventListener('touch');
		if (isGroup(object)) {
			// TODO: limitation: if two or more chained groups have tap listeners, the previous one will be ignored
			return touchObject || parentTouch; // This means only the last group in the chain will be able to receive tap events (And the children that confirm isPointInPath)
		}

		for (var touchIndex = 0; touchIndex < this.activeTouchPoints.length; touchIndex++) {
			var touchPoint = this.touchPoints[this.activeTouchPoints[touchIndex]];

			if (this.frameEvent.frame > touchPoint.startFrame + 1) {
				continue; // Skip if the touch started before this frame
			}

			if (!touchPoint.listenerObjects) {
				continue; // Skip if the touch has no listener objects
			}

			if (touchObject || parentTouch) {
				if (this.context.isPointInPath(object.path.path, touchPoint.lastInputX, touchPoint.lastInputY)) {
					if (parentTouch) {
						if (touchPoint.listenerObjects.indexOf(parentTouch) == -1) {
							// Can already be added by sibling object
							touchPoint.listenerObjects.push(parentTouch);
						}
						parentTouch = false; // Parent has been handled for the rest of children
					}
					if (touchObject) {
						touchPoint.listenerObjects.push(object);
						touchObject = false;
					}

					if (!touchPoint.started) {
						touchPoint.started = true;
						this.startTouchPoints.push(touchPoint);
					}
				}
			}
		}
		return touchObject || parentTouch;
	}

	hoverUpdate(object, parentHover = false) {
		// TODO: this can be optimized (To start off remove in mobile) use isGroup(), etc
		var hoverObject = object.hasEventListener(hover) || parentHover; // hoverObject can be a parent and not the object itself
		if (hoverObject) {
			if (!hoverObject.hover) {
				if (this.context.isPointInPath(object.path.path, this.mouseX, this.mouseY)) {
					hoverObject.hover = this.frameEvent.frame;

					var hoverEvent = { x: this.mouseX, y: this.mouseY, phase: began };
					this.dispatchObjectEvent(hoverObject, hover, hoverEvent);
				}
			} else if (hoverObject.hover != this.frameEvent.frame) {
				if (!hoverObject.isVisible || hoverObject.alpha == 0 || !this.context.isPointInPath(object.path.path, this.mouseX, this.mouseY)) {
					// My guess is that this is the main bottleneck
					hoverObject.hover = false;

					var hoverEvent = { x: this.mouseX, y: this.mouseY, phase: ended };
					this.dispatchObjectEvent(hoverObject, hover, hoverEvent);
				}
			}
			return hoverObject;
		}
	}

	debugDraw(object) {
		if (this.debug) {
			this.context.globalAlpha = 1;
			this.context.lineWidth = 1;
			this.context.fillStyle = this.debugColor;

			if (isGroup(object)) {
				// Cross for groups
				this.context.save();
				this.context.rotate(45 * radianMultiplier);
				this.context.fillRect(0, -4, 2, 10);
				this.context.fillRect(-4, 0, 10, 2);
				this.context.restore();
			} else {
				// Dot for anything else
				this.context.fillRect(0, 0, 3, 3);

				if (object.bounds) {
					// Draw bounds except for root group
					this.context.strokeStyle = this.debugBoundsColor;
					this.context.save();
					this.context.rotate(-object.bounds.world.rotation * radianMultiplier);
					this.context.strokeRect(object.bounds.world.x1, object.bounds.world.y1, object.bounds.world.width, object.bounds.world.height);
					this.context.restore();
				}
			}

			// TODO: this is not working on groups (They have no path, add isPointInPath object to draw here)
			this.context.strokeStyle = this.debugColor;
			for (var touchIndex = 0; touchIndex < this.activeTouchPoints.length; touchIndex++) {
				var touchPoint = this.touchPoints[this.activeTouchPoints[touchIndex]];
				if (touchPoint.listenerObjects && touchPoint.listenerObjects.indexOf(object) > -1) {
					this.context.strokeStyle = this.debugTapColor;
					this.context.fillText('Touching', 0, 0);
					break;
				}
			}
			this.context.stroke(object.path.path);

			if (object.body) {
				this.physics.debugDraw(this.context, object.body);
			}
		}
	}

	drawUpdateChildren(parent, alpha, isTouch, isHover) {
		if (parent.children && parent.children.length > 0) {
			for (var childIndex = 0; childIndex < parent.children.length; childIndex++) {
				this.drawUpdate(parent.children[childIndex], alpha, isTouch, isHover);
			}
		}
	}

	dispatchObjectEvent(object, eventName, event) {
		var targetEvent = { ...event };
		targetEvent.target = object;
		object.dispatchEvent(eventName, targetEvent);
	}

	drawUpdate(object, alpha = 1, isTouch = false, isHover = false) {
		this.context.save();
		this.context.translate(object.x, object.y);
		this.context.rotate(object.rotation * radianMultiplier);
		this.context.scale(object.xScale, object.yScale);

		this.dispatchObjectEvent(object, 'enterframe', this.frameEvent);

		object.update(this.frameEvent);

		if (object.isVisible) {
			this.context.globalAlpha = alpha * object.alpha;

			// translate anchors
			this.context.translate(object.internal.anchorOffsetX, object.internal.anchorOffsetY);
			object.draw(this.frameEvent);
			var isTouch = this.touchUpdate(object, isTouch);
			var isHover = this.hoverUpdate(object, isHover);
			this.drawUpdateChildren(object, this.context.globalAlpha, isTouch, isHover);
		}

		this.debugDraw(object);

		this.context.restore();

		this.dispatchObjectEvent(object, 'exitframe', this.frameEvent);
	}

	resizeCanvas(event) {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;

		this.cX = this.canvas.width * 0.5;
		this.cY = this.canvas.height * 0.5;
		this.width = this.canvas.width;
		this.height = this.canvas.height;

		this.context.textBaseline = 'middle';
		this.context.textAlign = 'center';

		var resizeEvent = {
			width: this.canvas.width,
			height: this.canvas.height,
			cX: this.cX,
			cY: this.cY,
		};
		this.dispatchEvent('resize', resizeEvent);
	}

	performWithDelay(delay, listener, iterations = 1) {
		if (!listener || typeof listener != 'function') {
			throw new Error('Invalid listener');
		}

		var timer = {
			delay: delay,
			listener: listener,
			iterations: iterations,
			timeStamp: this.frameEvent.timeStamp,
			executeTime: this.frameEvent.timeStamp + delay,
			remove: false,
		};
		this.timers.push(timer);
		return timer;
	}

	cancelTimer(timer) {
		// TODO: check if is timer?
		if (timer) {
			timer.remove = true;
		}
	}

	newGroup(x, y) {
		var group = new ZetoGroup(this, x, y);
		return this.rootGroup.insert(group, true);
	}

	newCamera(x, y) {
		var camera = new ZetoCamera(this, x, y);
		return this.rootGroup.insert(camera, true);
	}

	newText(options) {
		var textObject = new ZetoTextObject(this, options);
		return this.rootGroup.insert(textObject, true);
	}

	newImage(id, x, y) {
		var fill = this.loadedImages[id];
		if (fill) {
			return this.newImageRect(id, x, y, fill.image.width, fill.image.height);
		} else {
			throw new Error('Image not loaded: ' + id);
		}
	}

	newImageRect(id, x, y, width, height) {
		var fill = this.loadedImages[id];
		if (fill) {
			var width = width ?? fill.image.width;
			var height = height ?? fill.image.height;

			var imageRect = this.newRect(x, y, width, height);
			imageRect.fill = { image: fill.image, sheet: { x: 0, y: 0, width: fill.image.width, height: fill.image.height } };

			return this.rootGroup.insert(imageRect, true);
		} else {
			throw new Error('Image not loaded: ' + id);
		}
	}

	newCircle(x, y, radius) {
		var criclePath = new ZetoPath();
		criclePath.arc(0, 0, radius, 0, 2 * pi, false);

		var circle = new ZetoEngineObject(this, criclePath, x, y);
		return this.rootGroup.insert(circle, true);
	}

	newRoundedRect(x, y, width, height, radius) {
		var roundedRectPath = new ZetoPath();
		roundedRectPath.roundRect(-width * 0.5, -height * 0.5, width, height, radius);

		var roundedRect = new ZetoEngineObject(this, roundedRectPath, x, y);
		return this.rootGroup.insert(roundedRect, true);
	}

	newRect(x, y, width, height) {
		var rectPath = new ZetoPath();
		rectPath.rect(-width * 0.5, -height * 0.5, width, height);

		var rect = new ZetoEngineObject(this, rectPath, x, y);
		return this.rootGroup.insert(rect, true);
	}

	newPolygon(x, y, vertices) {
		var polygonPath = new ZetoPath();
		for (var vertexIndex = 0; vertexIndex < vertices.length; vertexIndex++) {
			var vertex = vertices[vertexIndex];
			if (vertexIndex == 0) {
				polygonPath.moveTo(vertex.x, vertex.y);
			} else {
				polygonPath.lineTo(vertex.x, vertex.y);
			}
		}
		polygonPath.closePath();

		var polygon = new ZetoEngineObject(this, polygonPath, x, y);
		return this.rootGroup.insert(polygon, true);
	}

	newImageSheet(id, sheetData) {
		var frameData = sheetData.frames ?? [];
		var numFrames = frameData.length;
		var imageFill = this.loadedImages[id];

		if (!sheetData.frames) {
			var width = sheetData.width;
			var height = sheetData.height;
			numFrames = sheetData.numFrames;

			var numCols = mathFloor(imageFill.image.width / sheetData.width);
			for (var frame = 0; frame < numFrames; frame++) {
				var col = frame % numCols;
				var row = mathFloor(frame / numCols);

				frameData.push({
					x: col * width,
					y: row * height,
					width: width,
					height: height,
				});
			}
		}

		return {
			image: imageFill.image,
			frameData: frameData,
			numFrames: numFrames,
			sheet: frameData[0], // First frame
		};
	}

	newSprite(imageSheet, sequenceData, x = 0, y = 0) {
		var sprite = new ZetoSprite(this, imageSheet, sequenceData, x, y);
		return this.rootGroup.insert(sprite, true);
	}

	getImageFill(id, pattern, repeat = 'repeat') {
		var fill = this.loadedImages[id];
		if (fill && pattern) {
			return {
				pattern: this.context.createPattern(fill.image, repeat),
				x: fill.image.width * 0.5,
				y: fill.image.height * 0.5,
				xScale: 1,
				yScale: 1,
				rotation: 0,
			};
		} else {
			return fill;
		}
	}

	getData(id) {
		if (this.loadedData[id]) {
			var element = this.loadedData[id];
			return element.data.response;
		}
	}

	remove(object) {
		if (object && object.destroy) {
			object.destroy();
		}
	}

	async playAudio(id, volume = 1, time = 0, loop = false, onComplete = false) {
		var element = this.loadedAudio[id];
		if (element && this.audioContext) {
			var audio = element.audio; // XMLHttpRequest
			if (audio.decoding) {
				return;
			}

			if (!audio.zBuffer) {
				audio.decoding = true;
				try {
					audio.zBuffer = await this.audioContext.decodeAudioData(audio.response);
				} catch (e) {
					// Might not be ready yet (Not interacted with page)
					return;
				}
				audio.decoding = false;
			}

			return new ZetoEngineAudio(this, audio.zBuffer, volume, time, loop, onComplete);
		}
	}

	loadAssets(images, audio, data, onComplete, onProgress) {
		var numAssets = 0;
		numAssets += images ? images.length : 0;
		numAssets += audio ? audio.length : 0;
		numAssets += data ? data.length : 0;

		var loadedFromCache = {
			image: {},
			audio: {},
			data: {},
			unknown: {},
		};

		var numLoaded = 0;
		function assetLoaded(event) {
			var asset = event.target;
			var type = asset.zType ?? 'unknown';

			if (this.loadedIds[type][asset.id]) {
				if (event.type != 'cache-z') {
					if (loadedFromCache[type][asset.id] && loadedFromCache[type][asset.id].filename != asset.filename) {
						console.error('Loading fail - Duplicate ID and different filename' + type + ' ' + asset.id);
					}
				} else {
					this.loadedIds[type][asset.id] = false;
				}
			}

			if (!this.loadedIds[type][asset.id]) {
				this.loadedIds[type][asset.id] = event.type ?? true;
				numLoaded++;

				if (event.type == 'cache-z') {
					loadedFromCache[type][asset.id] = asset;
				}

				if (onProgress) {
					var onProgressEvent = {
						numLoaded: numLoaded,
						numAssets: numAssets,
						loadedId: asset.id,
						progress: numLoaded / numAssets,
						asset: asset,
					};
					onProgress(onProgressEvent);
				}

				if (numLoaded == numAssets) {
					var onCompleteEvent = {
						numLoaded: numLoaded,
					};
					onComplete(onCompleteEvent);
				}
			}
		}

		var assetLoadedBind = assetLoaded.bind(this);

		if (images) {
			images.forEach((element) => {
				if (!this.#checkLoaded(element.id, element.filename, 'image', assetLoadedBind)) {
					element.image = new Image();
					element.image.onload = assetLoadedBind;
					element.image.src = element.filename;
					element.image.id = element.id;
					element.image.zType = 'image'; // Custom property

					this.loadedImages[element.id] = element;
					if (element.image.complete) {
						// Is in cache
						assetLoadedBind({ target: element.image, type: 'cache-z' }); // Avoid dupe warning
					}
				}
			});
		}

		if (audio) {
			audio.forEach((element) => {
				if (!this.#checkLoaded(element.id, element.filename, 'audio', assetLoadedBind)) {
					element.audio = new XMLHttpRequest();
					element.audio.onload = assetLoadedBind;
					element.audio.open('GET', element.filename, true);
					element.audio.responseType = 'arraybuffer';
					element.audio.id = element.id;
					element.audio.send();
					element.audio.zType = 'audio'; // Custom property

					this.loadedAudio[element.id] = element;
				}
			});
		}

		if (data) {
			data.forEach((element) => {
				if (!this.#checkLoaded(element.id, element.filename, 'data', assetLoadedBind)) {
					element.data = new XMLHttpRequest();
					element.data.onload = assetLoadedBind;
					element.data.open('GET', element.filename, true);
					element.data.responseType = 'json';
					element.data.id = element.id;
					element.data.send();
					element.data.zType = 'data'; // Custom property

					this.loadedData[element.id] = element;
				}
			});
		}

		if (numAssets == 0) {
			var onCompleteEvent = {
				numLoaded: 0,
				engine: this,
			};
			onComplete(onCompleteEvent);
		}
	}

	#checkLoaded(id, filename, type, alreadyLoadedListener) {
		var alreadyLoaded = this.loadedIds[type][id];
		if (alreadyLoaded) {
			var loadedElement = type == 'image' ? this.loadedImages[id] : type == 'audio' ? this.loadedAudio[id] : this.loadedData[id];
			if (loadedElement.filename == filename) {
				alreadyLoadedListener({ target: loadedElement[type], type: 'cachez' });
				return true;
			}
			return false;
		}
		return false;
	}

	#generateCallback(after) {
		// Allows for one liner callbacks
		return function (before) {
			return function (event) {
				event.result = before ? before(event) : false;
				return after ? after(event) : false;
			};
		};
	}

	async load(moduleName, params, loadedListener, progressListener) {
		moduleName = moduleName.replace(/\./g, '/');
		const module = await import(`./${moduleName}.js`);
		var createEvent = {
			params: params,
			engine: this,
			complete: this.#generateCallback(loadedListener),
			progress: this.#generateCallback(progressListener),
			phase: 'create',
		};
		module.create(createEvent);
	}

	async unload(moduleName, params, unloadedListener) {
		moduleName = moduleName.replace(/\./g, '/');
		const module = await import(`./${moduleName}.js`);
		var destroyEvent = {
			params: params,
			engine: this,
			complete: unloadedListener,
			phase: 'destroy',
		};
		module.destroy(destroyEvent);
	}

	pause() {
		this.paused = true;
	}

	resume() {
		this.paused = false;
		if (this.hasEventListener('exitframe', this.pauseBind)) {
			this.removeEventListener('exitframe', this.pauseBind);
		}
	}

	step() {
		this.pauseBind = !this.pauseBind ? this.pause.bind(this) : this.pauseBind;

		if (!this.hasEventListener('exitframe', this.pauseBind)) {
			this.addEventListener('exitframe', this.pauseBind);
		}

		this.paused = !this.paused;
	}

	getInfo(property) {
		return this.info[property];
	}

	setFullscreen(value) {
		if (value) {
			if (this.canvas.requestFullscreen) {
				this.canvas.requestFullscreen();
			} else if (this.canvas.webkitRequestFullscreen) {
				this.canvas.webkitRequestFullscreen();
			} else if (this.canvas.msRequestFullscreen) {
				this.canvas.msRequestFullscreen();
			}
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			} else if (document.msExitFullscreen) {
				document.msExitFullscreen();
			}
		}
	}

	#preventDefault(event) {
		event.preventDefault();
	}

	setCanvasLock(value) {
		this.canvasLocked = value;
		if (value) {
			for (var lockIndex = 0; lockIndex < lockCanvasEvents.length; lockIndex++) {
				this.canvas.addEventListener(lockCanvasEvents[lockIndex], this.#preventDefault);
			}
		} else {
			for (var lockIndex = 0; lockIndex < lockCanvasEvents.length; lockIndex++) {
				this.canvas.removeEventListener(lockCanvasEvents[lockIndex], this.#preventDefault);
			}
		}
	}
}

class ZetoEngineAudio {
	bufferSource;
	gainNode;
	onComplete;

	constructor(engine, buffer, volume, time, loop, onComplete) {
		const bufferSource = engine.audioContext.createBufferSource();
		bufferSource.loop = loop;
		bufferSource.buffer = buffer;

		const gainNode = engine.audioContext.createGain();
		gainNode.gain.value = volume;

		bufferSource.connect(gainNode).connect(engine.audioContext.destination);
		bufferSource.onended = this.onended.bind(this);
		bufferSource.start(time);

		this.bufferSource = bufferSource;
		this.gainNode = gainNode;
		this.onComplete = onComplete;
	}

	onended(event) {
		this.bufferSource.stop(0);
		if (this.onComplete) {
			this.onComplete({ target: this });
		}
	}

	pause() {
		this.bufferSource.stop(0);
	}

	resume() {
		this.bufferSource.start(0);
	}

	stop() {
		this.bufferSource.stop(0);
	}

	set volume(volume) {
		this.gainNode.gain.value = volume;
	}

	set pitch(pitch) {
		this.bufferSource.playbackRate.value = pitch;
	}

	get volume() {
		return this.gainNode.gain.value;
	}

	get pitch() {
		return this.bufferSource.playbackRate.value;
	}
}

class ZetoPath {
	// TODO: this is a work in progress and very fragile

	path = new Path2D();

	internal = {
		width: 0,
		height: 0,
		radius: 0,

		xScale: 1,
		yScale: 1,

		setWidth: 0,
		setHeight: 0,
		setRadius: 0,
	};

	x = 0;
	y = 0;
	maxX = 0;
	minX = 0;
	maxY = 0;
	minY = 0;

	top = 0;
	left = 0;

	set width(value) {
		this.internal.setWidth = value;
		this.internal.xScale = value / this.internal.width;
		this.updateBoundsWidth();
	}

	set height(value) {
		this.internal.setHeight = value;
		this.internal.yScale = value / this.internal.height;
		this.updateBoundsHeight();
	}

	set radius(value) {
		this.internal.setRadius = value;
		let scale = value / this.internal.radius;
		this.internal.xScale = scale;
		this.internal.yScale = scale;
		this.updateBoundsRadius();
	}

	get width() {
		return this.internal.setWidth;
	}

	get height() {
		return this.internal.setHeight;
	}

	get radius() {
		return this.internal.setRadius;
	}

	rect(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.internal.width = width;
		this.internal.height = height;

		this.internal.setWidth = width;
		this.internal.setHeight = height;

		this.updateBoundsWidth();
		this.updateBoundsHeight();

		return this.path.rect(x, y, width, height);
	}

	roundRect(x, y, width, height, radius) {
		this.x = x;
		this.y = y;
		this.internal.width = width;
		this.internal.height = height;
		this.internal.radius = radius;

		this.internal.setWidth = width;
		this.internal.setHeight = height;
		this.internal.setRadius = radius;

		this.updateBoundsWidth();
		this.updateBoundsHeight();

		return this.path.roundRect(x, y, width, height, radius);
	}

	moveTo(x, y) {
		this.x = x;
		this.y = y;

		this.updateBoundsLine();

		return this.path.moveTo(x, y);
	}

	lineTo(x, y) {
		this.x = x;
		this.y = y;

		this.updateBoundsLine();

		return this.path.lineTo(x, y);
	}

	closePath() {
		return this.path.closePath();
	}

	arc(x, y, radius, startAngle, endAngle, anticlockwise) {
		this.x = x;
		this.y = y;
		this.internal.radius = radius;

		this.updateBoundsRadius();

		return this.path.arc(x, y, radius, startAngle, endAngle, anticlockwise);
	}

	updateBoundsWidth() {
		var halfWidth = this.internal.setWidth * 0.5;
		this.left = -halfWidth;
		this.maxX = this.x + halfWidth > this.maxX ? this.x + halfWidth : this.maxX;
		this.minX = this.x - halfWidth < this.minX ? this.x - halfWidth : this.minX;
	}

	updateBoundsHeight() {
		var halfHeight = this.internal.setHeight * 0.5;
		this.top = -halfHeight;
		this.maxY = this.y + halfHeight > this.maxY ? this.y + halfHeight : this.maxY;
		this.minY = this.y - halfHeight < this.minY ? this.y - halfHeight : this.minY;
	}

	updateBoundsRadius() {
		this.maxX = this.x + this.internal.radius > this.maxX ? this.x + this.internal.radius : this.maxX;
		this.minX = this.x - this.internal.radius < this.minX ? this.x - this.internal.radius : this.minX;
		this.maxY = this.y + this.internal.radius > this.maxY ? this.y + this.internal.radius : this.maxY;
		this.minY = this.y - this.internal.radius < this.minY ? this.y - this.internal.radius : this.minY;

		this.left = this.minX;
		this.top = this.minY;
	}

	updateBoundsLine() {
		this.maxX = this.x > this.maxX ? this.x : this.maxX;
		this.minX = this.x < this.minX ? this.x : this.minX;
		this.maxY = this.y > this.maxY ? this.y : this.maxY;
		this.minY = this.y < this.minY ? this.y : this.minY;

		this.left = this.minX;
		this.top = this.minY;

		this.internal.width = this.maxX - this.minX;
		this.internal.height = this.maxY - this.minY;
		this.internal.setWidth = this.internal.width;
		this.internal.setHeight = this.internal.height;
	}
}
///////////////////////////////////////////// Particles
class ZetoParticleEngine extends ZetoEventObject {
	static particleTypeGravity = 0;
	static particleTypeRadial = 1;

	engine;

	emitters = [];

	constructor(engine) {
		super();

		this.engine = engine;
	}

	normalize(point, scale) {
		// var magnitude = mathSqrt((point.x * point.x) + (point.y * point.y));
		// TODO check if this is faster than mathSqrt (It should be) visually i can't see a difference
		var magnitude = mathAbs(point.x) + mathAbs(point.y);
		if (magnitude != 0) {
			return {
				x: (scale * point.x) / magnitude,
				y: (scale * point.y) / magnitude,
			};
		} else {
			return {
				x: 0,
				y: 0,
			};
		}
	}

	update(event) {
		var delta = event.delta * 0.001;
		if (this.emitters.length > 0) {
			for (var emitterIndex = 0; emitterIndex < this.emitters.length; emitterIndex++) {
				var emitter = this.emitters[emitterIndex];

				if (emitter.state != 'paused') {
					if (emitter.active && emitter.emissionRate > 0) {
						var rate = 1.0 / emitter.emissionRate;

						if (emitter.particles.length < emitter.maxParticles) {
							emitter.emitCounter += delta;
						}

						while (emitter.particles.length < emitter.maxParticles && emitter.emitCounter > rate) {
							this.addParticle(emitter);
							emitter.emitCounter -= rate;
						}

						emitter.elapsedTime += delta;

						if (emitter.duration != -1 && emitter.duration < emitter.elapsedTime) {
							this.stopParticleEmitter(emitter);
						}
					}

					for (var particleIndex = emitter.particles.length - 1; particleIndex >= 0; particleIndex--) {
						var particle = emitter.particles[particleIndex];

						particle.timeToLive -= delta;
						if (particle.timeToLive > 0) {
							this.updateParticle(emitter, particle, delta);
						} else {
							this.removeParticleAtIndex(emitter, particleIndex);

							if (emitter.particles.length <= 0 && emitter.duration != -1) {
								this.removeEmitter({ target: emitter });
								return;
							}
						}
					}
				}
			}
		}
	}

	initParticle(emitter, particle) {
		particle.position.x = emitter.sourcePositionx + emitter.sourcePositionVariancex * randomSideFloat();
		particle.position.y = emitter.sourcePositiony + emitter.sourcePositionVariancey * randomSideFloat();
		particle.startPos.x = emitter.sourcePositionx;
		particle.startPos.y = emitter.sourcePositiony;

		if (particle.image.parent != emitter) {
			var relativeX = 0;
			var relativeY = 0;
			var parent = emitter;

			// TODO: this does not work if the emitter and absolute parent are not in the same branch
			// TODO: implement localToContent and contentToLocal funcs, should fix this
			// maybe with contet.getTransform? Needs to be fast
			while (parent && parent != particle.image.parent) {
				var parentRotation = parent.rotation * radianMultiplier;
				var cos = mathCos(parentRotation);
				var sin = mathSin(parentRotation);
				var rotatedX = relativeX * cos - relativeY * sin;
				var rotatedY = relativeX * sin + relativeY * cos;

				relativeX = rotatedX + parent.x;
				relativeY = rotatedY + parent.y;

				parent = parent.parent;
			}

			particle.position.x += relativeX;
			particle.position.y += relativeY;

			particle.image.toBack();
		}

		var newAngle = (emitter.angle + emitter.angleVariance * randomSideFloat()) * radianMultiplier;

		var vector = {
			x: mathCos(newAngle),
			y: mathSin(newAngle),
		};

		var vectorSpeed = emitter.speed + emitter.speedVariance * randomSideFloat();

		particle.direction = {
			x: vector.x * vectorSpeed,
			y: vector.y * vectorSpeed,
		};

		var timeToLive = emitter.particleLifespan + emitter.particleLifespanVariance * randomSideFloat();
		particle.timeToLive = timeToLive > 0 ? timeToLive : 0;

		particle.radius = emitter.maxRadius + emitter.maxRadiusVariance * randomSideFloat();
		particle.radiusDelta = (particle.radius - emitter.maxRadius) / particle.timeToLive;
		particle.angle = (emitter.angle + emitter.angleVariance * randomSideFloat()) * radianMultiplier;
		particle.degreesPerSecond = (emitter.rotatePerSecond + emitter.rotatePerSecondVariance * randomSideFloat()) * radianMultiplier;

		particle.radialAcceleration = emitter.radialAcceleration + emitter.radialAccelVariance * randomSideFloat();
		particle.tangentialAcceleration = emitter.tangentialAcceleration + emitter.tangentialAccelVariance * randomSideFloat();

		var particleStartSize = emitter.startParticleSize + emitter.startParticleSizeVariance * randomSideFloat();
		var particleFinishSize = emitter.finishParticleSize + emitter.finishParticleSizeVariance * randomSideFloat();
		particle.particleSizeDelta = (particleFinishSize - particleStartSize) / particle.timeToLive;
		particle.particleSize = particleStartSize > 0 ? particleStartSize : 0;

		var startRotation = emitter.rotationStart + emitter.rotationStartVariance * randomSideFloat();
		var endRotation = emitter.rotationEnd + emitter.rotationEndVariance * randomSideFloat();
		particle.rotation = startRotation;
		particle.rotationDelta = (endRotation - startRotation) / particle.timeToLive;

		particle.alpha = emitter.startColorAlpha + emitter.startColorVarianceAlpha * randomSideFloat();
		var endAlpha = emitter.finishColorAlpha + emitter.finishColorVarianceAlpha * randomSideFloat();
		particle.deltaAlpha = (endAlpha - particle.alpha) / particle.timeToLive;

		particle.image.x = particle.position.x;
		particle.image.y = particle.position.y;
		particle.image.rotation = particle.rotation;
		particle.image.width = particle.particleSize;
		particle.image.height = particle.particleSize;
		particle.image.alpha = particle.alpha;
		particle.image.isVisible = true;
	}

	addParticle(emitter) {
		if (emitter.particles.length == emitter.maxParticles) {
			return false;
		}

		var particle = new ZetoParticle(emitter);
		emitter.particles.push(particle);
		this.initParticle(emitter, particle);

		return true;
	}

	stopParticleEmitter(emitter) {
		emitter.active = false;
		emitter.elapsedTime = 0;
		emitter.emitCounter = 0;

		emitter.state = 'stopped';
	}

	updateParticle(emitter, particle, delta) {
		if (emitter.emitterType == ParticleEngine.particleTypeRadial) {
			particle.angle += particle.degreesPerSecond * delta;
			particle.radius += particle.radiusDelta * delta;

			particle.position.x = -mathCos(particle.angle) * particle.radius;
			particle.position.y = -mathSin(particle.angle) * particle.radius;
		} else {
			var radial = this.normalize(particle.position, 1);
			var tangential = {
				x: radial.x,
				y: radial.y,
			};

			radial.x = radial.x * particle.radialAcceleration;
			radial.y = radial.y * particle.radialAcceleration;

			var newy = tangential.x;
			tangential.x = -tangential.y;
			tangential.y = newy;
			tangential.x = tangential.x * particle.tangentialAcceleration;
			tangential.y = tangential.y * particle.tangentialAcceleration;

			var tmp = {
				x: radial.x + tangential.x + emitter.gravityx,
				y: radial.y + tangential.y + emitter.gravityy,
			};

			tmp.x = tmp.x * delta;
			tmp.y = tmp.y * delta;

			particle.direction.x = particle.direction.x + tmp.x;
			particle.direction.y = particle.direction.y + tmp.y;

			tmp.x = particle.direction.x * delta;
			tmp.y = particle.direction.y * delta;

			particle.position.x = particle.position.x + tmp.x;
			particle.position.y = particle.position.y + tmp.y;
		}

		particle.alpha = particle.alpha + particle.deltaAlpha * delta;

		particle.particleSize = particle.particleSize + particle.particleSizeDelta * delta;
		particle.particleSize = particle.particleSize > 0 ? particle.particleSize : 0;

		particle.rotation = particle.rotation + particle.rotationDelta * delta;

		particle.image.x = particle.position.x;
		particle.image.y = particle.position.y;
		particle.image.rotation = particle.rotation;
		particle.image.width = particle.particleSize;
		particle.image.height = particle.particleSize;
		particle.image.alpha = particle.alpha;
	}

	removeParticleAtIndex(emitter, index) {
		var particle = emitter.particles[index];
		this.engine.remove(particle.image);
		emitter.particles.splice(index, 1);
	}

	removeEmitter(event) {
		var emitter = event.target;
		var emitterIndex = this.emitters.indexOf(emitter);
		if (emitterIndex != -1) {
			this.emitters.splice(emitterIndex, 1);
		}
		this.engine.remove(emitter);
	}

	newEmitter(emitterParams) {
		var emitter = new ZetoEmitter(this.engine, emitterParams);
		this.emitters.push(emitter);
		return this.engine.rootGroup.insert(emitter, true);
	}
}

class ZetoParticle {
	image;

	position = {
		x: 0,
		y: 0,
	};
	direction = {
		x: 0,
		y: 0,
	};
	startPos = {
		x: 0,
		y: 0,
	};

	startAlpha = 0;
	endAlpha = 0;
	deltaAlpha = 0;

	rotation = 0;
	rotationDelta = 0;
	radialAcceleration = 0;
	tangentialAcceleration = 0;
	radius = 0;
	radiusDelta = 0;
	angle = 0;
	degreesPerSecond = 0;
	particleSize = 0;
	particleSizeDelta = 0;
	timeToLive = 0;

	constructor(emitter) {
		var engine = emitter.engine;
		this.image = engine.newImage(emitter.texture.id, 0, 0); // TODO: extend EngineObject and implement own draw() function
		this.image.isVisible = false;

		var parent = emitter;
		if (emitter.absolutePosition == true) {
			parent = emitter.parent;
		} else if (isGroup(emitter.absolutePosition)) {
			parent = emitter.absolutePosition;
		}
		parent.insert(this.image, true);
	}
}

class ZetoEmitter extends ZetoGroup {
	particleEngine;

	emitterType = ParticleEngine.particleTypeGravity;

	texture;

	sourcePositionx = 0;
	sourcePositiony = 0;

	sourcePositionVariancex = 0;
	sourcePositionVariancey = 0;

	speed = 0;
	speedVariance = 0;
	particleLifespan = 0;
	particleLifespanVariance = 0;
	angle = 0;
	angleVariance = 0;

	gravityx = 0;
	gravityy = 0;

	radialAcceleration = 0;
	radialAccelVariance = 0;
	tangentialAcceleration = 0;
	tangentialAccelVariance = 0;

	startColorAlpha = 0;
	startColorVarianceAlpha = 0;
	finishColorAlpha = 0;
	finishColorVarianceAlpha = 0;

	// TODO: implement colors (On hold until webgl & shaders are implemented)

	maxParticles = 0;
	startParticleSize = 0;
	startParticleSizeVariance = 0;
	finishParticleSize = 0;
	finishParticleSizeVariance = 0;
	duration = 0;
	blendFuncSource = 0;
	blendFuncDestination = 0;

	maxRadius = 0;
	maxRadiusVariance = 0;
	minRadius = 0;
	minRadiusVariance = 0;
	rotatePerSecond = 0;
	rotatePerSecondVariance = 0;
	rotationStart = 0;
	rotationStartVariance = 0;
	rotationEnd = 0;
	rotationEndVariance = 0;

	emissionRate = 0;
	emitCounter = 0;

	active = true;
	elapsedTime = 0;

	absolute = false;
	particles = [];

	state = 'playing';

	constructor(engine, emitterParams) {
		super(engine, emitterParams.x, emitterParams.y);

		this.particleEngine = engine.particles;
		this.texture = engine.getImageFill(emitterParams.configName);

		for (var key in emitterParams) {
			this[key] = emitterParams[key];
		}

		this.emissionRate = this.maxParticles / this.particleLifespan;
	}

	start() {
		this.state = 'playing';
		this.active = true;
	}

	stop() {
		this.active = false;
		this.elapsedTime = 0;
		this.emitCounter = 0;

		this.state = 'stopped';
	}

	pause() {
		this.state = 'paused';
	}
}
///////////////////////////////////////////// Transitions
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

class Easing extends ZetoEasing {}

class ZetoTransitionEngine extends ZetoEventObject {
	engine;
	transitions = [];

	constructor(engine) {
		super();

		this.engine = engine;
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
					if (transition.onStart != null) {
						transition.onStart(transition.target);
					}
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

				if (transition.onComplete != null) {
					transition.onComplete(transition.target);
				}

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
///////////////////////////////////////////// Physics
class ZetoPhysicsEngine extends ZetoEventObject {
	paused = true;

	debugColor = '#FF880022';

	matterEngine;
	matterWorld;
	engine;
	bodies = [];

	maxDelta = 1000 / 30;

	listeners = {
		collision: [],
	};

	constructor(engine) {
		super();

		this.engine = engine;
		try {
			this.matterEngine = mEngine.create({
				positionIterations: 2,
				velocityIterations: 2,
				constraintIterations: 1,
			});
			this.matterWorld = this.matterEngine.world;

			this.collisionBind = this.collision.bind(this);
			mEvents.on(this.matterEngine, 'collisionStart', this.collisionBind);
			mEvents.on(this.matterEngine, 'collisionEnd', this.collisionBind);
		} catch (error) {
			console.warn('Matter.js not found, physics engine is disabled');
		}
	}

	collision(event) {
		var pairs = event.pairs;
		for (var index = 0; index < pairs.length; index++) {
			var pair = pairs[index];

			var matterBodyA = pair.bodyA;
			var matterBodyB = pair.bodyB;

			var bodyA = matterBodyA.zBody;
			var bodyB = matterBodyB.zBody;

			var phase = event.name == 'collisionStart' ? began : end;

			if (bodyA.hasEventListener('collision')) {
				bodyA.dispatchEvent('collision', { phase: phase, target: bodyA, other: bodyB, collision: pair.collision });
			}
			if (bodyB.hasEventListener('collision')) {
				bodyB.dispatchEvent('collision', { phase: phase, target: bodyB, other: bodyA, collision: pair.collision });
			}
			this.dispatchEvent('collision', { phase: phase, target: bodyA, other: bodyB, collision: pair.collision });
		}
	}

	update(event) {
		if (this.paused) {
			return;
		}

		for (var bodyIndex = 0; bodyIndex < this.bodies.length; bodyIndex++) {
			var body = this.bodies[bodyIndex];
			body.update(event);
		}

		var delta = event.delta > this.maxDelta ? this.maxDelta : event.delta; // Prevent huge physics jumps/tunnelings
		mEngine.update(this.matterEngine, delta);
	}

	debugDraw(context, body) {
		// This is the last draw call, so we can safely change the context and not worry about restoring it
		context.scale(body.object.internal.xScaleInverse, body.object.internal.yScaleInverse);
		context.lineWidth = 1;
		context.fillStyle = body.debugColor ?? this.debugColor;
		// TODO: missing path scale
		context.fill(body.path.path);
	}

	addBody(object, bodyType, options) {
		object.body = new ZetoPhysicsBody(this, object, bodyType, options);
		mComposite.add(this.matterWorld, object.body.matterBody);
		this.bodies.push(object.body);
	}

	setGravity(x, y) {
		this.matterEngine.gravity.x = x;
		this.matterEngine.gravity.y = y;
	}

	start() {
		this.paused = false;
	}

	pause() {
		this.paused = true;
	}

	stop() {
		this.paused = true;
	}
}

class ZetoPhysicsBody extends ZetoEventObject {
	bodyType = 'dynamic';
	shapeType;

	listeners = {
		collision: [],
	};

	internal = {
		offsetX: 0,
		offsetY: 0,
	};

	path;
	radius;

	object;
	physics;
	engine;

	matterBody;

	constructor(physicsEngine, object, bodyType, options = {}) {
		super();

		this.object = object;
		this.engine = object.engine;
		this.physics = physicsEngine;
		this.bodyType = bodyType;

		this.createMatterBody(options);
		this.createPath();

		this.matterBody.isSensor = options.isSensor ?? false;

		this.object.addEventListener('finalize', this.finalize.bind(this));
	}

	get fixedRotation() {
		return this.matterBody.inertia == Infinity;
	}

	set fixedRotation(value) {
		this.matterBody.inertia = value ? Infinity : this.matterBody.inertia;
	}

	set x(value) {
		mBody.setPosition(this.matterBody, { x: value, y: this.matterBody.position.y }, true);
	}

	get x() {
		return this.matterBody.position.x;
	}

	set y(value) {
		mBody.setPosition(this.matterBody, { x: this.matterBody.position.x, y: value }, true);
	}

	get y() {
		return this.matterBody.position.y;
	}

	set rotation(value) {
		mBody.setAngle(this.matterBody, value * radianMultiplier);
	}

	get rotation() {
		return this.matterBody.angle * degreeMultiplier;
	}

	set isSensor(value) {
		this.matterBody.isSensor = value;
	}

	get isSensor() {
		return this.matterBody.isSensor;
	}

	createPath() {
		var vertices = this.matterBody.vertices;
		this.path = new ZetoPath();
		for (var vertexIndex = 0; vertexIndex < vertices.length; vertexIndex++) {
			var vertex = vertices[vertexIndex];
			this.path.lineTo(vertex.x - this.object.x, vertex.y - this.object.y);
		}
		this.path.closePath();
	}

	createMatterBody(options = {}) {
		var radius = options.radius ?? false;
		var shape = options.shape ?? false;
		var resolution = options.resolution ?? 10;
		var collisionFilter = options.filter ?? {
			category: 1,
			mask: 1,
			group: 0,
		};

		var isStatic = this.bodyType == 'static';

		this.radius = radius;

		var bodyOptions = {
			isStatic: isStatic,
			density: this.density ?? 1,
			restitution: options.bounce ?? 0.1,
			friction: options.friction ?? 0.1,
			angle: this.object.rotation * radianMultiplier,
		};

		if (shape) {
			this.shapeType = 'polygon';
			this.matterBody = mBodies.fromVertices(0, 0, shape, bodyOptions);
			var centre = mVertices.centre(shape);
			// resulting vertices are reorientated about their centre of mass, offset using centre
			mBody.translate(this.matterBody, { x: this.object.x + centre.x, y: this.object.y + centre.y });
			this.internal.offsetX = -centre.x; // Wtf Matter-JS, so counter intuitive
			this.internal.offsetY = -centre.y; // Lucky I'm a genius
		} else if (radius) {
			this.shapeType = 'circle';
			this.matterBody = mBodies.circle(this.object.x, this.object.y, radius, bodyOptions, resolution);
		} else {
			this.shapeType = 'box';
			this.matterBody = mBodies.rectangle(this.object.x, this.object.y, this.object.width, this.object.height, bodyOptions);
		}

		this.matterBody.collisionFilter = collisionFilter;
		this.matterBody.zBody = this; // Custom property
		mBody.scale(this.matterBody, this.object.xScale, this.object.yScale);
	}

	update(event) {
		this.object.x = this.matterBody.position.x + this.internal.offsetX;
		this.object.y = this.matterBody.position.y + this.internal.offsetY;
		this.object.rotation = (this.matterBody.angle * degreeMultiplier) % 360;
	}

	applyForce(x, y) {
		mBody.applyForce(this.matterBody, this.matterBody.position, { x: x, y: y });
	}

	setLinearVelocity(x, y) {
		mBody.setVelocity(this.matterBody, { x: x, y: y });
	}

	applyTorque(torque) {
		this.matterBody.torque = torque;
	}

	getAngularVelocity() {
		return this.matterBody.angularVelocity;
	}

	setAngularVelocity(angularVelocity) {
		mBody.setAngularVelocity(this.matterBody, angularVelocity);
	}

	setMass(mass) {
		mBody.setMass(this.matterBody, mass);
	}

	getMass() {
		return this.matterBody.mass;
	}

	finalize(event) {
		mComposite.remove(this.physics.matterWorld, this.matterBody);
	}
}
///////////////////////////////////////////// Testing
class ZetoTestingEngine {
	engine;
	physics;

	assertCount;
	disabled = false;
	filter = false;

	constructor(options = {}) {
		if (options.disabled) {
			this.disabled = true;
			return;
		}
		this.filter = options.filter ?? false;
		this.engine = new ZetoEngine();
		this.physics = this.engine.physics;

		this.engine.paused = true;
	}

	test(name, testCase) {
		if (this.disabled) {
			return;
		}

		if (this.filter && name.indexOf(this.filter) == -1) {
			return;
		}

		this.assertCount = 0;
		try {
			testCase();
			console.log('Test passed: ' + name + ' (' + this.assertCount + ' assertions)');
		} catch (error) {
			console.error('Test failed: ' + name, error);
		}
	}

	assert(what, value, message) {
		this.assertCount++;
		if (what != value) {
			throw new Error('Error asserting that ' + what + ' equals ' + value + ', checking ' + message);
		}
	}
}

// var unit = new ZetoTestingEngine({ disabled: disableTests, filter: ['test_example'] });

// unit.test('test_example', () => {
// 	unit.assert(true, true, 'test');
// });
