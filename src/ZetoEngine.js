import { ZetoEventObject } from './ZetoEventObject.js';
import { ZetoGroup } from './ZetoGroup.js';
import { ZetoPhysicsEngine } from './ZetoPhysicsEngine.js';
import { ZetoParticleEngine } from './ZetoParticleEngine.js';
import { ZetoTransitionEngine } from './ZetoTransitionEngine.js';
import { ZetoTimerEngine } from './ZetoTimerEngine.js';
import { ZetoWidgets } from './ZetoWidgets.js';
import { ZetoStrings } from './ZetoStrings.js';
import { ZetoAudioEngine } from './ZetoAudioEngine.js';
import { ZetoEngineObject } from './ZetoEngineObject.js';
import { ZetoPath } from './ZetoPath.js';
import { ZetoContainer } from './ZetoContainer.js';
import { ZetoSprite } from './ZetoSprite.js';
import { ZetoTextObject } from './ZetoTextObject.js';
import { ZetoFill } from './ZetoFill.js';
import { TOUCH_BEGAN, TOUCH_HOLD, began, hold, hover, ended, moved, radianMultiplier, pi, mathRound, mathFloor, isGroup, lockCanvasEvents } from './constants.js';

class ZetoEngine extends ZetoEventObject {
	debug = false;

	listeners = {
		enterframe: [],
		exitframe: [],
		resize: [],
		touch: [],
		wheel: [],
		tap: [],
		key: [],
	};

	mouseX = 0;
	mouseY = 0;
	mouseTouch = false;

	holdingKey = {};

	tapTime = 200;

	touchPoints = [];
	removeTouchPoints = [];
	activeTouchPoints = [];

	rootGroup;

	loadedModules = {};
	loadedImages = {};
	loadedAudio = {};
	loadedData = {};

	fillColor = 'white';
	clearColor = 'black';
	clearAlpha = 1;

	debugTapColor = '#FF00FFBB'; // magenta
	debugBoundsColor = '#FF0000BB'; // red
	debugColor = '#FFFFFFBB'; // white

	defaultFontName = 'Arial';
	defaultFontSize = 20;

	frameEvent = {
		frame: 0,
		timeStamp: 0,
		delta: 0,
	};
	canvasLocked = false;
	canvas;
	context;

	audioContext;

	cX;
	cY;
	width;
	height;

	paused = false;
	focus = true;

	pauseBind;

	showFPS = false;
	secondsPassed;
	oldTimeStamp;
	fps;

	physics;
	particles;
	timer;
	transition;
	widgets;
	strings;

	info = {
		isMobile: (navigator.maxTouchPoints & 0xff) > 1 || 'ontouchstart' in document ? true : false,
	};

	loadedIds = {
		image: {},
		audio: {},
		data: {},
		unknown: {},
	};

	constructor(options = {}) {
		super();

		let moduleName = options.moduleName ?? false;
		let moduleParams = options.moduleParams ?? {};
		let loadedListener = options.loadedListener ?? false;
		let progressListener = options.progressListener ?? false;
		let smoothing = options.smoothing ?? false;
		let canvas = options.canvas ?? 'canvas';

		this.rootGroup = new ZetoGroup(this);
		this.physics = new ZetoPhysicsEngine(this, options.warn);
		this.particles = new ZetoParticleEngine(this);
		this.transition = new ZetoTransitionEngine(this);
		this.timer = new ZetoTimerEngine(this);
		this.widgets = new ZetoWidgets(this);
		this.strings = new ZetoStrings(this);
		this.audio = new ZetoAudioEngine(this);

		document.addEventListener('touchstart', {}); // Enables touch events on iOS if embedded in iframe

		window.addEventListener('visibilitychange', this.visibilityChange.bind(this));

		window.addEventListener('touchstart', this.touchStart.bind(this), { passive: false });
		window.addEventListener('touchmove', this.touchMove.bind(this), { passive: false });
		window.addEventListener('touchend', this.touchEnd.bind(this), { passive: false });
		window.addEventListener('touchcancel', this.touchCancel.bind(this), { passive: false });

		window.addEventListener('mousedown', this.mouseDown.bind(this));
		window.addEventListener('mousemove', this.mouseMove.bind(this));
		window.addEventListener('mouseup', this.mouseUp.bind(this));

		window.addEventListener('wheel', this.wheelEvent.bind(this));

		window.addEventListener('keydown', this.keyDown.bind(this));
		window.addEventListener('keyup', this.keyUp.bind(this));

		this.initCanvas(smoothing, canvas);

		window.onunload = function (event) {
			event.preventDefault();
		};

		if (moduleName) {
			this.load(moduleName, moduleParams, loadedListener, progressListener);
		}
	}

