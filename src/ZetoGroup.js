import { ZetoEngineObject } from './ZetoEngineObject.js';

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

	insert(childObject, skipBoundsUpdate = false) {
		if (childObject.parent && childObject.parent != this) {
			var index = childObject.parent.children.indexOf(childObject);
			childObject.parent.children.splice(index, 1);

			childObject.parent.updateBounds();
		}

		if (childObject.parent != this) {
			this.children.push(childObject);
			childObject.parent = this;
		}

		if (!skipBoundsUpdate) {
			this.updateBounds();
		}

		childObject.worldTransform = childObject.worldTransform.preMultiplySelf(this.worldTransform);

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

export { ZetoGroup };