# Ubuntu VPS Panel

A small Codespaces-friendly web panel with:

- Real shell sessions through `node-pty`
- Multiple terminal tabs
- File browser and text preview
- Full file manager with drag/drop uploads, edit, delete, files, and folders
- System info panel
- Minecraft server creator and control panel
- Optional token protection with `PANEL_TOKEN`

## GitHub Codespaces Setup

Create a GitHub repo named `VPS`, add these files, then open the repo in Codespaces.

Run:

```bash
npm install
sudo apt-get update && sudo apt-get install -y openjdk-21-jre-headless
PANEL_TOKEN=change-this npm start
```

Open the forwarded port `3000` from the Codespaces **Ports** tab.

For quick testing without a password:

```bash
npm install
sudo apt-get update && sudo apt-get install -y openjdk-21-jre-headless
npm start
```

## Minecraft Servers

From the left sidebar, open **Minecraft -> Create Server**.

The app creates:

- `servers/<server-name>` for server files
- `backups/<server-name>` for folder backups
- `public/server-control.html` for console, start/stop, plugins, players, and backups

Latest Paper and Latest Vanilla jars are downloaded when the server is created. Open **Panel & Control**, select the server, accept the Minecraft EULA, then start it.

Forward the Minecraft port from Codespaces if players need to join. Default port is `25565`.

## Useful Options

```bash
PANEL_TOKEN=change-this npm start
PANEL_ROOT=/workspaces/VPS npm start
PORT=8080 npm start
```

`PANEL_TOKEN` is strongly recommended if the forwarded port is shared with anyone.

## Docker

```bash
docker build -t ubuntu-vps-panel .
docker run --rm -p 3000:3000 -e PANEL_TOKEN=change-this ubuntu-vps-panel
```

## Important

This gives terminal access to the machine running the app. Keep the Codespaces port private unless you fully trust the person using it.

Minecraft servers require you to accept Mojang/Microsoft's EULA before starting. The panel includes an EULA button for that step.
