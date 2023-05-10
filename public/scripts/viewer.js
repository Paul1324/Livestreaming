const { RTCPeerConnection, RTCSessionDescription } = window;
const peerConnection = new RTCPeerConnection();
let redoConnection = true;
const socket = io("localhost:5000");

const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get("code");
peerConnection.ontrack = function ({ streams: [stream] }) {
  const remoteVideo = document.getElementById("remote-video");
  if (remoteVideo) {
    remoteVideo.srcObject = stream;
  }
};

socket.on("connect", async () => {
  const socketId = socket.id;
});

socket.on("stream-sent", async (data) => {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.answer)
  );
  if (redoConnection) {
    await receive(data.socket);
    redoConnection = false;
  }
  const titleElement = document.getElementById("stream-title");
  titleElement.innerText = data.title;
  console.log(`ICE connection state: ${peerConnection.connectionState}`);
});

socket.on("streamer-offer", async (data) => {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.offer)
  );
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

  socket.emit("streamer-answer", {
    answer,
    to: data.socket,
  });
});

async function receive(socketId) {
  socketId = socketId || code;
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
  socket.emit("get-stream", {
    offer,
    to: socketId,
  });
}
