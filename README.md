# ZetoEngine2D

Javascript canvas engine. Inspired by Solar2D and Phaser. Uses same calls and 2D structure as Solar2D, while asset loading is similar to Phaser. Uses Canvas2D and Matter.js for physics. WebGL is not currently supported but is a planned upgrade.

For a live demo, visit [ZetoEngine2D author page](https://basiliogerman.com). Works on desktop and mobile.

## Getting started

- Download the latest js file from the dist folder.
- Place `zeto.js` in your javascript folder or its own folder. your game files should be in the same folder as `zeto.js` or a subfolder.
- ZetoEngine2D uses Matter.js for physics. You can include it in your project by including the `matter.js` file in your project. ZetoEngine2D uses version 0.19.0. Future versions might also work, but are not tested. If you do not include Matter.js, the engine will still work, but you will not be able to use physics. Matter.js should be loaded before `zeto.js`.
- ZetoEngine2D will load any game files relative to the location of `zeto.js`. This means that if you have a file in a subfolder, you can include it in your game by using the path relative to `zeto.js`.
- Your HTML file should include a canvas element with the id `canvas`. This is where the game will be rendered. You can also include an optional `canvas` parameter in the `new ZetoEngine()` call to specify a different canvas id.
- The following is an HTML template for your game. You can copy and paste this into your project and modify it as needed. This template loads the engine and the game files. The engine is started with the `new ZetoEngine()` call. The `moduleName` parameter is the name of the module that contains the game code, relative to the location of `zeto.js`. In this case, ZetoEngine2D would look for a file inside `/js/game/` called `main.js`.

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>

  <body style="background-color: #000000;">
    <canvas id="canvas"></canvas>
    <script src="/js/libs/matter.js"></script>
    <script src="/js/zeto.js"></script>
    <script>
      new ZetoEngine({ moduleName: "game.main", smoothing: true });
    </script>
  </body>
</html>
```

The following is an example of a game module. This module is located in `js/game/main.js`. The module should export two functions: `create` and `destroy`. The `create` function is called when the game is started, and the `destroy` function is called when the game is stopped. The `create` function should load assets and set up the game, while the `destroy` function should clean up any resources used by the game. This template shows how to load assets and set up a loading screen. The `onAssetsProgress` function is called while assets are loading, and the `onAssetsLoaded` function is called when all assets are loaded. The `resizeLoadingListener` function is called when the window is resized and resizes the loading bar to fit the window. The `createLoadingGroup` function creates the loading screen. The `create` function creates the loading screen and loads assets. The `destroy` does nothing since we do not switch scenes in this example.

One of the most important aspects is that you will receive the engine object as a parameter in the create & destroy functions. This object is used to used to create objects, load assets, play sounds and more. A complete list of the engine object properties and functions is available in the API Reference section. The following is an example of a game module:

```javascript
var persistedString = localStorage.getItem('persisted');
var persistedData = JSON.parse(persistedString);

var images = [
	// { id: 'ship', filename: './images/ships/spaceship.png' },
];

var audio = [
	// { id: 'click', filename: './sounds/click.mp3', maxSources: 1 },
];

var data = [ 
	// { id: 'myparticle', filename: './particles/myparticle/myparticle.json' },
];

var engine;
var loadingText, loadingGroup, loadingBarGroup, loadingBar, camera;

function onAssetsProgress(event) {
	loadingText.text = 'Loading assets ... ' + Math.floor(event.progress * 100) + '%';
	loadingBar.xScale = event.progress * 0.5;
}

function onTouch(event) {

}

function onKey(event) {

}

function onAssetsLoaded(event) {
	engine.physics.setGravity(0, 0);

	camera = engine.newCamera(engine.cX, engine.cY);
	camera.zoom = 0.7;
	engine.addEventListener('resize', function (event) {
		camera.x = engine.cX;
		camera.y = engine.cY;
	});

    loadingText.text = 'Welcome!';
    var introZoom = engine.getInfo('isMobile') ? 0.75 : 1;
    engine.transition.to(camera, { zoom: introZoom, time: 2000, easing: ZetoEasing.outQuad });

    engine.transition.to(loadingBarGroup, { alpha: 0, delay: 200, time: 300 });
    engine.transition.to(loadingGroup, {
        alpha: 0, delay: 340, time: 1600, onComplete: function (event) {
            loadingText = engine.remove(loadingText);
            loadingGroup = engine.remove(loadingGroup);
            engine.removeEventListener('resize', resizeLoadingListener);
        }
    });

    engine.addEventListener('touch', onTouch);
    engine.addEventListener('key', onKey);
    engine.physics.start();

    camera.damping = 0;

	engine.showFPS = true;
	engine.debug = true;
	loadingGroup.toFront();
}

function resizeLoadingListener(event) {
	loadingBarGroup.x = engine.cX; // center the loading bar if the window is resized
	loadingBarGroup.y = engine.cY; 
}

function createLoadingGroup() {
	loadingGroup = engine.newGroup();
	var fadeRect = engine.newRect(engine.cX, engine.cY, engine.width, engine.height);
	fadeRect.fillColor = '#000000';
	loadingGroup.insert(fadeRect);

	loadingBarGroup = engine.newGroup();
	loadingBarGroup.x = engine.cX;
	loadingBarGroup.y = engine.cY;
	engine.addEventListener('resize', resizeLoadingListener);

	loadingGroup.insert(loadingBarGroup);

	var loadingBarBg = engine.newRect(0, 0, 320, 16);
	loadingBarBg.fillColor = '#333333';
	loadingBarGroup.insert(loadingBarBg);

	loadingBar = engine.newRect(0, 0, 320, 16);
	loadingBar.fillColor = '#00FF00';
	loadingBar.xScale = 0.01;
	loadingBarGroup.insert(loadingBar);

	loadingText = engine.newText({ text: 'Loading assets ...', x: 0, y: 32, font: 'Arial', fontSize: 20 });
	loadingText.fillColor = '#BBBBBB';
	loadingBarGroup.insert(loadingText);
}
//////////////////////////////////////////////////////
export function create(event) {
	engine = event.engine;

    createLoadingGroup();
	engine.loadAssets(images, audio, data, event.complete(onAssetsLoaded), event.progress(onAssetsProgress));
}

export function destroy(event) {
	event.complete();
}
```

Don't forget to make your games responsive! The engine will dispatch a `resize` event when the window is resized. You can listen to this event and adjust your game accordingly.

## API Reference

The ZetoEngine2D API is similar to Solar2D. The following is a rough outline of the API. The API is still in development and is subject to change. For more information, see the source code.

### Engine

The ZetoEngine class is the main class of the ZetoEngine2D. It is responsible for rendering the game, loading assets, and managing the game loop. The following properties and functions are available in the ZetoEngine class. Most of the properties are meant to be read-only, but some can be modified to change the behavior of the engine.

 - **engine.debug = false** Set to true to enable visual debug mode
 - **engine.debugTapColor = '#FF00FFBB'**
 - **engine.debugBoundsColor = '#FF0000BB'**
 - **engine.debugColor = '#FFFFFFBB'**
 - **engine.mouseX = 0** Read only value of the mouse x position
 - **engine.mouseY = 0** Read only value of the mouse y position
 - **engine.tapTime = 200** Time in milliseconds to consider a touch event as a tap
 - **engine.rootGroup** The root group of the engine, all objects are inserted into this group by default
 - **engine.fillColor = 'white'** Default fill color for objects
 - **engine.clearColor = 'black'** Default clear color for the canvas
 - **engine.clearAlpha = 1** Default clear alpha for the canvas, any value between 0 and 1, values below 1 will create a ghosting effect
 - **engine.defaultFontName = 'Arial'** Default font name for text objects
 - **engine.defaultFontSize = 20** Default font size for text objects
 - **engine.canvas** The canvas element
 - **engine.context** The canvas context
 - **engine.audioContext** The audio context
 - **engine.cX** Read only value of the center x position of the canvas
 - **engine.cY** Read only value of the center y position of the canvas
 - **engine.width** Read only value of the width of the canvas
 - **engine.height** Read only value of the height of the canvas
 - **engine.paused = false** Read only value of the paused state of the engine, use engine.pause(), engine.step() and engine.resume() to control the engine
 - **engine.showFPS = false** Set to true to show the frames per second in the top left corner
 - **engine.fps** Read only value of the frames per second

Other important properties containing other parts of the engine are:

 - **engine.transition** The transition engine, used to animate objects
 - **engine.particles** The particle engine, used to create particle systems
 - **engine.physics** The physics engine, used to create physics objects
 - **engine.widgets** The widgets engine, used to create buttons and other widgets
 - **engine.strings** The strings engine, used to localize strings

The following functions create Engine Objects.

 - **engine.newGroup(x, y)** Creates a new group object
 - **engine.newContainer(x, y, width, height)** Creates a new container object. Containers are like groups, but they have a width and height. Everything inside the container is clipped to the container bounds.
 - **engine.newCamera(x, y)** Creates a new camera object
 - **engine.newText(options)** Creates a new text object
 - **engine.newImage(id, x, y)** Creates a new image object
 - **engine.newImageRect(id, x, y, width, height)** Creates a new image rect object
 - **engine.newCircle(x, y, radius)** Creates a new circle object
 - **engine.newRoundedRect(x, y, width, height, radius)** Creates a new rounded rect object
 - **engine.newRect(x, y, width, height)** Creates a new rect object
 - **engine.newPolygon(x, y, vertices)** Creates a new polygon object
 - **engine.newImageSheet(id, sheetData)** Creates a new image sheet object, to be used with sprites or as a fill
 - **engine.newSprite(imageSheet, sequenceData, x = 0, y = 0)** Creates a new sprite object
 - **engine.remove(object)** Removes an object from the engine

Other functions available in the Engine class are:

 - **engine.getImageFill(id, pattern, repeat = 'repeat')** Returns an image fill object, to be used with engine objects that have the `fill` property. The pattern is optional and can be `repeat`, `repeat-x`, `repeat-y`, `no-repeat`. The fill object can be transitioned and has the following properties:
	- **fill.x** The x position of the fill
	- **fill.y** The y position of the fill
	- **fill.xScale** The x scale of the fill
	- **fill.yScale** The y scale of the fill
	- **fill.rotation** The rotation of the fill
 - **engine.getData(id)** Returns a data object, loaded previously with the `loadAssets` function, used to load JSON data, and can be used to create particle emitters
 - **engine.loadAssets(images, audio, data, onComplete, onProgress)** Loads assets, calls onComplete when all assets are loaded, and onProgress while assets are loading, use along with the `create` `event.complete` and `event.progress` functions
 - **async engine.load(moduleName, params, loadedListener, progressListener)** Loads a module, calls loadedListener when the module is loaded, and progressListener for each asset loaded. `moduleName` must be in dot format, for example `game.main` like in Lua.
 - **async engine.unload(moduleName, params, unloadedListener)** Unloads a module, calls unloadedListener when `event.complete` is called inside the `destroy` function on the module being unloaded
 - **engine.pause()** Pauses the engine. This will pause all transitions, timers, physics, and particles. `enterframe` and `exitframe` events will still be called, with a `delta` property of 0 and a `timestamp` property of the last frame. `frame` property will still be incremented
 - **engine.resume()** Resumes the engine
 - **engine.step()** Steps the engine one frame
 - **engine.getInfo(property)** Gets information about the engine, available properties are `isMobile`
 - **engine.setFullscreen(value)** Sets the engine to fullscreen mode (iOS on iPhones does not support fullscreen)
 - **engine.setCanvasLock(value)** Locks all scrolling when the canvas is touched. Useful for games that need a steady canvas
 - **engine.getAsset(type, id)** Returns a raw asset object, used to get the raw image, audio or data object. The type can be `image`, `audio`, or `data`

When using `load` and `unload`, the `moduleName` parameter is the name of the module that contains the game code, relative to the location of `zeto.js`. The `params` parameter is an object that is passed to the module on the called function, you can retrieve these params in the `event.params` property. `load` will call the exported `create` function in the module, and `unload` will call the exported `destroy` function in the module.

The `loadedListener` and the `progressListener` function will be called when you call the `complete` and `progress` functions in the module. `unloadedListener` will be called when you call the `complete` function as well, but inside the `destroy` function. on `create`, The `event.complete()` and `event.progress()` functions accept a function as a parameter, and this function will be called after the external `loadedListener`, `progressListener` or `unloadedListener` functions are called. For example:

```html
<script src="/js/arcade/matter.js"></script>
<script src="/js/arcade/zeto.js"></script>
<script type="module">
	var engine = new ZetoEngine({
		moduleName: 'menu',
		moduleParams: {
			locale: myJSLocaleFunction(),
		},
		loadedListener: function(event) {
			myJSFunction(event.result.hello); // Will output 'world'
		},
		unloadedListener: function(event) {
			myJSFunction('Module unloaded');
		},
		smoothing: true,
	});
	engine.clearColor = "white";
	engine.fillColor = "black";
</script>
```

```javascript
function onAssetsProgress(event) {
	// Assumes you have a loadingText object
	loadingText.text = 'Loading assets ... ' + Math.floor(event.progress * 100) + '%';
}

function onAssetsLoaded(event) {
	// Assumes you have a createLoadingText() function
	createLoadingText();

	return { // This object will be passed to the external `loadedListener` function in the HTML script
		hello: 'world',
	}
}

export function create(event) {
	engine = event.engine;

	let locale = event.params.locale;
	
	// This will fire `onAssetsLoaded` after all assets are loaded and then the `loadedListener` in the HTML script
	// Same for progress, it will fire `onAssetsProgress` and then the `progressListener` in the HTML script (If any)
	engine.loadAssets(images, audio, data, event.complete(onAssetsLoaded), event.progress(onAssetsProgress));
}

export function destroy(event) {
	event.complete(); // Does not accept parameter, makes `unloadedListener` function in the HTML script be called
}
```

With the `engine.getImageFill` function, you can create for example a rounded rectangle, circle or polygon with an image fill. The following example creates a rounded rectangle with an image fill:

```javascript
let roundedRect = engine.newRoundedRect(0, 0, 380, 300, 20);
roundedRect.fill = engine.getImageFill("win-bg", true);
```
	
### Event Objects

All objects, including the engine, transition, particle and physics engine are event objects, this means that you can add event listeners to them. The following functions are available in the Event Object class. 
 - **object.addEventListener(eventName, listener)** Adds an event listener to the object
 - **object.removeEventListener(eventName, listener)** Removes an event listener from the object
 - **object.hasEventListener(eventName)** Returns true if the object has any listeners for the event
 - **object.dispatchEvent(eventName, event)** Dispatches an event to the object

Available events for the engine object are:

 - **enterframe** This event is called every frame before rendering the scene graph
 - **exitframe** This event is called every frame after rendering the scene graph
 - **resize** This event is called when the window is resized
 - **touch** This event is called when a touch event or mouse event is detected, excluding hovering the mouse
 - **wheel** This event is called when a mouse wheel event is detected
 - **tap** This event is called when a tap event is detected
 - **key** This event is called when a keyboard event is detected

Returning `true` on `touch` or `tap` events will prevent the event from being propagated to other objects or engine level listeners.

The `touch` and `key` events will have the following phases:

 - **began** When the touch or key event starts
 - **moved** When the touch or key event moves
 - **ended** When the touch or key event ends
 - **hold** When the touch or key event is held

### Engine Objects

Engine objects are the main objects that are used to create the game. They can be created using the `engine.newGroup`, `engine.newText`, `engine.newImage`, `engine.newImageRect`, `engine.newCircle`, `engine.newRoundedRect`, `engine.newRect`, `engine.newPolygon`, `engine.newImageSheet`, `engine.newSprite`, `engine.newButton` functions. The following properties and functions are available in the Engine Object class. These are much like Solar2D Display Objects.

 - **object.fillColor** The fill color of the object, can be in hex format or a color name as it would in CSS
 - **object.alpha = 1** The alpha value of the object, any value between 0 and 1
 - **object.isVisible = true** If the object is visible or not
 - **object.parent** The parent group of the object
 - **object.x = 0** The x position of the object, relative to its parent
 - **object.y = 0** The y position of the object, relative to its parent
 - **object.strokeWidth = 0** The stroke width of the object if available
 - **object.stroke** The stroke color of the object if available, can be in hex format or a color name as it would in CSS
 - **object.width** The width of the object
 - **object.height** The height of the object
 - **object.anchorX = 0.5** The anchor x position of the object, any value between 0 and 1
 - **object.anchorY = 0.5** The anchor y position of the object, any value between 0 and 1
 - **object.rotation = 0** The rotation of the object in degrees
 - **object.xScale = 1** The x scale of the object
 - **object.yScale = 1** The y scale of the object
 - **object.fill** The fill object of the object, can be an image or a gradient
 - **object.path** The path object of the object, `ZetoEnginePath` object is a wrapper for a `Path2D` object
 - **object.worldTransform** A DOMMatrix object representing the world transform of the object

And the following functions are available in the Engine Object class.

 - **object.setFillColor(r, g, b, a = 1)** Sets the fill color of the object, values from 0 to 1
 - **object.destroy()** Destroys the object, same effect as calling `engine.remove(object)`
 - **object.toFront()** Brings the object to the front of its parent group
 - **object.toBack()** Sends the object to the back of its parent group
 - **object.localToContent(x, y)** Converts a local point to a content (global) point
 - **object.contentToLocal(x, y)** Converts a content (global) point to a local point

Available listeners are:

 - **tap** This event is called when a tap event is detected on the object
 - **touch** This event is called when a touch event or mouse event is detected on the object, excluding hovering the mouse. The event will have the following properties:
	- **event.phase = 'began', 'moved', 'ended', 'hold'**
	- **event.x** The x position of the touch event
	- **event.y** The y position of the touch event
	- **event.deltaX** The change in x position since the `began` phase
	- **event.deltaY** The change in y position since the `began` phase
 - **hover** This event is called when a mouse hover event is detected on the object
 - **enterFrame** This event is called every frame before rendering the object
 - **exitFrame** This event is called every frame after rendering the object
 - **finalize** This event is called when the object is destroyed

#### Groups

Groups are used to group objects together. They can be created using the `engine.newGroup` function. The following properties and functions are available in the Group class.

 - **group.children** An array of the children of the group
 - **group.anchorChildren = false** If true, the children of the group will be anchored to the group, this makes the group have `width` and `height` properties

And the following function:

 - **group.insert(object, skipUpdate = false)** Inserts an object into the group, if `skipUpdate` is true, the group will not update its bounds. Use for faster insertion of objects

#### Text

Text objects are used to display text. They can be created using the `engine.newText(options)` function. The following are accepted options for the text object:

 - **options.fontName** The font name of the text. Default is `engine.defaultFontName`
 - **options.fontSize** The font size of the text. Default is `engine.defaultFontSize`
 - **options.text** The text to display
 - **options.width** The width of the text object, if set, the text will wrap to this width
 - **options.align** The alignment of the text, can be `left`, `center`, or `right`, default is `center`
 - **options.x** The x position of the text object
 - **options.y** The y position of the text object
 - **options.spacing** The spacing between lines of multi line text, default is 0.5

Text supports the newline character `\n` for multiline text. The following properties and functions are available in the Text class.

 - **text.text** The text to display
 - **text.fontName** The font name of the text
 - **text.fontSize** The font size of the text

#### Sprites

Sprites are used to animate images. They can be created using the `engine.newSprite` function. You need to create an ImageSheet object with the `engine.newImageSheet` function. The ImageSheet object is created with a sheetData object that contains the width, height, and number of frames in the image sheet. The sequenceData object contains the sequence name, start frame, frame count, and time in milliseconds for each sequence.

The following properties and functions are available in the Sprite class.

 - **sprite.frame** The current frame of the sprite
 - **sprite.playing = false** If the sprite is playing

And the following functions:

 - **sprite.setSequence(sequenceName)**
 - **sprite.play()**
 - **sprite.stop()**

 #### Sprite Example

```javascript
var sequenceData = [
    { name: "idle", start: 0, count: 7, time: 350 }
];
var sheetData = { width: 64, height: 64, numFrames: 7 };

var coinSheet = engine.newImageSheet('coin_sheet', sheetData);

var coinSprite = engine.newSprite(coinSheet, sequenceData)
coinSprite.setSequence("idle");
coinSprite.play();
```

### Widgets

The widgets class is responsible for creating and managing widgets. It can be accessed through the `engine.widgets` property. The following functions are available in the Widgets class. The widgets class is still in development and is subject to change. The syntax is similar to Solar2D, but with more customization options.

 - **engine.widgets.newButton(options)** Creates a new button widget
 - **engine.widgets.newScrollView(options)** Creates a new scroll view container
 - **engine.widgets.setEnabled(enabled, tag)** Enables or disables all widgets. If an optional tag is provided, only widgets with the same tag will be enabled or disabled

The widgets engine dispatches the following events:

 - **enabled** This event is called when the widgets are enabled or disabled

#### Buttons

Similar to Solar2D widget library, with a bit more customization for frames, you can use 2, 3, 6 or 9 frames for the button. ZetoEngine expects 3 frames for the button, the default, pressed and disabled states. If only 2 frames are provided, the disabled state will be the same as the default state. If 6 frames are provided, the disabled state will be the same as the pressed state. For 6 and 9 frames, frame 1 is the left side, frame 2 is the middle, and frame 3 is the right side for the default state.

The following options are available when creating a button with the `engine.widgets.newButton(options)` function:

 - **options.sheet** The image sheet object to use for the button. The sheet should contain the frames for the button states
 - **options.shape** The shape of the button, can be `rect`, `roundedRect`, `circle`
 - **options.labelXOffset** The x offset of the label, relative to the button
 - **options.labelYOffset** The y offset of the label, relative to the button
 - **options.labelAnchorX** The x anchor of the label, any value between 0 and 1
 - **options.labelAnchorY** The y anchor of the label, any value between 0 and 1
 - **options.labelColor** The color of the label
 - **options.font** The font of the label
 - **options.fontSize** The font size of the label
 - **options.label** The text of the label
 - **options.labelAlign** The alignment of the label, can be `left`, `center`, `right`
 - **options.onTap;** The function to call when the button is tapped
 - **options.onRelease;** The function to call when the button is released
 - **options.onHold;** The function to call when the button is held
 - **options.onPress;** The function to call when the button is pressed
 - **options.tag** A tag to identify the button, used to disable or enable the button collectively with `engine.widgets.setEnabled(enabled, tag)` the default tag is `default`

You will also have access to the following properties in the button object:

 - **button.defaultGroup** The default frame group, can be used to insert icons or other objects
 - **button.pressedGroup** The pressed frame group, can be used to insert icons or other objects
 - **button.disabledGroup** The disabled frame group, can be used to insert icons or other objects

And the following functions:

 - **setEnabled(enabled)** Enables or disables the button
 - **setLabel(label)** Sets the label of the button

Note that if `engine.widgets.setEnabled(false, tag)` is called, even before the button is created, all buttons with the same or default tag will be disabled. You can enable or disable all widgets with this function. This is useful for creating a pause menu or other UI elements that need to be disabled when the game is paused, this way, all buttons on the game will be disabled and the ones on the pause menu can be enabled.

#### ScrollViews

The following options are available when creating a scroll view with the `engine.widgets.newScrollView(options)` function:

 - **options.x** The x position of the scroll view
 - **options.y** The y position of the scroll view
 - **options.width** The width of the scroll view
 - **options.height** The height of the scroll view
 - **options.horizontalScrollDisabled = false** If `true`, the scroll view will lock the x position and will not scroll horizontally
 - **options.verticalScrollDisabled = false** If `true`, the scroll view will lock the y position and will not scroll vertically
 - **options.scrollWidth = 0** The maximum x position of the scroll view, ignored if `lockX` is `true`
 - **options.scrollHeight = 0** The maximum y position of the scroll view, ignored if `lockY` is `true`
 - **options.scrollOffsetX = 0** Leftmost scroll limit of the scroll view, will work in conjunction with `scrollWidth`
 - **options.scrollOffsetY = 0** Topmost scroll limit of the scroll view, will work in conjunction with `scrollHeight`
 - **options.scrollX = 0** The x position of the scroll view
 - **options.scrollY = 0** The y position of the scroll view
 - **options.fillColor** The fill color of the scroll view background, defaults to transparent

### Timer Engine

The Timer Engine class is responsible for creating and managing timers. It can be accessed through the `engine.timer` property. The following functions are available in the Timer Engine class. The Timer Engine is similar to the Solar2D timer engine.

 - **engine.timer.performWithDelay(delay, listener, iterations = 1)** Calls a function after a delay in milliseconds, returns a timer object. The listener function will receive the timer object as a `target` property
 - **engine.timer.cancel(timer)** Cancels a timer created with performWithDelay

### Transition Engine

The Transition Engine class is responsible for animating objects in the game. It can be accessed through the `engine.transition` property. The following functions are available in the Transition Engine class. It is similar to the Solar2D transition engine. Time is in milliseconds. The following functions are available in the Transition Engine class.

 - **engine.transition.to(object, params = {})** This function animates an object to the specified properties. Returns a transition object
 - **engine.transition.from(object, params = {})** This function animates an object from the specified properties. Returns a transition object
 - **engine.transition.cancel(object)** Will cancel all transitions on the object or the transition object passed as a parameter

Transition parameters are passed as an object to the `to` and `from` functions. You can include any numerical property of the object in the parameters object. The following reserved properties for the transition are available:

 - **params.delay = 0** The delay in milliseconds before the transition starts
 - **params.time = 300** The time in milliseconds for the transition
 - **params.easing** The easing function to use for the transition
 - **params.onStart** The function or array of functions to call when the transition starts, after the delay
 - **params.onComplete** The function or array of functions to call when the transition is complete

 #### Easing Functions

 Available easing functions are:

 - **ZetoEasing.linear**
 - **ZetoEasing.inQuad**
 - **ZetoEasing.outQuad**
 - **ZetoEasing.inOutQuad**
 - **ZetoEasing.outBack**
 - **ZetoEasing.inBack**
 - **ZetoEasing.inOutBack**
 - **ZetoEasing.inSine**
 - **ZetoEasing.outSine**
 - **ZetoEasing.inOutSine**

 You can also create your own easing functions. The following is the linear easing function:

```javascript
function linear(t, tMax, start, delta) {
	return delta * t / tMax + start;
}
```

 #### Transition Examples

 - Move an object to x: 100, y: 100 in 1 second

```javascript
engine.transition.to(object, { x: 100, y: 100, time: 1000, easing: ZetoEasing.outQuad });
```

 - Make an object transition to other object position in 1 second, and call a function when the transition is complete. This will move `object.x` to `otherObject.x` and `object.y` to `otherObject.y`

```javascript
engine.transition.to(object, { x: otherObject, y: otherObject, time: 1000, easing: ZetoEasing.outQuad, onComplete: function(event) {
    console.log('Transition complete');
}});
```

 - Increase the coin counter text to the new value in 1 second

```javascript
engine.transition.to(coinCounterText, { text: newValue, time: 1000, easing: ZetoEasing.outQuad });
```

- Multiple listeners can be added to the `onComplete` property, like this:

```javascript
engine.transition.to(object, { x: 100, y: 100, time: 1000, easing: ZetoEasing.outQuad, onComplete: [function(event) {
	console.log('Transition complete');
}, function(event) {
	console.log('Another function');
}]});
```

Thats right! You can animate values to other objects, numeric text properties, and call multiple listeners using `onStart` and `onComplete` properties. The `onStart` property will be called after the delay, and the `onComplete` property will be called when the transition is complete.

### Particle Engine

The Particle Engine class is responsible for creating and managing particle systems. It can be accessed through the `engine.particles` property. You can use Particle Designer to create particle systems and export them to JSON. The following functions are available in the Particle Engine class. Please note that the Particle Engine is still in development and is subject to change. Color transitions are NOT supported yet.

The Particle engine has the following functions available:

 - **engine.particles.newEmitter(emitterParams)** Creates and returns a new emitter object

Aside from the regular emitter parameters, you can specify the following additional parameters in the emitterParams object:

 - **emitterParams.x = 0** The x position of the emitter
 - **emitterParams.y = 0** The y position of the emitter
 - **emitterParams.absolutePosition = true/group** If true, the emitter will use absolute positioning, if group, the emitter will use group positioning. This means that the emitter will use the group as the parent for particles, useful to create effects like particle trails like smoke or fire

#### Emitter Parameters

Emitter parameters are usually loaded from a JSON file exported from Particle Designer. You can specify the following additional parameters in the emitterParams object:

 - **emitterParams.x = 0**
 - **emitterParams.y = 0**

#### Emitter functions

 - **start()** Starts the emitter
 - **stop()** Stops the emitter. Particles will continue to exist and move until they expire
 - **pause()** Pauses the emitter and all particles
 
 ### Physics Engine

The Physics Engine class is responsible for creating and managing physics objects. It can be accessed through the `engine.physics` property. The Physics Engine uses Matter.js for physics. The following functions are available in the Physics Engine class. Please note that the Physics Engine is still in development and is subject to change. The syntax is similar to Solar2D, bodies are added after they have been created.

Bodies are created using the `engine.physics.addBody` function. The `object` parameter is the object to attach the body to. The `bodyType` parameter is the type of body to create. The `options` parameter is an object that contains the body properties.

The physics engine has the following functions available:

 - **addBody(object, bodyType, options)** Adds a physics body to an object
	- bodyType = 'dynamic', 'static'
 - **removeBody(object)** Removes a physics body from an object
 - **setGravity(x, y)** Sets the gravity of the physics engine
 - **start()** Starts the physics engine
 - **pause()** Pauses the physics engine
 - **stop()** Stops the physics engine

 #### addBody options

 The following options are available when creating a body:

 - **options.density = 1** The density of the object
 - **options.bounce = 0.1** The bounce of the object
 - **options.friction = 0.1** The friction of the object
 - **options.filter = {}** The collision filter properties. See Matter.js documentation for more information
	- **filter.category** The category of the object
	- **filter.mask** The mask of the object
	- **filter.group** The group of the object
 - **options.radius = false** The radius of the object
 - **options.shape** A list of vertices to use as the shape of the object
 - **options.resolution = 10** The number of sides to use when creating a circle
 - **options.isSensor = false** If the object is a sensor

If the `shape` property is set, the `radius` property is ignored. The `shape` property can be a list of vertices. The `filter` property is an object that contains the collision filter properties. These properties are passed to Matter.js when creating the object.body. 

#### Bodies

After `addBody` is called, the object will have a `body` property that contains the physics object.body. The following properties are available in the body object:

 - **object.body.fixedRotation = false** If a body has fixed rotation, if true the body will not rotate
 - **object.body.x** The x position of the body
 - **object.body.y** The y position of the body
 - **object.body.rotation** The rotation of the body in radians
 - **object.body.isSensor = false** If the body is a sensor
 - **object.body.matterBody** The Matter.js body object

And the following functions are available in the body object:

 - **object.body.applyForce(x, y)** Applies a force to the body at the center
 - **object.body.setLinearVelocity(x, y)** Sets the linear velocity of the body
 - **object.body.getLinearVelocity()** Gets the linear velocity of the body
 - **object.body.applyTorque(torque)** Applies a torque to the body
 - **object.body.getAngularVelocity()** Returns the angular velocity of the body
 - **object.body.setAngularVelocity(angularVelocity)** Sets the angular velocity of the body
 - **object.body.setMass(mass)** Sets the mass of the body
 - **object.body.getMass()** Returns the mass of the body

You can still do anything you want with the Matter.js body object. The `matterBody` property contains the Matter.js body object. Most of these functions and properties are just wrappers for the Matter.js body object. If you are familiar with Solar2D, the main difference is that body properties are accessed through the `object.body` property instead of the `object` property.

Available body and engine listeners are:

 - **collision**

 The collision listener is called when two bodies collide. The event will have the following properties:

 - **event.x** The x position of the first contact point
 - **event.y** The y position of the first contact point
 - **event.phase = 'began', 'ended'**
 - **event.target** The object that the listener is attached to
 - **event.other** The object that the target is colliding with
 - **event.collision** The original pair collision object emitted by Matter.js 
 - **event.pair** The original pair object emitted by Matter.js

You can either set the listener on the engine object to listen to all collisions or set the listener on a specific object to listen to collisions with that object.

### Strings Engine

The Strings Engine class is responsible for localizing strings in the game. It can be accessed through the `engine.strings` property. The following functions are available in the Strings Engine class.

 - **engine.strings.setLocale(locale)** Sets the locale of the strings engine
 - **engine.strings.get(key, replace)** Returns a localized string, replacing any placeholders with the replace list
 - **engine.strings.add(strings)** Adds a list of strings to the strings engine

The Strings engine supports the following events:

 - **locale** This event is called when the locale is changed

 #### Strings Example

```javascript
engine.strings.add({
	en: {
		'hello': 'Hello, :name!'
	},
	es: {
		'hello': '¡Hola, :name!'
	}
});

engine.strings.setLocale('en');
let helloString = engine.strings.get('hello', { name: 'Zeto' });
console.log(helloString); // Hello, Zeto!
```

### Audio

ZetoEngine2D has a simple audio engine that can be used to play audio files. The audio engine uses the Web Audio API to play audio files. The following functions are available in the audio engine.

 - **async engine.audio.play(id, volume = 1, time = 0, loop = false, onComplete = false)** Plays an audio file, returns an audio object, further documentation below
 - **engine.audio.setVolume(volume)** Sets the global volume of the audio engine. Any value between 0 and 1 is accepted. Setting the volume to 0 will mute all playing audio and future audio. The default volume is 1

The audio function `engine.audio.play(id, volume = 1, time = 0, loop = false, onComplete = false)` plays an audio file loaded with the `engine.loadAssets` function. The `id` parameter is the id of the audio file. The `volume` parameter is the volume of the audio file, any value between 0 and 1. The `time` parameter is the time in milliseconds to start the audio file. The `loop` parameter is a boolean that determines if the audio file should loop. The `onComplete` parameter is a function that is called when the audio file is complete.

This function will return an audio object that can be used to control the audio file. The audio object has the following properties, which can even be modified using the `transitions` engine:

 - **audioObject.volume** The volume of the audio file 
 - **audioObject.pitch** The pitch of the audio file

And the following functions:

 - **audioObject.pause()** Pauses the audio file
 - **audioObject.resume()** Resumes the audio file
 - **audioObject.stop()** Stops the audio file

Stopping the audio file will call the `onComplete` function if it is set.

The audio engine will try to initialize the audio context on the first interaction with the canvas. Playing audio without user interaction is disabled on all browsers

### Building and contributing

To build the engine, you will need Node.js and npm installed. You can install the dependencies by running `npm install`. You can build the engine by running `npm run build`. The engine will be built to the `dist` folder. You can run the tests by running `npm test`.

When testing as a library inside another project, you can use `npm run watch C:\path\to\your\project\` to watch for changes in the engine src files, compile the library and copy the file `zeto.js` to your project any time changes are made. This will copy the files to the folder you specify, and let you test and improve the engine in your project. You are welcome to contribute to the engine, just submit an issue or a pull request.

### Notes

 - The engine is still in development and is subject to change. The API is not final and may change in the future.
 - The engine is designed to be simple and easy to use. It is not meant to be a full-featured game engine like Solar2D or Phaser.
 - The engine is designed to be used with the ZetoEngine2D module system. Modules are loaded and unloaded dynamically, allowing you to create complex games with multiple scenes and assets. This uses the Javascript module system, so you can use `import` and `export` to create modules, this might not work on older browsers.
 - Any feedback is appreciated. If you have any suggestions, find any bugs or want to make a donation, please let us know. You can contact us at [ZetoSoft.com](https://zetosoft.com).
 - All classes are exposed in the global scope, so you can access them directly or extend them. For example, you can create a new class that extends the `ZetoEngineObject` class and add your own properties and draw functions.