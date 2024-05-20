import { ZetoEventObject } from './ZetoEventObject.js';

class ZetoAudioObject extends ZetoEventObject {
	bufferSource;
	gainNode;
	audioEngine;

	internal = {
		volume: 1,
		pitch: 1,
	};

	listeners = ['complete'];

	constructor(audioEngine, buffer, volume, time, loop) {
		super();

		this.audioEngine = audioEngine;
		this.internal.volume = volume;

		const bufferSource = audioEngine.audioContext.createBufferSource();
		bufferSource.loop = loop;
		bufferSource.buffer = buffer;

		const gainNode = audioEngine.audioContext.createGain();
		gainNode.gain.value = volume * audioEngine.volume;

		bufferSource.connect(gainNode).connect(audioEngine.audioContext.destination);
		bufferSource.onended = this.onended.bind(this);
		bufferSource.start(time);

		this.bufferSource = bufferSource;
		this.gainNode = gainNode;
	}

	onended(event) {
		this.bufferSource.stop(0);
		this.dispatchEvent('complete', { target: this });
	}

	pause() {
		this.bufferSource.stop(0);
	}

	resume() {
		this.bufferSource.start(0);
	}

	stop() {
		this.bufferSource.stop(0);
	}

	syncVolume() {
		this.gainNode.gain.value = this.internal.volume * this.audioEngine.volume;
	}

	set volume(volume) {
		this.internal.volume = volume;
		this.syncVolume();
	}

	set pitch(pitch) {
		this.internal.pitch = pitch;
		this.bufferSource.playbackRate.value = pitch;
	}

	get volume() {
		return this.internal.volume;
	}

	get pitch() {
		return this.internal.pitch;
	}
}

export { ZetoAudioObject };