	visibilityChange(event) {
		if (document.hidden) {
			// mainLoop handles the re-focus
			this.focus = false;
		}
	}

	touchStart(event) {
		event.preventDefault();

		let touches = event.changedTouches?.length > 0 ? event.changedTouches : [event];
		for (let touchIndex = 0; touchIndex < touches.length; touchIndex++) {
			let touch = touches[touchIndex];

			let existingTouch = this.touchPoints[touch.identifier];
			if (!existingTouch) {
				this.activeTouchPoints.push(touch.identifier);
				this.touchPoints[touch.identifier] = {
					lastInputX: touch.pageX,
					lastInputY: touch.pageY,
					startX: touch.pageX,
					startY: touch.pageY,
					startTime: event.timeStamp,
					startFrame: this.frameEvent.frame,
					listenerObjects: [],
					state: TOUCH_BEGAN,
				};
			}
		}
	}

	inputTouch(event) {
		let touches = event.changedTouches?.length > 0 ? event.changedTouches : [event];
		for (let touchIndex = 0; touchIndex < touches.length; touchIndex++) {
			let touch = touches[touchIndex];

			let touchPoint = this.touchPoints[touch.identifier ?? 0];
			let deltaX = touch.pageX - touchPoint.lastInputX;
			let deltaY = touch.pageY - touchPoint.lastInputY;
			touchPoint.lastInputX = touch.pageX;
			touchPoint.lastInputY = touch.pageY;

			let touchEvent = { deltaX: deltaX, deltaY: deltaY, touchPoint: touchPoint, phase: moved };
			let handled = false;
			if (touchPoint.listenerObjects.length > 0) {
				for (let objectIndex = 0; objectIndex < touchPoint.listenerObjects.length; objectIndex++) {
					let object = touchPoint.listenerObjects[objectIndex];
					if (object.hasEventListener('touch')) {
						let touchEvent = {
							x: touchPoint.lastInputX,
							y: touchPoint.lastInputY,
							deltaX: deltaX,
							deltaY: deltaY,
							touchPoint: touchPoint,
							phase: moved,
						};

						if ((handled = this.dispatchObjectEvent(object, 'touch', touchEvent) == true)) {
							break;
						}
					}
				}
			}

			if (!handled) {
				this.dispatchEvent('touch', touchEvent); // Engine level
			}
		}
	}

	touchMove(event) {
		event.preventDefault();
		this.inputTouch(event);
	}

	touchEnd(event) {
		event.preventDefault();

		let touches = event.changedTouches?.length > 0 ? event.changedTouches : [event];
		for (let touchIndex = 0; touchIndex < touches.length; touchIndex++) {
			let touch = touches[touchIndex];
			let touchId = touch.identifier ?? 0;

			let touchPoint = this.touchPoints[touchId];
			touchPoint.lastInputX = touch.pageX;
			touchPoint.lastInputY = touch.pageY;

			let touchDiff = event.timeStamp - touchPoint.startTime;
			let tapEvent = false;
			if (touchDiff < this.tapTime) {
				tapEvent = {
					x: touchPoint.lastInputX,
					y: touchPoint.lastInputY,
					time: touchDiff,
				};
			}

			let touchEvent = {
				x: touchPoint.lastInputX,
				y: touchPoint.lastInputY,
				touchPoint: touchPoint,
				phase: ended,
			};

			let touchHandled = false;
			let tapHandled = false;
			if (touchPoint.listenerObjects.length > 0) {
				// Object level
				for (let objectIndex = 0; objectIndex < touchPoint.listenerObjects.length; objectIndex++) {
					let object = touchPoint.listenerObjects[objectIndex];
					if (tapEvent && object.hasEventListener('tap') && !tapHandled) {
						tapHandled = this.dispatchObjectEvent(object, 'tap', tapEvent) == true;
					}
					if (object.hasEventListener('touch') && !touchHandled) {
						touchHandled = this.dispatchObjectEvent(object, 'touch', touchEvent) == true;
					}
					if (touchHandled && tapHandled) {
						break;
					}
				}
			}

			if (!touchHandled) {
				this.dispatchEvent('touch', touchEvent); // Engine level
			}

			if (tapEvent && !tapHandled) {
				this.dispatchEvent('tap', tapEvent); // Engine level
			}

			this.removeTouchPoints.push(touchId);
			touchPoint.listenerObjects = false;
		}
	}

