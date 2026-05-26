const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const pty = require('node-pty'); // Real system shell access ke liye
const fs = require('fs-extra');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const TARGET_DIR = path.join(__dirname, 'workspace'); // Is folder ki files control hongi
fs.ensureDirSync(TARGET_DIR);

app.use(express.json());
// Express ko batao ki saari frontend files 'public' folder ke andar hain
app.use(express.static(path.join(__dirname, 'public')));
// --- FILE API ---
app.get('/api/files', async (req, res) => {
    try {
        const items = await fs.readdir(TARGET_DIR);
        const details = items.map(item => {
            const stat = fs.statSync(path.join(TARGET_DIR, item));
            return { name: item, type: stat.isDirectory() ? 'folder' : 'file' };
        });
        res.json(details);
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/api/files', async (req, res) => {
    const { name, content } = req.body;
    try {
        await fs.outputFile(path.join(TARGET_DIR, name), content || '');
        res.sendStatus(201);
    } catch (err) { res.status(500).send(err.message); }
});

app.get('/api/files/:name', async (req, res) => {
    try {
        const content = await fs.readFile(path.join(TARGET_DIR, req.params.name), 'utf-8');
        res.json({ content });
    } catch (err) { res.status(500).send(err.message); }
});

app.put('/api/files/:name', async (req, res) => {
    try {
        await fs.writeFile(path.join(TARGET_DIR, req.params.name), req.body.content);
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

app.delete('/api/files/:name', async (req, res) => {
    try {
        await fs.remove(path.join(TARGET_DIR, req.params.name));
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err.message); }
});

// --- REAL TERMINAL SOCKETS ---
let sessions = {};

io.on('connection', (socket) => {
    socket.on('create-session', (id) => {
        // Linux/Ubuntu ya Windows Shell access auto detect
        const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
        
        const ptyProcess = pty.spawn(shell, [], {
            name: 'xterm-color',
            cols: 80,
            rows: 24,
            cwd: TARGET_DIR, // Terminal open hote hi isi folder me rahega
            env: process.env
        });

        sessions[id] = ptyProcess;

        ptyProcess.onData((data) => {
            socket.emit('terminal-output', { id, output: data });
        });
    });

    socket.on('terminal-input', ({ id, data }) => {
        if (sessions[id]) sessions[id].write(data);
    });

    socket.on('close-session', (id) => {
        if (sessions[id]) {
            sessions[id].kill();
            delete sessions[id];
        }
    });

    socket.on('disconnect', () => {
        Object.keys(sessions).forEach(id => {
            sessions[id].kill();
            delete sessions[id];
        });
    });
});

server.listen(3000, () => console.log('MD.Cloud Panel running on http://localhost:3000'));
