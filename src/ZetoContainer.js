import { ZetoEngineObject } from './ZetoEngineObject.js';
import { ZetoGroup } from './ZetoGroup.js';
import { ZetoPath } from './ZetoPath.js';

class ZetoContainer extends ZetoEngineObject {
	view;
	anchorChildren = true;

	get children() {
		return [this.view];
	}

	constructor(engine, x = 0, y = 0, width = 0, height = 0) {
		super(engine, null, x, y);

		this.fill = new ZetoPath();
		this.fill.rect(-width * 0.5, -height * 0.5, width, height);
		this.fillColor = '#00000000';

		this.calculatePath();
		this.updateBounds();

		this.view = new ZetoGroup(engine, 0, 0);
		this.view.parent = this;
	}

	set width(value) {
		super.width = value;
		this.updateBounds();
	}

	get width() {
		return super.width;
	}

	set height(value) {
		super.height = value;
		this.updateBounds();
	}

	get height() {
		return super.height;
	}

	set anchorX(value) {
		var previousOffsetX = this.internal.anchorOffsetX;
		super.anchorX = value;

		if (!this.anchorChildren && this.view) {
			this.view.x += previousOffsetX - this.internal.anchorOffsetX;
		}
	}

	get anchorX() {
		return super.anchorX;
	}

	set anchorY(value) {
		var previousOffsetY = this.internal.anchorOffsetY;
		super.anchorY = value;

		if (!this.anchorChildren && this.view) {
			this.view.y += previousOffsetY - this.internal.anchorOffsetY;
		}
	}

	get anchorY() {
		return super.anchorY;
	}

	insert(childObject, skipBoundsUpdate = false) {
		return this.view.insert(childObject, skipBoundsUpdate);
	}

	removeAll() {
		this.view.removeAll();
	}

	draw(context, event) {
		super.draw(context, event);

		context.restore();
		context.save();

		context.beginPath();
		context.rect(-this.width * 0.5, -this.height * 0.5, this.width, this.height);
		context.clip();

		return context;
	}
}

export { ZetoContainer };