const { RTCPeerConnection, RTCSessionDescription } = window;

const peerConnection = new RTCPeerConnection();
let currentView = "none";
const socket = io("localhost:5000");
const urlParams = new URLSearchParams(window.location.search);
const title = urlParams.get("title");
const titleElement = document.getElementById("stream-title");
titleElement.innerText = title;
let currentStream = null;
let remoteSocketId = null;
socket.on("connect", () => {
  const socketId = socket.id;
  socket.emit("start-stream", { title, socketId });
  generateQrCode(socketId);
});
socket.on("new-connection", async (data) => {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.offer)
  );
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(answer));
  remoteSocketId = data.socket;
  socket.emit("send-stream", {
    answer,
    to: data.socket,
  });

  console.log(`ICE connection state: ${peerConnection.connectionState}`);
});

socket.on("streamer-answer", async (data) => {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.answer)
  );
});
function openCamera() {
  !!currentStream && stopTracks(currentStream);
  navigator.getUserMedia(
    { video: true, audio: true },
    async (stream) => {
      const localVideo = document.getElementById("local-video");
      if (localVideo) {
        localVideo.srcObject = stream;
      }
      currentStream = stream;
      currentView = "camera";
      peerConnection.getSenders().forEach((sender) => {
        peerConnection.removeTrack(sender);
      });
      stream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, stream));

      redoConnection();
    },
    (error) => {
      console.warn(error.message);
    }
  );
}

function screenShare() {
  !!currentStream && stopTracks(currentStream);
  navigator.mediaDevices
    .getDisplayMedia({ video: true, audio: true })
    .then((stream) => {
      const localVideo = document.getElementById("local-video");
      if (localVideo) {
        localVideo.srcObject = stream;
      }
      currentStream = stream;
      currentView = "screen";
      peerConnection.getSenders().forEach((sender) => {
        peerConnection.removeTrack(sender);
      });
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      redoConnection();
    });
}
async function redoConnection() {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
  socket.emit("streamer-offer", {
    offer,
    to: remoteSocketId,
  });
}
function toggleAudio() {
  const localStream = document.getElementById("local-video").srcObject;
  const audioTracks = localStream?.getAudioTracks() || [];
  const audioEnabled = !!audioTracks[0]?.enabled;

  audioTracks.forEach((track) => {
    track.enabled = !audioEnabled;
  });

  const button = document.getElementById("toggle-audio-button");
  button.innerText = audioEnabled ? "Unmute Audio" : "Mute Audio";
}
function triggerView() {
  if (currentView === "none") {
    openCamera();
    currentView = "camera";
  } else if (currentView === "camera") {
    openCamera();
    currentView = "camera";
  } else if (currentView === "screen") {
    screenShare();
    currentView = "screen";
  }
}
function generateQrCode(socketId) {
  const qrCode = new QRCodeStyling({
    width: 250,
    height: 250,
    data: `http://localhost:5000/watch?code=${socketId}`,
    dotsOptions: {
      color: "#000000",
      type: "square",
    },
    backgroundOptions: {
      color: "#FFFFFF",
    },
  });
  qrCode.append(document.getElementById("streaming-container06"));
  const qrText = document.getElementById("qrText");
  qrText.innerText = `Invite viewers by sharing this code: ${socketId}, or by scanning the qr.`;
}
function stopTracks(stream) {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}