	touchCancel(event) {
		this.touchEnd(event);
	}

	mouseDown(event) {
		if (event.button == 0) {
			this.mouseTouch = true;
			this.activeTouchPoints.push(0);
			this.touchPoints[0] = {
				// Mouse is identifier 0
				lastInputX: event.pageX,
				lastInputY: event.pageY,
				startX: event.pageX,
				startY: event.pageY,
				startTime: event.timeStamp,
				startFrame: this.frameEvent.frame,
				listenerObjects: [],
				state: TOUCH_BEGAN,
			};
		}
	}

	mouseMove(event) {
		if (this.mouseTouch) {
			this.inputTouch(event);
		}
		this.mouseX = event.pageX;
		this.mouseY = event.pageY;
	}

	mouseUp(event) {
		if (event.button == 0) {
			this.mouseTouch = false;
			this.touchEnd(event);
		}
	}

	wheelEvent(event) {
		let wEvent = {
			deltaX: event.wheelDeltaX,
			deltaY: event.wheelDeltaY,
		};
		this.dispatchEvent('wheel', wEvent);
	}

	inputKey(event, phase, frame = 0) {
		let kEvent = {
			phase: phase,
			key: event.key,
			code: event.code,

			shiftKey: event.shiftKey,
			ctrlKey: event.ctrlKey,
			altKey: event.altKey,

			frame: frame,
		};
		this.dispatchEvent('key', kEvent);
	}

	keyDown(event) {
		this.inputKey(event, began);
		this.holdingKey[event.code ?? event.key] = {
			event: event,
			frame: 0,
		};
	}

	keyUp(event) {
		this.inputKey(event, ended, -1); // TODO: get holdingKey last frame?
		this.holdingKey[event.code ?? event.key] = false;
	}

	initCanvas(smoothing = false, canvasId = 'canvas') {
		let canvas = (this.canvas = document.getElementById(canvasId));
		this.context = canvas.getContext('2d');
		this.resizeCanvas();

		this.context.mozImageSmoothingEnabled = smoothing;
		this.context.webkitImageSmoothingEnabled = smoothing;
		this.context.msImageSmoothingEnabled = smoothing;
		this.context.imageSmoothingEnabled = smoothing;

		canvas.style.outline = 'none';
		canvas.style.webkitTapHighlightColor = 'rgba(255, 255, 255, 0)';
		canvas.style.webkitTouchCallout = 'none';
		canvas.style.webkitUserSelect = 'none';
		canvas.style.khtmlUserSelect = 'none';
		canvas.style.mozUserSelect = 'none';
		canvas.style.msUserSelect = 'none';
		canvas.style.userSelect = 'none';

		document.documentElement.style.overscrollBehavior = 'none';
		document.body.style.overscrollBehavior = 'none';

		window.addEventListener('resize', this.resizeCanvas.bind(this), false);
		window.requestAnimationFrame(this.mainLoop.bind(this));
	}

