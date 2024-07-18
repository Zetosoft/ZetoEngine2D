import { ZetoEventObject } from './ZetoEventObject.js';
import { ZetoPath } from './ZetoPath.js';
import { mathCos, mathSin, radianMultiplier, mBody } from './constants.js';

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

	worldTransform = new DOMMatrix();

	fillColor;
	alpha = 1;
	isVisible = true;

	parent;

	internal = {
		x: 0,
		y: 0,

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

	get x() {
		return this.internal.x;
	}

	get y() {
		return this.internal.y;
	}

	set x(value) {
		var diff = value - this.internal.x;
		this.internal.x = value;
		this.worldTransform.translateSelf(diff, 0);
	}

	set y(value) {
		var diff = value - this.internal.y;
		this.internal.y = value;
		this.worldTransform.translateSelf(0, diff);
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
		var newOffset = (value - 0.5) * this.bounds.local.width;
		if (this.body) {
			var offsetDiff = newOffset + this.internal.anchorOffsetX;
			mBody.translate(this.body.matterBody, { x: -offsetDiff, y: 0 });
			this.body.internal.offsetX += offsetDiff;
		}
		this.internal.anchorOffsetX = -newOffset;
	}

	set anchorY(value) {
		this.internal.anchorY = value;
		var newOffset = (value - 0.5) * this.bounds.local.height;
		if (this.body) {
			var offsetDiff = newOffset + this.internal.anchorOffsetY;
			mBody.translate(this.body.matterBody, { x: 0, y: -offsetDiff });
			this.body.internal.offsetY += offsetDiff;
		}
		this.internal.anchorOffsetY = -newOffset;
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

	draw(context, event) {
		var fill = this.internal.fill;
		var path = this.path;

		if (fill) {
			if (fill.pattern) {
				context.fillStyle = fill.pattern;
				context.scale(path.internal.xScale, path.internal.yScale);
				context.fill(path.path);
			} else if (fill.image) {
				var sheet = fill.sheet;
				context.drawImage(fill.image, sheet.x, sheet.y, sheet.width, sheet.height, path.left, path.top, path.width, path.height);
			} else {
				// Shapes
				context.fillStyle = this.fillColor;
				context.scale(path.internal.xScale, path.internal.yScale);
				context.fill(path.path);
			}
		} else {
			context.fillStyle = this.fillColor;
		}

		if (this.strokeWidth > 0) {
			context.lineWidth = this.strokeWidth;
			context.strokeStyle = this.stroke;
			context.stroke(path.path);
		}

		return context;
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

	localToContent(x, y) {
		const contentX = this.worldTransform.a * x + this.worldTransform.c * y + this.worldTransform.e;
		const contentY = this.worldTransform.b * x + this.worldTransform.d * y + this.worldTransform.f;
		return { x: contentX, y: contentY };
	}

	contentToLocal(x, y) {
		const inverseMatrix = this.worldTransform.inverse();
		const localX = inverseMatrix.a * x + inverseMatrix.c * y + inverseMatrix.e;
		const localY = inverseMatrix.b * x + inverseMatrix.d * y + inverseMatrix.f;
		return { x: localX, y: localY };
	}
}

export { ZetoEngineObject };