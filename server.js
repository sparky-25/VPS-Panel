const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const pty = require("node-pty");
const path = require("path");
const fs = require("fs");
const os = require("os");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

const PORT = process.env.PORT || 3000;

/*
========================
STATIC FILES
========================
*/

app.use(express.static(path.join(__dirname, "public")));

/*
========================
HOME PAGE
========================
*/

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

/*
========================
GET FILES
========================
*/

app.get("/files", (req, res) => {

    const dir = process.cwd();

    fs.readdir(dir, { withFileTypes: true }, (err, files) => {

        if (err) {
            return res.status(500).json([]);
        }

        const formatted = files.map(file => ({
            name: file.name,
            type: file.isDirectory() ? "folder" : "file"
        }));

        res.json(formatted);
    });
});

/*
========================
SYSTEM INFO
========================
*/

app.get("/system", (req, res) => {

    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);

    res.json({
        platform: os.platform(),
        cpu: os.cpus()[0].model,
        cores: os.cpus().length,
        ram_total: totalMem + " GB",
        ram_free: freeMem + " GB",
        hostname: os.hostname(),
        uptime: Math.floor(os.uptime() / 60) + " minutes"
    });
});

/*
========================
SOCKET TERMINAL
========================
*/

io.on("connection", (socket) => {

    console.log("User connected");

    const shell = process.platform === "win32"
        ? "powershell.exe"
        : "bash";

    const ptyProcess = pty.spawn(shell, [], {

        name: "xterm-color",

        cols: 120,
        rows: 30,

        cwd: process.env.HOME,

        env: process.env
    });

    /*
    ========================
    OUTPUT TO CLIENT
    ========================
    */

    ptyProcess.onData((data) => {
        socket.emit("output", data);
    });

    /*
    ========================
    INPUT FROM CLIENT
    ========================
    */

    socket.on("input", (data) => {
        ptyProcess.write(data);
    });

    /*
    ========================
    TERMINAL RESIZE
    ========================
    */

    socket.on("resize", ({ cols, rows }) => {

        try {
            ptyProcess.resize(cols, rows);
        } catch (e) {}
    });

    /*
    ========================
    DISCONNECT
    ========================
    */

    socket.on("disconnect", () => {

        console.log("User disconnected");

        try {
            ptyProcess.kill();
        } catch (e) {}
    });
});

/*
========================
START SERVER
========================
*/

server.listen(PORT, () => {

    console.log(`
==================================
 VPS PANEL RUNNING
==================================

 Local:
 http://localhost:${PORT}

==================================
    `);
});