	mainLoop(timeStamp) {
		if (!this.focus) {
			this.focus = true; // requestAnimationFrame only happens when on focus on most browsers
			this.frameEvent.timeStamp = timeStamp; // This prevents a huge delta time when re-focusing
		}

		this.frameEvent.frame++;
		if (this.paused) {
			this.frameEvent.delta = 0;
			this.frameEvent.timeStamp = timeStamp;
		} else {
			this.frameEvent.delta = timeStamp - this.frameEvent.timeStamp;
			this.frameEvent.timeStamp = timeStamp;
		}

		this.dispatchEvent('enterframe', this.frameEvent);

		this.clearCanvas();
		this.updateInput();
		this.drawUpdate(this.context, this.rootGroup); // Scene graph update
		this.updateTouchPoints();

		if (!this.paused) {
			this.timer.update(this.frameEvent);
			this.transition.update(this.frameEvent);
			this.physics.update(this.frameEvent);
			this.particles.update(this.frameEvent);
		}

		this.dispatchEvent('exitframe', this.frameEvent);

		if (this.showFPS) {
			this.drawFPS(timeStamp);
		}
		window.requestAnimationFrame(this.mainLoop.bind(this));
	}

	updateTouchPoints() {
		for (let touchIndex = this.removeTouchPoints.length - 1; touchIndex >= 0; touchIndex--) {
			let touchId = this.removeTouchPoints[touchIndex];

			let activeIndex = this.activeTouchPoints.indexOf(touchId);
			if (activeIndex > -1) {
				// TODO: check alternatives
				this.activeTouchPoints.splice(activeIndex, 1);
			}
			delete this.touchPoints[touchId];
			this.removeTouchPoints.splice(touchIndex, 1);
		}

		for (let touchIndex = 0; touchIndex < this.activeTouchPoints.length; touchIndex++) {
			let touchPoint = this.touchPoints[this.activeTouchPoints[touchIndex]];

			let phase = touchPoint.state == TOUCH_BEGAN ? began : hold;
			let touchEvent = {
				x: touchPoint.lastInputX,
				y: touchPoint.lastInputY,
				touchPoint: touchPoint,
				phase: phase,
			};

			let preventPropagation = false;
			if (touchPoint.listenerObjects.length > 0) {
				for (let objectIndex = 0; objectIndex < touchPoint.listenerObjects.length; objectIndex++) {
					let object = touchPoint.listenerObjects[objectIndex];
					if (object.hasEventListener('touch')) {
						preventPropagation = this.dispatchObjectEvent(object, 'touch', touchEvent) == true;
					}
				}
			}

			if (preventPropagation) {
				touchPoint.state = TOUCH_HOLD;
				continue;
			}
			this.dispatchEvent('touch', touchEvent); // Engine level
			touchPoint.state = TOUCH_HOLD;
		}
	}

	drawFPS(timeStamp) {
		this.secondsPassed = (timeStamp - this.oldTimeStamp) / 1000;
		this.oldTimeStamp = timeStamp;
		this.fps = mathRound(1 / this.secondsPassed);
		this.context.font = '25px Arial';
		this.context.fillStyle = this.fillColor;
		this.context.fillText('FPS: ' + this.fps, 60, 30);
	}

	clearCanvas() {
		this.context.fillStyle = this.clearColor;
		this.context.globalAlpha = this.clearAlpha;
		this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
	}

	updateInput() {
		for (let key in this.holdingKey) {
			let holdEvent = this.holdingKey[key];
			if (holdEvent) {
				if (holdEvent.frame > 0) {
					this.inputKey(holdEvent.event, hold, holdEvent.frame);
				}
				holdEvent.frame++;
			}
		}
	}

	updatePhysics(event) {
		this.physics.update(event);
	}

	touchUpdate(context, object, parentTouch = false) {
		if (this.activeTouchPoints.length <= 0) {
			return false;
		}

		let touchObject = object.hasEventListener('tap') || object.hasEventListener('touch');
		if (isGroup(object)) {
			// TODO: limitation: if two or more chained groups have tap listeners, the previous one will be ignored
			return touchObject || parentTouch; // This means only the last group in the chain will be able to receive tap events (And the children that confirm isPointInPath)
		}

		for (let touchIndex = 0; touchIndex < this.activeTouchPoints.length; touchIndex++) {
			let touchPoint = this.touchPoints[this.activeTouchPoints[touchIndex]];

			if (this.frameEvent.frame > touchPoint.startFrame + 1) {
				continue; // Skip if the touch started before this frame
			}

			if (!touchPoint.listenerObjects) {
				continue; // Skip if the touch has no listener objects
			}

			if (touchObject || parentTouch) {
				if (context.isPointInPath(object.path.path, touchPoint.lastInputX, touchPoint.lastInputY)) {
					if (parentTouch) {
						if (touchPoint.listenerObjects.indexOf(parentTouch) == -1) {
							// Can already be added by sibling object
							touchPoint.listenerObjects.push(parentTouch);
						}
						parentTouch = false; // Parent has been handled for the rest of children
					}
					if (touchObject) {
						touchPoint.listenerObjects.push(object);
						touchObject = false;
					}
				}
			}
		}
		return touchObject || parentTouch;
	}

