import { ZetoEventObject } from './ZetoEventObject.js';
import { ZetoButton } from './ZetoButton.js';

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

	#finalizeBind;

	constructor(engine) {
		super();
		this.engine = engine;
		this.#finalizeBind = this.#finalizeWidget.bind(this);
	}

	newButton(options) {
		let button = new ZetoButton(this.engine, options);
		button.addEventListener('finalize', this.#finalizeBind);

		let tag = options.tag ?? 'default';
		this.widgets[tag] = this.widgets[tag] ?? [];
		this.widgets[tag].push(button);
		this.enabled[tag] = this.enabled[tag] ?? true;
		button.setEnabled(this.enabled[tag]);
		return this.engine.rootGroup.insert(button, true);
	}

	#finalizeWidget(event) {
		let tag = event.target.tag;
		let index = this.widgets[tag].indexOf(event.target);
		if (index > -1) {
			this.widgets[tag].splice(index, 1);
		}
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

export { ZetoWidgets };