class ZetoPath {
	// TODO: this is a work in progress and very fragile

	path = new Path2D();

	internal = {
		width: 0,
		height: 0,
		radius: 0,

		xScale: 1,
		yScale: 1,
		radiusScale: 1,

		setWidth: 0,
		setHeight: 0,
		setRadius: 0,

		shapeType: null,
		shapeLocked: false,
		shapeHistory: [],
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

		this.#recreatePath();
		this.updateBoundsWidth();
	}

	set height(value) {
		this.internal.setHeight = value;
		this.internal.yScale = value / this.internal.height;

		this.#recreatePath();
		this.updateBoundsHeight();
	}

	set radius(value) {
		this.internal.setRadius = value;
		this.internal.radiusScale = value / this.internal.radius;

		this.#recreatePath();
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
		if (this.internal.shapeLocked) {
			throw new Error('ZetoPath: Shape has already been set.');
		}
		this.internal.shapeType = 'rect';
		this.internal.shapeLocked = true;
		this.internal.shapeHistory.push({ type: 'rect', x: x, y: y, width: width, height: height });

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
		if (this.internal.shapeLocked) {
			throw new Error('ZetoPath: Shape has already been set.');
		}
		this.internal.shapeType = 'roundRect';
		this.internal.shapeLocked = true;
		this.internal.shapeHistory.push({ type: 'roundRect', x: x, y: y, width: width, height: height, radius: radius });

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
		if (this.internal.shapeLocked || (this.internal.shapeType && this.internal.shapeType != 'line')) {
			throw new Error('ZetoPath: Shape has already been set.');
		}
		this.internal.shapeType = 'line';
		this.internal.shapeHistory.push({ type: 'move', x: x, y: y });

		this.x = x;
		this.y = y;

		this.updateBoundsLine();

		return this.path.moveTo(x, y);
	}

	lineTo(x, y) {
		if (this.internal.shapeLocked || (this.internal.shapeType && this.internal.shapeType != 'line')) {
			throw new Error('ZetoPath: Shape has already been set.');
		}
		this.internal.shapeType = 'line';
		this.internal.shapeHistory.push({ type: 'line', x: x, y: y });

		this.x = x;
		this.y = y;

		this.updateBoundsLine();

		return this.path.lineTo(x, y);
	}

	closePath() {
		if (this.internal.shapeLocked || (this.internal.shapeType && this.internal.shapeType != 'line')) {
			throw new Error('ZetoPath: Shape has already been set.');
		}
		this.internal.shapeType = 'line';
		this.internal.shapeLocked = true;
		this.internal.shapeHistory.push({ type: 'close' });

		return this.path.closePath();
	}

	arc(x, y, radius, startAngle, endAngle, anticlockwise) {
		if (this.internal.shapeLocked) {
			throw new Error('ZetoPath: Shape has already been set.');
		}
		this.internal.shapeType = 'arc';
		this.internal.shapeLocked = true;
		this.internal.shapeHistory.push({ type: 'arc', x: x, y: y, radius: radius, startAngle: startAngle, endAngle: endAngle, anticlockwise: anticlockwise });

		this.x = x;
		this.y = y;
		this.internal.radius = radius;
		this.internal.setRadius = radius;

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

	#recreatePath() {
		this.path = new Path2D();

		let xScale = this.internal.xScale;
		let yScale = this.internal.yScale;
		let radiusScale = this.internal.radiusScale;

		for (let index = 0; index < this.internal.shapeHistory.length; index++) {
			let shapeInstruction = this.internal.shapeHistory[index];

			let x = shapeInstruction.x * xScale;
			let y = shapeInstruction.y * yScale;
			let width = shapeInstruction.width * xScale;
			let height = shapeInstruction.height * yScale;

			let radius = shapeInstruction.radius * radiusScale;

			switch (shapeInstruction.type) {
				case 'rect':
					this.path.rect(x, y, width, height);
					break;
				case 'roundRect':
					this.path.roundRect(x, y, width, height, radius);
					break;
				case 'move':
					this.path.moveTo(x, y);
					break;
				case 'line':
					this.path.lineTo(x, y);
					break;
				case 'close':
					this.path.closePath();
					break;
				case 'arc':
					let startAngle = shapeInstruction.startAngle;
					let endAngle = shapeInstruction.endAngle;
					let anticlockwise = shapeInstruction.anticlockwise;

					this.path.arc(x, y, radius, startAngle, endAngle, anticlockwise);
					break;
			}
		}
	}
}

export { ZetoPath };