	hoverUpdate(context, object, parentHover = false) {
		// TODO: this can be optimized (To start off remove in mobile) use isGroup(), etc
		let hoverObject = object.hasEventListener(hover) || parentHover; // hoverObject can be a parent and not the object itself
		if (hoverObject) {
			if (!hoverObject.hover) {
				if (context.isPointInPath(object.path.path, this.mouseX, this.mouseY)) {
					hoverObject.hover = this.frameEvent.frame;

					let hoverEvent = { x: this.mouseX, y: this.mouseY, phase: began };
					this.dispatchObjectEvent(hoverObject, hover, hoverEvent);
				}
			} else if (hoverObject.hover != this.frameEvent.frame) {
				if (!hoverObject.isVisible || hoverObject.alpha == 0 || !context.isPointInPath(object.path.path, this.mouseX, this.mouseY)) {
					// My guess is that this is the main bottleneck
					hoverObject.hover = false;

					let hoverEvent = { x: this.mouseX, y: this.mouseY, phase: ended };
					this.dispatchObjectEvent(hoverObject, hover, hoverEvent);
				}
			}
			return hoverObject;
		}
	}

	debugDraw(context, object) {
		if (this.debug) {
			context.globalAlpha = 1;
			context.lineWidth = 1;
			context.fillStyle = this.debugColor;

			if (isGroup(object)) {
				// Cross for groups
				context.save();
				context.rotate(45 * radianMultiplier);
				context.fillRect(0, -4, 2, 10);
				context.fillRect(-4, 0, 10, 2);
				context.restore();
			} else {
				// Dot for anything else
				context.fillRect(-1.5, -1.5, 3, 3);

				if (object.bounds) {
					// Draw bounds except for root group
					context.strokeStyle = this.debugBoundsColor;
					context.save();
					context.rotate(-object.bounds.world.rotation * radianMultiplier);
					context.strokeRect(object.bounds.world.x1, object.bounds.world.y1, object.bounds.world.width, object.bounds.world.height);
					context.restore();
				}
			}

			// TODO: this is not working on groups (They have no path, add isPointInPath object to draw here)
			context.strokeStyle = this.debugColor;
			for (let touchIndex = 0; touchIndex < this.activeTouchPoints.length; touchIndex++) {
				let touchPoint = this.touchPoints[this.activeTouchPoints[touchIndex]];
				if (touchPoint.listenerObjects && touchPoint.listenerObjects.indexOf(object) > -1) {
					context.strokeStyle = this.debugTapColor;
					context.fillText('Touching', 0, 0);
					break;
				}
			}
			context.stroke(object.path.path);

			if (object.body) {
				this.physics.debugDraw(context, object.body);
			}
		}
	}

	drawUpdateChildren(context, parent, alpha = 1, isParentTouch, isHover) {
		if (parent.children && parent.children.length > 0) {
			for (let childIndex = 0; childIndex < parent.children.length; childIndex++) {
				this.drawUpdate(context, parent.children[childIndex], alpha, isParentTouch, isHover);
			}
		}
	}

	dispatchObjectEvent(object, eventName, event) {
		let targetEvent = { ...event };
		targetEvent.target = object;
		return object.dispatchEvent(eventName, targetEvent);
	}

