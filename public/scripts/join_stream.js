function joinStream() {
  // Get the value of the stream code entered by the user
  const streamCode = document.getElementById("streamCode").value;

  // Make a POST request to the server with the stream code
  fetch(`/watch?code=${streamCode}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ socketId: streamCode }),
  })
    .then((response) => {
      if (response.status === 200) {
        // If the server responds with a 200 status code, redirect the user to the new page
        window.location.href = response.url;
      } else {
        // If the server responds with a non-200 status code, alert the user with an error message
        alert("Invalid stream code");
      }
    })
    .catch((error) => {
      console.error("Failed to join stream:", error);
    });
}
