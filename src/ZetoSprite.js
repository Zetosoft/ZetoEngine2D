import { ZetoEngineObject } from './ZetoEngineObject.js';
import { mathFloor } from './constants.js';

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

export { ZetoSprite };