	drawUpdate(context, object, alpha = 1, isParentTouch = false, isParentHover = false) {
		context.save();
		context.translate(object.x, object.y);
		context.rotate(object.rotation * radianMultiplier);
		context.scale(object.xScale, object.yScale);

		object.worldTransform = context.getTransform();

		this.dispatchObjectEvent(object, 'enterframe', this.frameEvent);

		object.update(this.frameEvent);

		if (object.isVisible) {
			context.globalAlpha = alpha * object.alpha;

			// translate anchors
			context.translate(object.internal.anchorOffsetX, object.internal.anchorOffsetY);
			let objectContext = object.draw(context, this.frameEvent);
			let isThisTouch = this.touchUpdate(objectContext, object, isParentTouch);
			let isThisHover = this.hoverUpdate(objectContext, object, isParentHover);
			this.drawUpdateChildren(objectContext, object, context.globalAlpha, isThisTouch, isThisHover);
		}

		this.debugDraw(context, object);

		context.restore();

		this.dispatchObjectEvent(object, 'exitframe', this.frameEvent);
	}

	resizeCanvas(event) {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;

		this.cX = this.canvas.width * 0.5;
		this.cY = this.canvas.height * 0.5;
		this.width = this.canvas.width;
		this.height = this.canvas.height;

		this.context.textBaseline = 'middle';
		this.context.textAlign = 'center';

		let resizeEvent = {
			width: this.canvas.width,
			height: this.canvas.height,
			cX: this.cX,
			cY: this.cY,
		};
		this.dispatchEvent('resize', resizeEvent);
	}

	newGroup(x, y) {
		let group = new ZetoGroup(this, x, y);
		return this.rootGroup.insert(group, true);
	}

	newContainer(x, y, width, height) {
		let container = new ZetoContainer(this, x, y, width, height);
		return this.rootGroup.insert(container, true);
	}

	newCamera(x, y) {
		let camera = new ZetoCamera(this, x, y);
		return this.rootGroup.insert(camera, true);
	}

	newText(options) {
		let textObject = new ZetoTextObject(this, options);
		return this.rootGroup.insert(textObject, true);
	}

	newImage(id, x, y) {
		let fill = this.loadedImages[id];
		if (fill) {
			return this.newImageRect(id, x, y, fill.image.width, fill.image.height);
		} else {
			throw new Error('Image not loaded: ' + id);
		}
	}

	newImageRect(id, x, y, width, height) {
		let fill = this.loadedImages[id];
		if (fill) {
			let rectWidth = width ?? fill.image.width;
			let rectHeight = height ?? fill.image.height;

			let imageRect = this.newRect(x, y, rectWidth, rectHeight);
			imageRect.fill = { image: fill.image, sheet: { x: 0, y: 0, width: fill.image.width, height: fill.image.height } };

			return this.rootGroup.insert(imageRect, true);
		} else {
			throw new Error('Image not loaded: ' + id);
		}
	}

	newCircle(x, y, radius) {
		let criclePath = new ZetoPath();
		criclePath.arc(0, 0, radius, 0, 2 * pi, false);

		let circle = new ZetoEngineObject(this, criclePath, x, y);
		return this.rootGroup.insert(circle, true);
	}

	newRoundedRect(x, y, width, height, radius) {
		let roundedRectPath = new ZetoPath();
		roundedRectPath.roundRect(-width * 0.5, -height * 0.5, width, height, radius);

		let roundedRect = new ZetoEngineObject(this, roundedRectPath, x, y);
		return this.rootGroup.insert(roundedRect, true);
	}

	newRect(x, y, width, height) {
		let rectPath = new ZetoPath();
		rectPath.rect(-width * 0.5, -height * 0.5, width, height);

		let rect = new ZetoEngineObject(this, rectPath, x, y);
		return this.rootGroup.insert(rect, true);
	}

	newPolygon(x, y, vertices) {
		let polygonPath = new ZetoPath();
		for (let vertexIndex = 0; vertexIndex < vertices.length; vertexIndex++) {
			let vertex = vertices[vertexIndex];
			if (vertexIndex == 0) {
				polygonPath.moveTo(vertex.x, vertex.y);
			} else {
				polygonPath.lineTo(vertex.x, vertex.y);
			}
		}
		polygonPath.closePath();

		let polygon = new ZetoEngineObject(this, polygonPath, x, y);
		return this.rootGroup.insert(polygon, true);
	}

