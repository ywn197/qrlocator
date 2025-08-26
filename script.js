class QRReader {
    constructor(videoEl, canvasEl) {
        this.videoEl = videoEl;
        this.canvasEl = canvasEl;
        this.width = 1920;
        this.height = 1080;
        this.stream = null;
    }

    async init() {
        const firstTryConstraints = { video: { facingMode: "environment" }, audio: false };
        const secondTryConstraints = { video: true, audio: false };

        try {
            this.stream = await navigator.mediaDevices.getUserMedia(firstTryConstraints);
        } catch (err) {
            console.warn("Could not get environment camera, trying default camera", err);
            try {
                this.stream = await navigator.mediaDevices.getUserMedia(secondTryConstraints);
            } catch (err) {
                console.error("Failed to access any camera.", err);
                throw new Error("Camera access failed");
            }
        }

        this.videoEl.srcObject = this.stream;
        this.videoEl.play();

        return new Promise((resolve) => {
            this.videoEl.onloadeddata = () => {
                this.width = this.videoEl.videoWidth;
                this.height = this.videoEl.videoHeight;
                resolve();
            };
        });
    }

    readFrame() {
        const context = this.canvasEl.getContext("2d");
        this.canvasEl.width = this.width;
        this.canvasEl.height = this.height;
        context.drawImage(this.videoEl, 0, 0, this.width, this.height);

        const image = context.getImageData(0, 0, this.width, this.height);
        const code = jsQR(image.data, this.width, this.height);

        return code ? code.data : null;
    }
}

class MusicPlayer {
    constructor(audioEl, logger) {
        this.audio = audioEl;
        this.logger = logger;
        this.musicMap = new Map();
        this.currentTag = null;
        this.fadeInterval = null;
    }

    updateMusicMap(text) {
        this.musicMap.clear();
        const lines = text.split('\n');
        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex > -1) {
                const tag = line.substring(0, colonIndex).trim();
                const url = line.substring(colonIndex + 1).trim();
                if (tag && url) {
                    this.musicMap.set(tag, url);
                }
            }
        }
        this.logger.log(`Music map updated: ${this.musicMap.size} items`);
    }

    playTag(tag) {
        if (tag === this.currentTag) return;
        this.logger.log(`playTag received: ${tag || 'null'}`);

        clearInterval(this.fadeInterval);

        const stopAndPlayNew = () => {
            if (this.musicMap.has(tag)) {
                this.startNewTrack(tag);
            } else {
                this.currentTag = null;
                this.logger.log('Tag not in map, music stopped.');
            }
        };

        if (this.audio.src && !this.audio.paused) {
            this.logger.log(`Fading out: ${this.currentTag}`);
            this.fadeOut(stopAndPlayNew);
        } else {
            stopAndPlayNew();
        }
    }

    startNewTrack(tag) {
        const url = this.musicMap.get(tag);
        this.logger.log(`Starting new track: ${tag} -> ${url}`);
        this.currentTag = tag;
        this.audio.src = url;
        this.audio.volume = 0;
        
        // Add a user interaction listener to play audio
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.logger.log(`Play started for ${tag}`);
                this.fadeIn();
            }).catch(error => {
                this.logger.log(`Play failed: ${error.name} - ${error.message}`);
                // On many mobile browsers, play() must be initiated by a user gesture.
                // We can provide a button to the user to start the audio.
                this.logger.log('Tap screen to try playing audio');
                // A one-time listener to play on the next user interaction
                const playOnClick = () => {
                    this.logger.log('Screen tapped, retrying play...');
                    this.audio.play().then(() => {
                        this.logger.log('Retry play successful!');
                        this.fadeIn();
                    }).catch(e => this.logger.log(`Retry play failed: ${e.message}`));
                    document.body.removeEventListener('click', playOnClick);
                };
                document.body.addEventListener('click', playOnClick, { once: true });
            });
        }
    }

    fadeIn() {
        this.logger.log('Fading in...');
        this.fadeInterval = setInterval(() => {
            if (this.audio.volume < 0.99) {
                this.audio.volume = Math.min(1, this.audio.volume + 0.1);
            } else {
                this.audio.volume = 1;
                clearInterval(this.fadeInterval);
                this.logger.log('Fade in complete.');
            }
        }, 50);
    }

    fadeOut(callback) {
        this.logger.log('Fading out...');
        this.fadeInterval = setInterval(() => {
            if (this.audio.volume > 0.01) {
                this.audio.volume = Math.max(0, this.audio.volume - 0.1);
            } else {
                this.audio.volume = 0;
                this.audio.pause();
                this.audio.src = "";
                clearInterval(this.fadeInterval);
                this.logger.log('Fade out complete.');
                if (callback) callback();
            }
        }, 50);
    }
}

class Logger {
    constructor(logEl) {
        this.logEl = logEl;
        this.logHistory = [];
    }
    log(message) {
        console.log(message); // Also keep logging to console
        this.logHistory.unshift(message);
        if (this.logHistory.length > 10) {
            this.logHistory.pop();
        }
        this.logEl.innerHTML = this.logHistory.join('<br>');
    }
}

class AppController {
    constructor() {
        this.video = document.getElementById("video");
        this.canvas = document.getElementById("canvas");
        this.logEl = document.getElementById("log");
        this.audio = document.getElementById("audio");
        this.settingsToggle = document.getElementById("settings-toggle");
        this.settingsPanel = document.getElementById("settings-panel");
        this.musicMapInput = document.getElementById("music-map-input");
        this.updateSettingsBtn = document.getElementById("update-settings");

        this.logger = new Logger(this.logEl);
        this.qrReader = new QRReader(this.video, this.canvas);
        this.musicPlayer = new MusicPlayer(this.audio, this.logger);
    }

    async init() {
        this.logger.log('App initializing...');
        this.setupUIListeners();
        this.musicPlayer.updateMusicMap(this.musicMapInput.value);

        try {
            await this.qrReader.init();
            this.logger.log('Camera ready. Starting scan...');
            this.startMainLoop();
        } catch (error) {
            this.logger.log(`Init failed: ${error.message}`);
            console.error(error);
        }
    }

    setupUIListeners() {
        this.settingsToggle.addEventListener("click", () => {
            this.settingsPanel.classList.toggle("hidden");
        });

        this.updateSettingsBtn.addEventListener("click", () => {
            this.musicPlayer.updateMusicMap(this.musicMapInput.value);
            this.settingsPanel.classList.add("hidden");
        });
    }

    startMainLoop() {
        setInterval(() => {
            const tag = this.qrReader.readFrame();
            this.musicPlayer.playTag(tag);
        }, 500);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const app = new AppController();
    app.init();
});