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

export { ZetoPath };