	newImageSheet(id, sheetData) {
		let frameData = sheetData.frames ?? [];
		let numFrames = frameData.length;
		let imageFill = this.loadedImages[id];

		if (!sheetData.frames) {
			let width = sheetData.width;
			let height = sheetData.height;
			numFrames = sheetData.numFrames;

			let numCols = mathFloor(imageFill.image.width / sheetData.width);
			for (let frame = 0; frame < numFrames; frame++) {
				let col = frame % numCols;
				let row = mathFloor(frame / numCols);

				frameData.push({
					x: col * width,
					y: row * height,
					width: width,
					height: height,
				});
			}
		}

		return {
			image: imageFill.image,
			frameData: frameData,
			numFrames: numFrames,
			sheet: frameData[0], // First frame
		};
	}

	newSprite(imageSheet, sequenceData, x = 0, y = 0) {
		let sprite = new ZetoSprite(this, imageSheet, sequenceData, x, y);
		return this.rootGroup.insert(sprite, true);
	}

	getImageFill(id, createPattern, patternRepeat = 'repeat') {
		let fill = this.loadedImages[id];
		if (fill && createPattern) {
			let pattern = this.context.createPattern(fill.image, patternRepeat);
			return new ZetoFill(pattern, fill.image.width, fill.image.height);
		} else {
			return fill;
		}
	}

	getData(id) {
		if (this.loadedData[id]) {
			let element = this.loadedData[id];
			return element.data.response;
		}
	}

	remove(object) {
		if (object && object.destroy) {
			object.destroy();
		}
	}

	getAsset(type, id) {
		if (type == 'image') {
			return this.loadedImages[id] ? this.loadedImages[id].image : false;
		} else if (type == 'audio') {
			return this.loadedAudio[id] ? this.loadedAudio[id].audio : false;
		} else if (type == 'data') {
			return this.loadedData[id] ? this.loadedData[id].data : false;
		}
	}

	loadAssets(images, audio, data, onComplete, onProgress) {
		let numAssets = 0;
		numAssets += images ? images.length : 0;
		numAssets += audio ? audio.length : 0;
		numAssets += data ? data.length : 0;

		let numLoaded = 0;
		function assetLoaded(event) {
			let asset = event.target;
			let type = asset.zType ?? 'unknown';

			if (this.loadedIds[type][asset.id]) {
				let existingAsset = this.getAsset(type, asset.id);
				if (existingAsset != asset) {
					console.warn('Duplicate ' + type + '.' + asset.id + ' with different contents');
				}
			}

			this.loadedIds[type][asset.id] = event.type ?? true;
			numLoaded++;

			if (onProgress) {
				let onProgressEvent = {
					numLoaded: numLoaded,
					numAssets: numAssets,
					loadedId: asset.id,
					progress: numLoaded / numAssets,
					asset: asset,
				};
				onProgress(onProgressEvent);
			}

			if (numLoaded == numAssets) {
				let onCompleteEvent = {
					numLoaded: numLoaded,
				};
				onComplete(onCompleteEvent);
			}
		}

		let assetLoadedBind = assetLoaded.bind(this);

		if (images) {
			images.forEach((element) => {
				if (!this.#checkLoaded(element.id, element.filename, 'image', assetLoadedBind)) {
					element.image = new Image();
					element.image.onload = assetLoadedBind;
					element.image.src = element.filename;
					element.image.id = element.id;
					element.image.zType = 'image'; // Custom property

					this.loadedImages[element.id] = element;
					if (element.image.complete) {
						// Is in cache
						element.image.onload = null;
						assetLoadedBind({ target: element.image, type: 'cache-z' }); // Avoid dupe warning
					}
				}
			});
		}

		if (audio) {
			audio.forEach((element) => {
				if (!this.#checkLoaded(element.id, element.filename, 'audio', assetLoadedBind)) {
					element.audio = new XMLHttpRequest();
					element.audio.onload = assetLoadedBind;
					element.audio.open('GET', element.filename, true);
					element.audio.responseType = 'arraybuffer';
					element.audio.id = element.id;
					element.audio.send();
					element.audio.zType = 'audio'; // Custom property

					this.loadedAudio[element.id] = element;
				}
			});
		}

		if (data) {
			data.forEach((element) => {
				if (!this.#checkLoaded(element.id, element.filename, 'data', assetLoadedBind)) {
					element.data = new XMLHttpRequest();
					element.data.onload = assetLoadedBind;
					element.data.open('GET', element.filename, true);
					element.data.responseType = 'json';
					element.data.id = element.id;
					element.data.send();
					element.data.zType = 'data'; // Custom property

					this.loadedData[element.id] = element;
				}
			});
		}

		if (numAssets == 0) {
			let onCompleteEvent = {
				numLoaded: 0,
				engine: this,
			};
			onComplete(onCompleteEvent);
		}
	}

