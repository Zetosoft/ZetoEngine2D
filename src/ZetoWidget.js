import { ZetoGroup } from './ZetoGroup.js';

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

export { ZetoWidget };