import { ZetoAudioObject } from './ZetoAudioObject.js';

class ZetoAudioEngine {
	engine;
	volume = 1;
	initAudioBind;
	audioContext;

	audios = [];

	constructor(engine) {
		this.engine = engine;
		this.initAudioListeners();
	}

	initAudio() {
		try {
			if (!this.audioContext) {
				window.AudioContext = window.AudioContext || window.webkitAudioContext;
				this.audioContext = new AudioContext();

				this.engine.removeEventListener('tap', this.initAudioBind);
				this.engine.removeEventListener('touch', this.initAudioBind);
				this.engine.removeEventListener('key', this.initAudioBind);
			}
		} catch (e) {
			console.error('Could not init audio context');
		}
	}

	initAudioListeners() {
		this.initAudioBind = this.initAudio.bind(this);
		this.engine.addEventListener('tap', this.initAudioBind);
		this.engine.addEventListener('touch', this.initAudioBind);
		this.engine.addEventListener('key', this.initAudioBind);
	}

	async play(id, volume = 1, time = 0, loop = false, onComplete = false) {
		var element = this.engine.loadedAudio[id];
		if (element && this.audioContext) {
			var audio = element.audio; // XMLHttpRequest
			if (audio.decoding) {
				return;
			}

			if (!audio.zBuffer) {
				audio.decoding = true;
				try {
					audio.zBuffer = await this.audioContext.decodeAudioData(audio.response);
				} catch (e) {
					// Might not be ready yet (Not interacted with page)
					return;
				}
				audio.decoding = false;
			}

			volume = volume * this.volume;
			var audioObject = new ZetoAudioObject(this, audio.zBuffer, volume, time, loop);
			audioObject.addEventListener('complete', onComplete);
			audioObject.addEventListener('complete', this.#removeAudio);
			this.audios.push(audioObject);
			return audioObject;
		}
	}

	#removeAudio(event) {
		var audioObject = event.target;
		var audioIndex = this.audios.indexOf(audioObject);
		if (audioIndex > -1) {
			this.audios.splice(audioIndex, 1);
		}
	}

	setVolume(volume) {
		this.volume = volume;
		for (var audioIndex = 0; audioIndex < this.audios.length; audioIndex++) {
			this.audios[audioIndex].syncVolume();
		}
	}
}

export { ZetoAudioEngine };
