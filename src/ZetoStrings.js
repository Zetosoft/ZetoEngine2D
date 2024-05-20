import { ZetoEventObject } from './ZetoEventObject.js';

class ZetoStrings extends ZetoEventObject {
	strings = [{ en: {} }, { es: {} }];
	engine;
	locale = 'en';

	listeners = {
		locale: [],
	};

	constructor(engine) {
		super();
		this.engine = engine;
	}

	setLocale(locale) {
		this.locale = locale;
		this.dispatchEvent('locale', { target: this, locale: locale });
	}

	add(strings) {
		for (var locale in strings) {
			if (!this.strings[locale]) {
				this.strings[locale] = {};
			}
			for (var key in strings[locale]) {
				this.strings[locale][key] = strings[locale][key];
			}
		}
	}

	get(key, replace) {
		let string = this.strings[this.locale][key] || key;
		if (replace && typeof replace === 'object') {
			Object.keys(replace).forEach((key) => {
				const placeholder = `:${key}`;
				const value = replace[key];
				string = string.replace(new RegExp(placeholder, 'g'), value);
			});
		}
		return string;
	}
}

export { ZetoStrings };