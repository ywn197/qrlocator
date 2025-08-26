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
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            this.videoEl.srcObject = this.stream;
            this.videoEl.play();
            this.videoEl.onloadeddata = () => {
                this.width = this.videoEl.clientWidth;
                this.height = this.videoEl.clientHeight;
            };
        } catch (err) {
            console.error(err);
            this.logEl.textContent = "Failed to access camera.";
        }
    }

    readFrame() {
        const context = this.canvasEl.getContext("2d");
        this.canvasEl.width = this.width;
        this.canvasEl.height = this.height;
        context.drawImage(this.videoEl, 0, 0, this.width, this.height);

        const image = context.getImageData(0, 0, this.width, this.height);
        const code = jsQR(image.data, this.width, this.height);

        if (code) {
            this.logEl.textContent = `[${code.data}]`;
            return code.data;
        } else {
            this.logEl.textContent = "No QR code detected.";
            return null;
        }


    }
}

class MusicPlayer {
    constructor(qrReader,audio) {
        this.musicMap = new Map();
        this.currentAudio = null;
        this.currentTag = null;
        this.qrReader = qrReader;
        this.audio = audio
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



    play() {
        const tag = this.qrReader.readFrame();
        if(tag){
            if (tag === this.currentTag) {
                return; // Already playing the correct music
            }
            if(!this.musicMap.has(tag)){
                return;
            }
            const url = this.musicMap.get(tag);
            if(url == "stop"){
                this.audio.src = "";
            } else {
                while (this.audio.volume > 0.001){
                    this.audio.volume = this.audio.volume / 1.2;
                }
                this.audio.src = url;
                this.audio.play;
                this.currentTag = tag;
            }
        }
        setTimeout(() => this.play(), 500); // Loop every 500ms
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");
    const log = document.getElementById("log");
    const settingsToggle = document.getElementById("settings-toggle");
    const settingsPanel = document.getElementById("settings-panel");
    const musicMapInput = document.getElementById("music-map-input");
    const updateSettingsBtn = document.getElementById("update-settings");
    const audio = document.getElementById("audio")

    const qrReader = new QRReader(video, canvas, log);
    const musicPlayer = new MusicPlayer(qrReader,audio);

    // Initial setup
    musicPlayer.updateMusicMap(musicMapInput.value);
    qrReader.init();

    // UI Event Listeners
    settingsToggle.addEventListener("click", () => {
        settingsPanel.classList.toggle("hidden");
    });

    updateSettingsBtn.addEventListener("click", () => {
        musicPlayer.updateMusicMap(musicMapInput.value);
        settingsPanel.classList.add("hidden");
    });
    musicPlayer.play();
});
