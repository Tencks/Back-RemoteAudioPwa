import express from "express";
// import https from 'https';
import fs from 'fs';
import cors from "cors";
import bodyParser from "body-parser";
import pkg from "native-sound-mixer";

const { default: SoundMixer } = pkg;
const app = express();

// Usa los mismos certificados que generaste para Angular
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

app.use(cors());
app.use(bodyParser.json());

/**
 * 🖥️ GET /devices
 * Devuelve todos los dispositivos y sesiones activas
 */
app.get("/devices", (req, res) => {
  const devices = SoundMixer.devices.map((device, i) => ({
    id: i,
    name: device.name,
    type: device.type,
    volume: device.volume,
    mute: device.mute,
    sessions: device.sessions.map((s, j) => ({
      id: `${i}-${j}`,
      name: s.name,
      volume: s.volume,
      mute: s.mute,
    })),
  }));

  res.json(devices);
});

/**
 * 🔊 POST /device/:id/volume
 * Cambia el volumen de un dispositivo
 * body: { volume: 0.5 }
 */
app.post("/device/:id/volume", (req, res) => {
  const { id } = req.params;
  const { volume } = req.body;
  const device = SoundMixer.devices[id];

  if (!device) return res.status(404).json({ error: "Device not found" });

  device.volume = Math.max(0, Math.min(1, volume));
  res.json({ success: true, newVolume: device.volume });
});

/**
 * 🔇 POST /device/:id/mute
 * body: { mute: true/false }
 */
app.post("/device/:id/mute", (req, res) => {
  const { id } = req.params;
  const { mute } = req.body;
  const device = SoundMixer.devices[id];

  if (!device) return res.status(404).json({ error: "Device not found" });

  device.mute = !!mute;
  res.json({ success: true, mute: device.mute });
});

/**
 * 🎧 POST /session/:deviceId/:sessionId/volume
 * body: { volume: 0.3 }
 */
app.post("/session/:deviceId/:sessionId/volume", (req, res) => {
  const { deviceId, sessionId } = req.params;
  const { volume } = req.body;
  const device = SoundMixer.devices[deviceId];
  if (!device) return res.status(404).json({ error: "Device not found" });

  const session = device.sessions[sessionId];
  if (!session) return res.status(404).json({ error: "Session not found" });

  session.volume = Math.max(0, Math.min(1, volume));
  res.json({ success: true, newVolume: session.volume });
});

/**
 * 🔇 POST /session/:deviceId/:sessionId/mute
 * body: { mute: true/false }
 */
app.post("/session/:deviceId/:sessionId/mute", (req, res) => {
  const { deviceId, sessionId } = req.params;
  const { mute } = req.body;
  const device = SoundMixer.devices[deviceId];
  if (!device) return res.status(404).json({ error: "Device not found" });

  const session = device.sessions[sessionId];
  if (!session) return res.status(404).json({ error: "Session not found" });

  session.mute = !!mute;
  res.json({ success: true, mute: session.mute });
});

/**
 * 🚀 Start server
 */
const PORT = 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🎧 Audio control server running on port ${PORT}`);
  console.log(`Access it from your LAN at: http://<PC_IP>:${PORT}/devices`);

});

// const PORT = 5000;

// https.createServer(options, app).listen(PORT, () => {
//   console.log(`🎧 Audio control server running on port ${PORT}`);
//   console.log(`Access it from your LAN at: http://<PC_IP>:${PORT}/devices`);
// });

