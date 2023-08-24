const express = require('express');
const SerialPort = require('serialport').SerialPort;
const cors = require('cors');

const app = express();
const port = new SerialPort({path: "/dev/ttyACM0", baudRate: 9600});

app.use(express.json());

app.use(cors());

app.post('/sendData', (req, res) => {
  const dataToSend = req.body.data;
  port.write(dataToSend);
  res.send('Data sent to Arduino');
});

app.get('/arduinoData', (req, res) => {
  let receivedData = '';

  port.on('data', (data) => {
    receivedData += data.toString();
  });

  port.write('R');

  setTimeout(() => {
    res.send(receivedData);
  }, 1000);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
