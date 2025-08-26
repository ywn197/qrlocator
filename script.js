let width = 1920; 
let height = 1080;

const log = document.getElementById("log")

let video = document.getElementById("video");
let canvas = document.getElementById("canvas");


navigator.mediaDevices
  .getUserMedia({ video: true, audio: false })
  .then((stream) => {
    video.srcObject = stream;
    video.play();
    video.onloadeddata = () => {
        width = video.clientWidth;
        height = video.clientHeight;
        readCamera()
    }
    
  })
  .catch((err) => {
      console.error(err);
  });

function readCamera(){
    const context = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    context.drawImage(video,0,0,width,height);
    console.log("camera captured");
    log.textContent = "copy2canvas";
    const image = context.getImageData(0, 0, width, height);
    const code = jsQR(image.data, width, height);

    if (code) {
        log.textContent = code.data;
    } else {
        log.textContent = "No QR code was detected."
    }
    setTimeout(() => {
        readCamera();
    },100);
};
