const express = require("express");
const socketIO = require("socket.io");
const { createServer } = require("http");
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");
class Server {
  constructor() {
    this.DEFAULT_PORT = 5000;
    this.initialize();
  }

  initialize() {
    this.app = express();
    this.app.use(bodyParser.json());
    this.httpServer = createServer(this.app);
    this.activeSockets = [];
    this.io = socketIO(this.httpServer);
    this.liveStreams = {};
    this.configureApp();
    this.configureRoutes();
    this.handleSocketConnection();
  }

  configureRoutes() {
    this.app.get("/", (req, res) => {
      res.sendFile(`home.html`);
    });
    this.app.get("/start-stream", (req, res) => {
      res.sendFile(`start_stream.html`, { root: "./public" });
    });

    this.app.get("/join-stream", (req, res) => {
      res.sendFile(`join_stream.html`, { root: "./public" });
    });

    this.app.get("/stream", (req, res) => {
      res.sendFile(`stream.html`, { root: "./public" });
    });

    this.app.post("/watch", (req, res) => {
      const { socketId } = req.body;
      const found = !!this.liveStreams[socketId];
      if (found) {
        res.sendFile(`viewer.html`, { root: "./public" });
      } else {
        res.status(404).send();
      }
    });

    this.app.get("/watch", (req, res) => {
      res.sendFile(`viewer.html`, { root: "./public" });
    });
  }

  handleSocketConnection() {
    this.io.on("connection", (socket) => {
      const existingSocket = this.activeSockets.find(
        (existingSocket) => existingSocket === socket.id
      );

      if (!existingSocket) {
        this.activeSockets.push(socket.id);
      }

      socket.on("disconnect", () => {
        this.activeSockets = this.activeSockets.filter(
          (existingSocket) => existingSocket !== socket.id
        );
        socket.broadcast.emit("remove-user", {
          socketId: socket.id,
        });
      });

      socket.on("start-stream", ({ title, socketId }) => {
        console.log(
          `Started stream with title ${title} and socket ${socketId}`
        );
        this.liveStreams[socketId] = {
          active: true,
          title: title,
        };
      });

      socket.on("get-stream", (data) => {
        socket.to(data.to).emit("new-connection", {
          offer: data.offer,
          socket: socket.id,
        });
      });

      socket.on("send-stream", (data) => {
        console.log(
          `Sending stream from socket: ${socket.id} to socket ${data.to}`
        );
        socket.to(data.to).emit("stream-sent", {
          socket: socket.id,
          answer: data.answer,
          title: this.liveStreams[socket.id].title,
        });
      });

      socket.on("streamer-offer", (data) => {
        console.log(
          "Streamer offer received from socket: " +
            socket.id +
            " to socket: " +
            data.to
        );
        socket
          .to(data.to)
          .emit("streamer-offer", { socket: socket.id, offer: data.offer });
      });
      socket.on("streamer-answer", (data) => {
        console.log(
          "Streamer answer received from socket: " +
            socket.id +
            " to socket: " +
            data.to
        );
        socket
          .to(data.to)
          .emit("streamer-answer", { socket: socket.id, answer: data.answer });
      });
    });
  }

  listen(callback) {
    this.httpServer.listen(this.DEFAULT_PORT, () =>
      callback(this.DEFAULT_PORT)
    );
  }

  configureApp() {
    this.app.use(express.static(path.join(__dirname, "../public")));
  }
}

module.exports = Server;
