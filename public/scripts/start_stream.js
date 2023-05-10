function startStream() {
  // Get the value of the stream title entered by the user
  const streamTitle = document.getElementById("streamTitle").value;

  // Make a POST request to the server with the stream title
  fetch(`/stream?title=${streamTitle}`, {
    method: "POST",
  })
    .then((response) => {
      window.location.href = response.url;
    })
    .catch((error) => {
      console.error("Failed to start stream:", error);
    });
}
