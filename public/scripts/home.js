function startStream() {
  // Make a GET request to localhost:5000/start-stream
  fetch("http://localhost:5000/start-stream")
    .then((response) => {
      // When the response is received, redirect the user to the new page
      window.location.href = response.url;
    })
    .catch((error) => {
      console.error("Failed to start stream:", error);
    });
}

function joinStream() {
  // Make a GET request to localhost:5000/join-stream
  fetch("http://localhost:5000/join-stream")
    .then((response) => {
      // When the response is received, redirect the user to the new page
      window.location.href = response.url;
    })
    .catch((error) => {
      console.error("Failed to join stream:", error);
    });
}
