const Server = require("./server");

const server = new Server();
server.listen((port) => {
  console.log(`Server listening on port ${port}`);
});
