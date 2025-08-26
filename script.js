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
                this.readFrame();
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
            this.logEl.textContent = code.data;
        } else {
            this.logEl.textContent = "No QR code was detected.";
        }

        setTimeout(() => {
            this.readFrame();
        }, 100);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");
    const log = document.getElementById("log");

    const qrReader = new QRReader(video, canvas, log);
    qrReader.init();
});
