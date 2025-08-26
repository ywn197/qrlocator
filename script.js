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

video.addEventListener("canplay",
    (ev) => {
        video.setAttribute("width", width);
        video.setAttribute("height", height);
        canvas.setAttribute("width", width);
        canvas.setAttribute("height", height);
        streaming = true;

    },
    false
);

function copy2canvas(){
    const context = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    context.drawImage(video,0,0,width,height);
    console.log("camera captured");
    log.textContent = "copy2canvas";
    setTimeout(() => {
        copy2canvas();
    },100);
};
copy2canvas()
