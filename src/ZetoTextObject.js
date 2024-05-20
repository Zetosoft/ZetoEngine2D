import { ZetoEngineObject } from './ZetoEngineObject.js';
import { ZetoPath } from './ZetoPath.js';

class ZetoTextObject extends ZetoEngineObject {
	values = {
		// Since internal is taken by EngineObject
		fontName: 'Arial',
		fontSize: 20,
		contextFont: '20px Arial',
		textString: '',
		width: 0,
		words: [],
		lines: [],
		lineHeight: 0,
		offsetY: 0,
		spacing: 0,
	};

	align = 'center';

	constructor(engine, options = {}) {
		super(engine);

		this.values.fontName = options.fontName ?? engine.defaultFontName;
		this.values.fontSize = options.fontSize ?? engine.defaultFontSize;
		this.values.textString = String(options.text) ?? '';
		this.values.width = options.width ?? 0;
		this.values.contextFont = this.values.fontSize + 'px ' + this.values.fontName;
		this.values.spacing = options.spacing ?? 0.5;

		this.align = options.align ?? 'center';

		this.x = options.x ?? 0;
		this.y = options.y ?? 0;

		this.calculateTextPath();
		this.updateBounds();
	}

	set fontName(value) {
		this.values.fontName = value;
		this.values.contextFont = this.fontSize + 'px ' + this.fontName;
		this.calculateTextPath(true);
		this.updateBounds();
	}

	get fontName() {
		return this.values.fontName;
	}

	set fontSize(value) {
		this.values.fontSize = value;
		this.values.contextFont = this.fontSize + 'px ' + this.fontName;
		this.calculateTextPath(true);
		this.updateBounds();
	}

	get fontSize() {
		return this.values.fontSize;
	}

	set text(value) {
		if (value != this.values.textString) {
			this.values.textString = String(value);
			this.calculateTextPath(true);
			this.updateBounds();
		}
	}

	get text() {
		return this.values.textString;
	}

	draw(context, event) {
		super.draw(context, event);

		context.font = this.values.contextFont;
		context.fillStyle = this.fillColor;
		for (var lineIndex = 0; lineIndex < this.values.lines.length; lineIndex++) {
			var line = this.values.lines[lineIndex];
			context.fillText(line, 0, this.values.offsetY + (this.values.spacing + this.values.lineHeight) * lineIndex);
		}

		return context;
	}

	calculateTextPath(newPath = false) {
		// TODO: take into account align
		var width = 0;
		var maxLineHeight = 0;

		this.values.lines = [];

		if (this.values.width > 0) {
			width = this.values.width;

			this.values.words = this.values.textString.replace(/\n/g, ' \n ').split(/ +/);
			var currentLine = 0;
			this.values.lines[currentLine] = this.values.words[0];
			if (this.values.words.length > 1) {
				for (var wordIndex = 1; wordIndex < this.values.words.length; wordIndex++) {
					var word = this.values.words[wordIndex];
					if (word == '\n') {
						// Newline character found, start new line
						currentLine++;
						this.values.lines[currentLine] = '';
						continue;
					}
					var line = this.values.lines[currentLine] ?? '';
					line = line == '' ? word : line + ' ' + word;

					this.engine.context.font = this.values.contextFont;
					var metrics = this.engine.context.measureText(line);

					// Check if line with new word fits
					if (metrics.width > this.values.width && line != word) {
						// Word does not fit, start new line
						currentLine++;
						this.values.lines[currentLine] = word;
					} else {
						// New word fits or is the first word in line
						var lineHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
						maxLineHeight = lineHeight > maxLineHeight ? lineHeight : maxLineHeight;
						this.values.lines[currentLine] = line;
					}
				}
				this.values.lineHeight = lineHeight > this.values.lineHeight ? lineHeight : this.values.lineHeight;
			} else {
				this.engine.context.font = this.values.contextFont;
				var metrics = this.engine.context.measureText(this.values.lines[currentLine]);
				maxLineHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
			}
		} else {
			this.values.lines = this.values.textString.split('\n');
			for (var lineIndex = 0; lineIndex < this.values.lines.length; lineIndex++) {
				var line = this.values.lines[lineIndex];
				this.engine.context.font = this.values.contextFont;
				var metrics = this.engine.context.measureText(line);
				if (metrics.width > width) {
					width = metrics.width;
				}
				var lineHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
				maxLineHeight = lineHeight > maxLineHeight ? lineHeight : maxLineHeight;
			}
		}

		this.values.lineHeight = this.values.lines.length > 1 ? maxLineHeight * (1 + this.values.spacing) : maxLineHeight;
		var totalHeight = this.values.lines.length * this.values.lineHeight - this.values.spacing;
		this.values.offsetY = -(this.values.lines.length - 1) * this.values.lineHeight * 0.5;

		var left = -width * 0.5;
		var top = -totalHeight * 0.5;

		if (newPath) {
			this.path = new ZetoPath();
		}
		this.path.rect(left, top, width, totalHeight);
	}
}

export { ZetoTextObject };