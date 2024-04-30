# ZetoEngine2D

Javascript canvas engine. Inspired by Solar2D and Phaser. Uses same calls and 2D structure as Solar2D, while asset loading is similar to Phaser. Uses Canvas2D and Matter.js for physics. WebGL is not currently supported but is a planned upgrade.

For a live demo, visit [ZetoEngine2D author page](https://basiliogerman.com). Works on desktop and mobile.

## Getting started

- Download the latest dist file from this repository and include it in your project. This can be found in the dist folder. Do not include the source files in your project. You must also include the license file in your project. The license file is located in the root of the repository.
- Place `zeto.min.js` in your javascript folder or its own folder. your game files should be in the same folder as `zeto.min.js` or a subfolder.
- ZetoEngine2D uses Matter.js for physics. You can include it in your project by including the `matter.min.js` file in your project. ZetoEngine2D uses version 0.19.0. Future versions might also work, but are not tested. If you do not include Matter.js, the engine will still work, but you will not be able to use physics. Matter.js should be loaded before `zeto.min.js`.
- ZetoEngine2D will load any game files relative to the location of `zeto.min.js`. This means that if you have a file in a subfolder, you can include it in your game by using the path relative to `zeto.min.js`.
- Your HTML file should include a canvas element with the id `canvas`. This is where the game will be rendered. The engine will automatically resize the canvas to fit the window. You can also set the canvas size manually by setting the width and height attributes of the canvas element.
- The following is an HTML template for your game. You can copy and paste this into your project and modify it as needed. This template loads the engine and the game files. The engine is started with the `new Engine()` call. The `moduleName` parameter is the name of the module that contains the game code, relative to the location of `zeto.min.js`. In this case, ZetoEngine2D would look for a file inside `/js/game/` called `main.js`.

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
    <script src="/js/engine.js"></script>
    <script>
      new ZetoEngine({ moduleName: "game.main", smoothing: true });
    </script>
  </body>
</html>
```

The following is an example of a game module. This module is located in `js/game/main.js`. The module should export two functions: `create` and `destroy`. The `create` function is called when the game is started, and the `destroy` function is called when the game is stopped. The `create` function should load assets and set up the game, while the `destroy` function should clean up any resources used by the game. This template shows how to load assets and set up a loading screen. The `onAssetsProgress` function is called while assets are loading, and the `onAssetsLoaded` function is called when all assets are loaded. The `resizeLoadingListener` function is called when the window is resized and resizes the loading bar to fit the window. The `createLoadingGroup` function creates the loading screen. The `create` function creates the loading screen and loads assets. The `destroy` does nothing since we do not switch scenes in this example.

One of the most important aspects is that you will receive the engine object as a parameter in the create & destroy functions. This object is used to used to create objects, load assets, play sounds and more. 

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
    engine.transition.to(camera, { zoom: introZoom, time: 2000, easing: Easing.outQuad });

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

}
```

## API Reference

The ZetoEngine2D API is similar to Solar2D. The following is a rough outline of the API. The API is still in development and is subject to change. For more information, see the source code.

### Engine

The Engine class is the main class of the ZetoEngine2D. It is responsible for rendering the game, loading assets, and managing the game loop. The following properties and functions are available in the Engine class. Most of the properties are meant to be read-only, but some can be modified to change the behavior of the engine.

 - engine.debug = false
 - engine.debugTapColor = '#FF00FFBB'; // magenta
 - engine.debugBoundsColor = '#FF0000BB'; // red
 - engine.debugColor = '#FFFFFFBB'; // white
 - engine.mouseX = 0
 - engine.mouseY = 0
 - engine.tapTime = 200
 - engine.rootGroup
 - engine.fillColor = 'white' // Text and shapes fill color
 - engine.clearColor = 'black'
 - engine.clearAlpha = 1
 - engine.defaultFontName = 'Arial' 
 - engine.defaultFontSize = 20
 - engine.canvas
 - engine.context
 - engine.audioContext
 - engine.cX; // Screen center 
 - engine.cY; // Screen center 
 - engine.width; // Screen width
 - engine.height; // Screen height
 - engine.paused = false
 - engine.showFPS = false
 - engine.fps

The following functions are available in the Engine class. 

 - engine.performWithDelay(delay, listener, iterations = 1)
 - engine.cancelTimer(timer)
 - engine.newGroup(x, y)
 - engine.newCamera(x, y)
 - engine.newText(options)
 - engine.newImage(id, x, y)
 - engine.newImageRect(id, x, y, width, height)
 - engine.newCircle(x, y, radius)
 - engine.newRoundedRect(x, y, width, height, radius) 
 - engine.newRect(x, y, width, height) 
 - engine.newPolygon(x, y, vertices) 
 - engine.newImageSheet(id, sheetData) 
 - engine.newSprite(imageSheet, sequenceData, x = 0, y = 0) 
 - engine.newButton(options) 
 - engine.getImageFill(id) 
 - engine.getData(id) 
 - engine.remove(object) 
 - engine.async playAudio(id, volume = 1, time = 0, loop = false, onComplete = false) 
 - engine.loadAssets(images, audio, data, onComplete, onProgress)
 - engine.async load(moduleName, params, loadedListener, progressListener)
 - engine.async unload(moduleName, params, unloadedListener) 
 - engine.pause()
 - engine.resume()
 - engine.step()
 - engine.getInfo(property)

When using `load` and `unload`, the `moduleName` parameter is the name of the module that contains the game code, relative to the location of `zeto.min.js`. The `params` parameter is an object that is passed to the module on the called function, you can retrieve these params in the `event.params` property. `load` will call the exported `create` function in the module, and `unload` will call the exported `destroy` function in the module.

The `loadedListener` and the `progressListener` function will be called when you call the `complete` and `progress` functions in the module. `unloadedListener` will be called when you call the `complete` function as well, but inside the `destroy` function. The `complete` and `progress` functions accept a function as a parameter, and this function will be called after the external `loadedListener`, `progressListener` or `unloadedListener` functions are called.

### Event Objects

All objects, including the engine, transition, particle and physics engine are event objects, this means that you can add event listeners to them. The following functions are available in the Event Object class. 

 - object.addEventListener(eventName, listener)
 - object.removeEventListener(eventName, listener)
 - object.hasEventListener(eventName)
 - object.dispatchEvent(eventName, event)

Available events for the engine object are:

 - enterframe
 - exitframe
 - resize
 - touch
 - wheel
 - tap
 - key

### Engine Objects

Engine objects are the main objects that are used to create the game. They can be created using the `engine.newGroup`, `engine.newText`, `engine.newImage`, `engine.newImageRect`, `engine.newCircle`, `engine.newRoundedRect`, `engine.newRect`, `engine.newPolygon`, `engine.newImageSheet`, `engine.newSprite`, `engine.newButton` functions. The following properties and functions are available in the Engine Object class. These are much like Solar2D Display Objects.

 - object.fillColor
 - object.alpha = 1
 - object.isVisible = true
 - object.parent
 - object.x = 0
 - object.y = 0
 - object.strokeWidth = 0
 - object.stroke
 - object.width
 - object.height
 - object.anchorX = 0.5
 - object.anchorY = 0.5
 - object.rotation = 0
 - object.xScale = 1
 - object.yScale = 1
 - object.fill
 - object.path

And the following functions are available in the Engine Object class.

 - object.setFillColor(r, g, b, a = 1)
 - object.destroy()
 - object.toFront()
 - object.toBack()

Available listeners are:

 - tap
 - touch
 - hover
 - enterFrame
 - exitFrame
 - finalize

#### Groups

Groups are used to group objects together. They can be created using the `engine.newGroup` function. The following properties and functions are available in the Group class.

 - group.children
 - group.anchorChildren = false

And the following function:

 - group.insert(object, skipUpdate = false)

#### Text

Documentation coming soon but functions are similar to Solar2D.

#### Sprites

Sprites are used to animate images. They can be created using the `engine.newSprite` function. You need to create an ImageSheet object with the `engine.newImageSheet` function. The ImageSheet object is created with a sheetData object that contains the width, height, and number of frames in the image sheet. The sequenceData object contains the sequence name, start frame, frame count, and time in milliseconds for each sequence.

The following properties and functions are available in the Sprite class.

 - sprite.frame
 - sprite.playing = false

And the following functions:

 - sprite.setSequence(sequenceName)
 - sprite.play()
 - sprite.stop()

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

#### Buttons

Similar to Solar2D widget library, with a bit more customization for frames, you can use 2, 3, 6 or 9 frames for the button. 

The following options are available when creating a button:

 - options.sheet
 - options.labelXOffset
 - options.labelYOffset
 - options.labelAnchorX
 - options.labelAnchorY
 - options.labelColor
 - options.font
 - options.fontSize
 - options.label
 - options.labelAlign
 - options.onTap;
 - options.onRelease;
 - options.onHold;
 - options.onPress;

You will also have access to the following properties in the button object:

 - button.defaultGroup
 - button.pressedGroup
 - button.disabledGroup

And the following functions:

 - setEnabled(enabled)
 - setLabel(label)

### Transition Engine

The Transition Engine class is responsible for animating objects in the game. It can be accessed through the `engine.transition` property. The following functions are available in the Transition Engine class. It is similar to the Solar2D transition engine. Time is in milliseconds. The following functions are available in the Transition Engine class.

 - engine.transition.to(object, params = {})
 - engine.transition.from(object, params = {})
 - engine.transition.cancel(object)

Transition parameters are passed as an object to the `to` and `from` functions. You can include any numerical property of the object in the parameters object. The following reserved properties for the transition are available:

 - params.delay = 0
 - params.time = 300
 - params.easing
 - params.onStart
 - params.onComplete

 #### Easing Functions

 Available easing functions are:

 - Easing.linear
 - Easing.inQuad
 - Easing.outQuad
 - Easing.inOutQuad
 - Easing.outBack
 - Easing.inBack
 - Easing.inOutBack
 - Easing.inSine
 - Easing.outSine
 - Easing.inOutSine

 #### Transition Examples

 - Move an object to x: 100, y: 100 in 1 second

```javascript
engine.transition.to(object, { x: 100, y: 100, time: 1000, easing: Easing.outQuad });
```

 - Make an object transition to other object position in 1 second and call a function when the transition is complete

```javascript
engine.transition.to(object, { x: otherObject, y: otherObject, time: 1000, easing: Easing.outQuad, onComplete: function(event) {
    console.log('Transition complete');
}});
```

 - Increase the coin counter text to the new value in 1 second

```javascript
engine.transition.to(coinCounterText, { text: newValue, time: 1000, easing: Easing.outQuad });
```

Thats right! You can animate values to other objects and numeric text properties too!

### Particle Engine

The Particle Engine class is responsible for creating and managing particle systems. It can be accessed through the `engine.particle` property. You can use Particle Designer to create particle systems and export them to JSON. The following functions are available in the Particle Engine class. Please note that the Particle Engine is still in development and is subject to change. Color transitions are NOT supported yet.

The Particle engine has the following functions available:

 - engine.particles.newEmitter(emitterParams)

#### Emitter Parameters

Emitter parameters are usually loaded from a JSON file exported from Particle Designer. You can specify the following additional parameters in the emitterParams object:

 - emitterParams.x = 0
 - emitterParams.y = 0

#### Emitter functions

 - start()
 - stop()
 - pause()
 
 ### Physics Engine

The Physics Engine class is responsible for creating and managing physics objects. It can be accessed through the `engine.physics` property. The Physics Engine uses Matter.js for physics. The following functions are available in the Physics Engine class. Please note that the Physics Engine is still in development and is subject to change. The syntax is similar to Solar2D, bodies are added after they have been created.

Bodies are created using the `engine.physics.addBody` function. The `object` parameter is the object to attach the body to. The `bodyType` parameter is the type of body to create. The `options` parameter is an object that contains the body properties.

The physics engine has the following functions available:

 - addBody(object, bodyType, options)
   - bodyType = 'dynamic', 'static'
 - setGravity(x, y)
 - start()
 - pause()
 - stop()

 #### addBody options

 The following options are available when creating a body:

 - options.density = 1
 - options.bounce = 0.1
 - options.friction = 0.1
 - options.filter = {}
 - options.radius = false
 - options.shape
 - options.resolution = 10
 - options.isSensor = false

If the `shape` property is set, the `radius` property is ignored. The `shape` property can be a list of vertices. The `filter` property is an object that contains the collision filter properties. These properties are passed to Matter.js when creating the object.body. The `resolution` property is the number of sides to use when creating a circle. 

#### Bodies

After `addBody` is called, the object will have a `body` property that contains the physics object.body. The following properties are available in the body object:

 - object.body.fixedRotation = false
 - object.body.x
 - object.body.y
 - object.body.rotation
 - object.body.isSensor = false
 - object.body.matterBody

And the following functions are available in the body object:

 - object.body.applyForce(x, y)
 - object.body.setLinearVelocity(x, y)
 - object.body.applyTorque(torque)
 - object.body.getAngularVelocity()
 - object.body.setAngularVelocity(angularVelocity)
 - object.body.setMass(mass)
 - object.body.getMass()

You can still do anything you want with the Matter.js body object. The `matterBody` property contains the Matter.js body object. Most of these functions and properties are just wrappers for the Matter.js body object. If you are familiar with Solar2D, the main difference is that body properties are accessed through the `object.body` property instead of the `object` property.

Avalilable listeners are:

 - collision

 The collision listener is called when two bodies collide. The event will have the following properties:

 - event.phase = 'began', 'end'
 - event.target
 - event.other
 - event.collision

The `collision` property is an object that contains the collision properties and is the original object emitted by Matter.js. The `target` property is the object that the listener is attached to, and the `other` property is the object that the target is colliding with.