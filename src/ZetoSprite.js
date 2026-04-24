import { ZetoEngineObject } from './ZetoEngineObject.js';
import { mathFloor, forward, bounce, reverse, sprite, began, ended, loop, next } from './constants.js';

class ZetoSprite extends ZetoEngineObject {
	listeners = {
		sprite: [],

		tap: [],
		touch: [],
		hover: [],
		enterframe: [],
		exitframe: [],
		finalize: [],
	};

	imageSheet;
	sequenceData;

	sequenceMap = {};

	frame = 0;
	frameTime = 0;
	frameTimestamp = 0;
	frameAccumulator = 0;

	sequence = false;
	playing = false;

	loopDirection = 1;
	loopCount = 0;
	timeScale = 1;

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
			this.loopCount = this.sequence.loopCount ?? 0;
			this.frameTimestamp = 0;
			this.frameAccumulator = 0;

			var rightLimit = this.sequence.start + this.sequence.count - 1;
			if ((this.sequence.loopDirection ?? forward) == reverse) {
				this.frame = rightLimit;
				this.loopDirection = -1;
			} else {
				this.frame = this.sequence.start;
				this.loopDirection = 1;
			}

			if (this.sequence.sheet) {
				this.imageSheet = this.sequence.sheet;
				this.fill = this.sequence.sheet;
			}

			this.updateCurrentFrameData();
		}
	}

	play() {
		if (!this.playing) {
			if (this.sequence && (this.sequence.loopCount ?? 0) > 0 && this.loopCount == 0) {
				this.loopCount = this.sequence.loopCount ?? 0;
				this.frameTimestamp = 0;
				this.frameAccumulator = 0;
				var rightLimit = this.sequence.start + this.sequence.count - 1;
				if ((this.sequence.loopDirection ?? forward) == reverse) {
					this.frame = rightLimit;
					this.loopDirection = -1;
				} else {
					this.frame = this.sequence.start;
					this.loopDirection = 1;
				}
				this.updateCurrentFrameData();
			}

			this.dispatchEvent(sprite, { target: this, phase: began });
		}

		this.playing = true;
	}

	stop() {
		this.playing = false;
	}

	update(event) {
		super.update(event);

		if (!this.playing || !this.sequence) {
			return;
		}

		if (this.frameTimestamp == 0) {
			this.frameTimestamp = event.timeStamp;
		}

		var deltaTime = event.timeStamp - this.frameTimestamp;
		this.frameTimestamp = event.timeStamp;

		if (deltaTime <= 0 || this.sequence.count <= 1 || this.sequence.time <= 0 || this.frameTime <= 0 || this.timeScale <= 0) {
			return;
		}

		this.frameAccumulator += deltaTime * this.timeScale;

		var frameAdd = mathFloor(this.frameAccumulator / this.frameTime);
		if (frameAdd <= 0) {
			return;
		}

		this.frameAccumulator = this.frameAccumulator % this.frameTime;

		while (frameAdd-- > 0 && this.playing) {
			var phase = this.stepFrame();
			this.dispatchEvent(sprite, { target: this, phase: phase });
		}

		this.updateCurrentFrameData();
	}

	stepFrame() {
		var start = this.sequence.start;
		var rightLimit = start + this.sequence.count - 1;
		var directionMode = this.sequence.loopDirection ?? forward;

		var nextFrame = this.frame + this.loopDirection;

		if (directionMode == forward) {
			if (nextFrame > rightLimit) {
				if ((this.sequence.loopCount ?? 0) > 0) {
					this.loopCount--;
				}

				if ((this.sequence.loopCount ?? 0) > 0 && this.loopCount <= 0) {
					this.frame = rightLimit;
					this.playing = false;
					return ended;
				}

				this.frame = start;
				return loop;
			}

			this.frame = nextFrame;
			return next;
		} else if (directionMode == reverse) {
			if (nextFrame < start) {
				if ((this.sequence.loopCount ?? 0) > 0) {
					this.loopCount--;
				}

				if ((this.sequence.loopCount ?? 0) > 0 && this.loopCount <= 0) {
					this.frame = start;
					this.playing = false;
					return ended;
				}

				this.frame = rightLimit;
				return loop;
			}

			this.frame = nextFrame;
			return next;
		} else if (directionMode == bounce) {
			if (nextFrame > rightLimit) {
				this.loopDirection = -1;
				this.frame = rightLimit - 1;
				return bounce;
			}

			if (nextFrame < start) {
				if ((this.sequence.loopCount ?? 0) > 0) {
					this.loopCount--;
				}

				if ((this.sequence.loopCount ?? 0) > 0 && this.loopCount <= 0) {
					this.frame = start;
					this.playing = false;
					return ended;
				}

				this.loopDirection = 1;
				this.frame = start + 1;
				return loop;
			}

			this.frame = nextFrame;
			return next;
		}
	}

	updateCurrentFrameData() {
		var frameData = this.imageSheet.frameData[this.frame];
		if (frameData && frameData != this.internal.currentFrameData) {
			this.internal.currentFrameData = frameData;
		}
	}
}

export { ZetoSprite };
