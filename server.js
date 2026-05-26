const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const pty = require("node-pty");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {

    console.log("User connected");

    const shell = pty.spawn("bash", [], {
        name: "xterm-color",
        cols: 120,
        rows: 30,
        cwd: process.env.HOME,
        env: process.env
    });

    shell.onData((data) => {
        socket.emit("output", data);
    });

    socket.on("input", (data) => {
        shell.write(data);
    });

    socket.on("resize", ({ cols, rows }) => {
        shell.resize(cols, rows);
    });

    socket.on("disconnect", () => {
        shell.kill();
        console.log("User disconnected");
    });
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});