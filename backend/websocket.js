// websocket.js
const WebSocket = require('ws');

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', socket => {
  console.log('Client connected');

  socket.on('message', message => {
    console.log(`Received message from client: ${message}`);
  });

  socket.on('close', () => {
    console.log('Client disconnected');
  });
});

const broadcastMessage = (message) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

module.exports = { wss, broadcastMessage };
