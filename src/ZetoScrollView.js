import { ZetoWidget } from './ZetoWidget.js';
import { mathMax, mathMin, mathFloor, began, hold, moved, ended } from './constants.js';

class ZetoScrollView extends ZetoWidget {
	holding = false;

	container;
	background;

	horizontalScrollDisabled;
	verticalScrollDisabled;

	scrollRange = {
		minX: -Number.MAX_VALUE,
		maxX: Number.MAX_VALUE,
		minY: Number.MAX_VALUE,
		maxY: -Number.MAX_VALUE,
	};

	values = {
		scrollWidth: null,
		scrollHeight: null,
		scrollOffsetX: null,
		scrollOffsetY: null,
	};

	constructor(engine, options = {}) {
		super(engine, options.x, options.y);

		this.background = engine.newRect(0, 0, options.width, options.height);
		this.background.fillColor = options.fillColor ?? '#00000000';
		this.background.addEventListener('touch', this.#onTouch.bind(this));
		this.insert(this.background);

		this.container = engine.newContainer(0, 0, options.width, options.height);
		this.insert(this.container);

		this.horizontalScrollDisabled = options.horizontalScrollDisabled ?? false;
		this.verticalScrollDisabled = options.verticalScrollDisabled ?? false;

		this.values.scrollWidth = options.scrollWidth ?? null;
		this.values.scrollHeight = options.scrollHeight ?? null;
		this.values.scrollOffsetX = options.scrollOffsetX ?? null;
		this.values.scrollOffsetY = options.scrollOffsetY ?? null;

		this.#updateScrollRange();

		this.container.view.x = options.scrollX ?? 0;
		this.container.view.y = options.scrollY ?? 0;

		this.insert = this.#insert;
		this.removeAll = this.#removeAll;
	}

	get width() {
		return this.background.width;
	}

	set width(value) {
		this.background.width = value;
		this.container.width = value;
	}

	get height() {
		return this.background.height;
	}

	set height(value) {
		this.background.height = value;
		this.container.height = value;
	}

	set scrollX(value) {
		this.container.view.x = value;
	}

	get scrollX() {
		return this.container.view.x;
	}

	set scrollY(value) {
		this.container.view.y = value;
	}

	get scrollY() {
		return this.container.view.y;
	}

	set scrollWidth(value) {
		this.values.scrollWidth = value;
		this.#updateScrollRange();
	}

	get scrollWidth() {
		return this.values.scrollWidth;
	}

	set scrollHeight(value) {
		this.values.scrollHeight = value;
		this.#updateScrollRange();
	}

	get scrollHeight() {
		return this.values.scrollHeight;
	}

	set scrollOffsetX(value) {
		this.values.scrollOffsetX = value;
		this.#updateScrollRange();
	}

	get scrollOffsetX() {
		return this.values.scrollOffsetX;
	}

	set scrollOffsetY(value) {
		this.values.scrollOffsetY = value;
		this.#updateScrollRange();
	}

	get scrollOffsetY() {
		return this.values.scrollOffsetY;
	}

	#updateScrollRange() {
		if (this.values.scrollOffsetX != null) {
			this.scrollRange.minX = this.values.scrollOffsetX;
			this.scrollRange.maxX = this.values.scrollWidth ? this.values.scrollOffsetX + this.values.scrollWidth : Number.MAX_VALUE;
		} else if (this.values.scrollWidth != null) {
			this.scrollRange.minX = 0;
			this.scrollRange.maxX = this.values.scrollWidth ?? Number.MAX_VALUE;
		} else {
			this.scrollRange.minX = Number.MAX_VALUE;
			this.scrollRange.maxX = -Number.MAX_VALUE;
		}

		if (this.values.scrollOffsetY != null) {
			this.scrollRange.minY = this.values.scrollOffsetY;
			this.scrollRange.maxY = this.values.scrollHeight ? this.values.scrollOffsetY + this.values.scrollHeight : Number.MAX_VALUE;
		} else if (this.values.scrollHeight != null) {
			this.scrollRange.minY = 0;
			this.scrollRange.maxY = this.values.scrollHeight ?? Number.MAX_VALUE;
		} else {
			this.scrollRange.minY = Number.MAX_VALUE;
			this.scrollRange.maxY = -Number.MAX_VALUE;
		}
	}

	#insert(childObject, skipBoundsUpdate = false) {
		return this.container.insert(childObject, skipBoundsUpdate);
	}

	#removeAll() {
		this.container.removeAll();
	}

	#onTouch(event) {
		if (this.enabled) {
			if (event.phase == began) {
				this.holding = this.engine.frameEvent.frame;
			} else if (event.phase == hold) {
			} else if (event.phase == moved) {
				if (!this.horizontalScrollDisabled) {
					this.container.view.x += event.deltaX;
					this.container.view.x = -mathMin(this.scrollRange.maxX, mathMax(this.scrollRange.minX, -this.container.view.x));
				}
				if (!this.verticalScrollDisabled) {
					this.container.view.y += event.deltaY;
					this.container.view.y = -mathMin(this.scrollRange.maxY, mathMax(this.scrollRange.minY, -this.container.view.y));
				}
			} else if (event.phase == ended) {
				this.holding = false;
			}
			return true;
		}
	}
}

export { ZetoScrollView };
