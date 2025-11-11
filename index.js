import express from "express";
import https from 'https';
import fs from 'fs';
import cors from "cors";
import bodyParser from "body-parser";
import { fileURLToPath } from 'url';
import path from "path";
import { WebSocketServer } from "ws";
import mqtt from 'mqtt'; // Importar la librería MQTT

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Usa los mismos certificados que generaste para Angular
const options = {
  key: fs.readFileSync('localhost+3-key.pem'),
  cert: fs.readFileSync('localhost+3.pem')
};

app.use(cors('**'));
app.use(bodyParser.json());

// --- Configuración y conexión MQTT para el Backend Central ---
const MQTT_BROKER_URL = 'mqtt://localhost:1883';
const MQTT_TOPIC_STATUS_WILDCARD = 'media/status/#'; // Suscribirse a todos los estados de medios
const MQTT_TOPIC_COMMANDS_BASE = 'media/commands'; // Tema base para enviar comandos

const mqttClient = mqtt.connect(MQTT_BROKER_URL);

// Mapa para almacenar la última información de medios de cada servidor
const allMediaInfo = new Map(); // Key: serverId, Value: mediaInfo

// --- API Endpoint para que la PWA envíe comandos a equipos específicos ---
app.post('/commands/:serverId/:action', (req, res) => {
  const { serverId, action } = req.params;
  const { payload } = req.body; // El payload puede contener datos adicionales para el comando

  const commandTopic = `${MQTT_TOPIC_COMMANDS_BASE}/${serverId}`;
  const message = { action, serverId, ...payload };

  mqttClient.publish(commandTopic, JSON.stringify(message), (err) => {
    if (err) {
      console.error(`Error al publicar comando MQTT para ${serverId}:`, err);
      return res.status(500).json({ success: false, message: 'Error al enviar comando MQTT' });
    }
    console.log(`Comando MQTT '${action}' enviado a ${serverId} en el tema ${commandTopic}`);
    res.json({ success: true, message: `Comando '${action}' enviado a ${serverId}` });
  });
});

// --- Servidor HTTP y WebSocket ---
const PORT = 5000;

const server = https.createServer(options, app).listen(PORT, () => {
  console.log(`🎧 Central Backend Server running on port ${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', ws => {
  console.log('Cliente WebSocket de PWA conectado');
  
      
  // Enviar toda la información de medios conocida al cliente recién conectado
  if (allMediaInfo.size > 0) {
   
    // const allInfoArray = Array.from(allMediaInfo.values());
    const allInfoArray = Array.from(allMediaInfo.entries()).map(([serverId, data]) => ({
      serverId,
      ...data
    }));
    ws.send(JSON.stringify({ type: 'initial_state', data: allInfoArray }));
  }

  ws.on('close', () => {
    console.log('Cliente WebSocket de PWA desconectado');
  });

  ws.on('error', error => {
    console.error('Error en WebSocket de PWA:', error);
  });
});

// --- Manejadores de eventos MQTT ---
mqttClient.on('connect', () => {
  console.log('Conectado al broker MQTT');
  mqttClient.subscribe(MQTT_TOPIC_STATUS_WILDCARD, (err) => {
    if (!err) {
      console.log(`Suscrito al tema MQTT: ${MQTT_TOPIC_STATUS_WILDCARD}`);
    } else {
      console.error('Error al suscribirse al tema MQTT:', err);
    }
  });
});

mqttClient.on('message', (topic, message) => {
  // message es un Buffer, convertir a string
  const payload = message.toString();
  console.log(`Mensaje MQTT recibido en ${topic}: ${payload}`);

  try {
    // const mediaInfo = JSON.parse(payload);
    // // Extraer el serverId del tema (ej. media/status/chizuru -> chizuru)
    // const serverId = topic.split('/').pop();
    // mediaInfo.serverId = serverId;
    // if (serverId) {
    //   allMediaInfo.set(serverId, mediaInfo);
    const parts = topic.split('/');
    const serverId = parts[2]; // media/status/SERVER_ID
    const subTopic = parts[3]; // media/status/SERVER_ID/SUBTOPIC

    if (!allMediaInfo.has(serverId)) {
      allMediaInfo.set(serverId, { mediaInfo: null, devices: [] });
    }
    const serverState = allMediaInfo.get(serverId);

    if (subTopic === 'devices') {
      serverState.devices = JSON.parse(payload);
      console.log(`Dispositivos actualizados para ${serverId}:`, serverState.devices);
    } else { // Asumimos que es mediaInfo si no es un subtema específico
      serverState.mediaInfo = JSON.parse(payload);
      console.log(`Estado de medios actualizado para ${serverId}:`, serverState.mediaInfo);
    }

      
      // console.log(`Estado actualizado para ${serverId}:`, mediaInfo);

      // Reenviar la actualización a todos los clientes WebSocket conectados
    //   wss.clients.forEach(client => {
    //     if (client.readyState === WebSocket.OPEN) {
    //       const ArrayMediaInfo = Array.from(allMediaInfo.values());
    //       client.send(JSON.stringify({ type: 'update', serverId, data: ArrayMediaInfo }));
    //     }
    //   });
    // }
        // Reenviar la actualización a todos los clientes WebSocket conectados
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        const allInfoArray = Array.from(allMediaInfo.entries()).map(([sId, data]) => ({
          serverId: sId,
          ...data
        }));
        client.send(JSON.stringify({ type: 'update', serverId, data: allInfoArray }));
      }
    });

  } catch (error) {
    console.error('Error al parsear mensaje MQTT o reenviar a WebSocket:', error);
  }
});

mqttClient.on('error', (err) => {
  console.error('Error en el cliente MQTT:', err);
});