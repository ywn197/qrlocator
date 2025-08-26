class QRReader {
    constructor(videoEl, canvasEl, logEl) {
        this.videoEl = videoEl;
        this.canvasEl = canvasEl;
        this.logEl = logEl;
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
                this.logEl.textContent = "Failed to access camera.";
                throw new Error("Camera access failed");
            }
        }

        this.videoEl.srcObject = this.stream;
        this.videoEl.play();

        return new Promise((resolve) => {
            this.videoEl.onloadeddata = () => {
                this.width = this.videoEl.videoWidth;
                this.height = this.videoEl.videoHeight;
                console.log(`Camera initialized: ${this.width}x${this.height}`);
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
    constructor(audioEl) {
        this.audio = audioEl;
        this.musicMap = new Map();
        this.currentTag = null;
        this.fadeInterval = null;
    }

    updateMusicMap(text) {
        this.musicMap.clear();
        const lines = text.split('\n');
        for (const line of lines) {
            const parts = line.split(':');
            if (parts.length === 2) {
                const tag = parts[0].trim();
                const url = parts[1].trim();
                if (tag && url) {
                    this.musicMap.set(tag, url);
                }
            }
        }
        console.log("Music map updated:", this.musicMap);
    }

    playTag(tag) {
        if (tag === this.currentTag) return;

        clearInterval(this.fadeInterval);

        if (this.audio.src && !this.audio.paused) {
            this.fadeOut(() => {
                if (this.musicMap.has(tag)) {
                    this.startNewTrack(tag);
                } else {
                    this.currentTag = null;
                }
            });
        } else if (this.musicMap.has(tag)) {
            this.startNewTrack(tag);
        }
    }

    startNewTrack(tag) {
        console.log(`Playing: ${tag}`);
        this.currentTag = tag;
        this.audio.src = this.musicMap.get(tag);
        this.audio.volume = 0;
        this.audio.play().catch(e => console.error("Play failed", e));
        this.fadeIn();
    }

    fadeIn() {
        this.fadeInterval = setInterval(() => {
            if (this.audio.volume < 0.99) {
                this.audio.volume = Math.min(1, this.audio.volume + 0.05);
            } else {
                this.audio.volume = 1;
                clearInterval(this.fadeInterval);
            }
        }, 50);
    }

    fadeOut(callback) {
        this.fadeInterval = setInterval(() => {
            if (this.audio.volume > 0.01) {
                this.audio.volume = Math.max(0, this.audio.volume - 0.05);
            } else {
                this.audio.volume = 0;
                this.audio.pause();
                this.audio.src = "";
                clearInterval(this.fadeInterval);
                if (callback) callback();
            }
        }, 50);
    }
}

class AppController {
    constructor() {
        this.video = document.getElementById("video");
        this.canvas = document.getElementById("canvas");
        this.log = document.getElementById("log");
        this.audio = document.getElementById("audio");
        this.settingsToggle = document.getElementById("settings-toggle");
        this.settingsPanel = document.getElementById("settings-panel");
        this.musicMapInput = document.getElementById("music-map-input");
        this.updateSettingsBtn = document.getElementById("update-settings");

        this.qrReader = new QRReader(this.video, this.canvas, this.log);
        this.musicPlayer = new MusicPlayer(this.audio);
    }

    async init() {
        this.setupUIListeners();
        this.musicPlayer.updateMusicMap(this.musicMapInput.value);

        try {
            await this.qrReader.init();
            this.log.textContent = "Camera ready. Starting scan...";
            this.startMainLoop();
        } catch (error) {
            this.log.textContent = "Could not start QR Scanner.";
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
            if (tag) {
                this.log.textContent = `[${tag}]`;
                this.musicPlayer.playTag(tag);
            } else {
                this.log.textContent = "No QR code detected.";
                this.musicPlayer.playTag(null); // Stop music if no code
            }
        }, 500);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const app = new AppController();
    app.init();
});
