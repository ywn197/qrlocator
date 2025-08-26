const width = 320; 
const height = 0;

const streaming = false;

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
        height = video.videoHeight;
        width = video.videoWidth;
        video.setAttribute("width", width);
        video.setAttribute("height", height);
        canvas.setAttribute("width", width);
        canvas.setAttribute("height", height);
        streaming = true;

    },
    false
);