	#checkLoaded(id, filename, type, alreadyLoadedListener) {
		let alreadyLoaded = this.loadedIds[type][id];
		if (!alreadyLoaded) {
			return false;
		}
		let loadedElement = type == 'image' ? this.loadedImages[id] : type == 'audio' ? this.loadedAudio[id] : this.loadedData[id];
		if (loadedElement.filename != filename) {
			return false;
		}
		alreadyLoadedListener({ target: loadedElement[type], type: 'cachez' });
		return true;
	}

	#generateCallback(after) {
		// Allows for one liner callbacks
		return function (before) {
			return function (event) {
				event.result = before ? before(event) : false;
				return after ? after(event) : false;
			};
		};
	}

	async load(moduleName, params, loadedListener, progressListener) {
		let jsName = moduleName.replace(/\./g, '/');
		const module = this.loadedModules[moduleName] ?? (await import(/*webpackIgnore: true*/ `./${jsName}.js?c=${Date.now()}`));
		this.loadedModules[moduleName] = module;
		let createEvent = {
			params: params,
			engine: this,
			complete: this.#generateCallback(loadedListener),
			progress: this.#generateCallback(progressListener),
			phase: 'create',
		};
		module.create(createEvent);
		return module;
	}

	async unload(moduleName, params, unloadedListener) {
		let jsName = moduleName.replace(/\./g, '/');
		const module = this.loadedModules[moduleName] ?? (await import(/*webpackIgnore: true*/ `./${jsName}.js`));
		this.loadedModules[moduleName] = module;
		let destroyEvent = {
			params: params,
			engine: this,
			complete: unloadedListener,
			phase: 'destroy',
		};
		module.destroy(destroyEvent);
	}

	pause() {
		this.paused = true;
	}

	resume() {
		this.paused = false;
		if (this.hasEventListener('exitframe', this.pauseBind)) {
			this.removeEventListener('exitframe', this.pauseBind);
		}
	}

	step() {
		this.pauseBind = !this.pauseBind ? this.pause.bind(this) : this.pauseBind;

		if (!this.hasEventListener('exitframe', this.pauseBind)) {
			this.addEventListener('exitframe', this.pauseBind);
		}

		this.paused = !this.paused;
	}

	getInfo(property) {
		return this.info[property];
	}

	setFullscreen(value) {
		if (value) {
			if (this.canvas.requestFullscreen) {
				this.canvas.requestFullscreen();
			} else if (this.canvas.webkitRequestFullscreen) {
				this.canvas.webkitRequestFullscreen();
			} else if (this.canvas.msRequestFullscreen) {
				this.canvas.msRequestFullscreen();
			}
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			} else if (document.msExitFullscreen) {
				document.msExitFullscreen();
			}
		}
	}

	#preventDefault(event) {
		event.preventDefault();
	}

	setCanvasLock(value) {
		this.canvasLocked = value;
		if (value) {
			for (let lockIndex = 0; lockIndex < lockCanvasEvents.length; lockIndex++) {
				this.canvas.addEventListener(lockCanvasEvents[lockIndex], this.#preventDefault);
			}
		} else {
			for (let lockIndex = 0; lockIndex < lockCanvasEvents.length; lockIndex++) {
				this.canvas.removeEventListener(lockCanvasEvents[lockIndex], this.#preventDefault);
			}
		}
	}
}

export { ZetoEngine };
