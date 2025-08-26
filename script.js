const width = 1920; 
const height = 1080;

const streaming = false;
const log = document.getElementById("log")

let video = document.getElementById("video");
let canvas = document.getElementById("canvas");


navigator.mediaDevices
  .getUserMedia({ video: true, audio: false })
  .then((stream) => {
    video.srcObject = stream;
    video.play();
  })
  .catch((err) => {
      console.error(err);
  });

//video.addEventListener("canplay",
//    (ev) => {
//        streaming = true;
//
//    },
//    false
//);

function readCamera(){
    canvas.setAttribute("width", video.clientWidth);
    canvas.setAttribute("height", video.clientWidth);
    const context = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    context.drawImage(video,0,0,width,height);
    console.log("camera captured");
    log.textContent = "copy2canvas";
    const image = context.getImageData(0, 0, width, height);
    const code = jsQR(image, width, height);

    if (code) {
        log.textContent = code;
    }
    setTimeout(() => {
        readCamera();
    },100);
};
copy2canvas()
