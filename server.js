const express = require('express');
const SerialPort = require('serialport').SerialPort;
const cors = require('cors');

// Initialize Express app and SerialPort
const app = express();
const port = new SerialPort({ path: "/dev/ttyACM0", baudRate: 9600 });

app.use(express.json());
app.use(cors());

let receivedData = '';
let resolveDataPromise = null;

// Event handler for data received from Arduino
const onData = (data) => {
  receivedData += data.toString();
  if (receivedData.endsWith('\n')) {
    if (resolveDataPromise) {
      resolveDataPromise(receivedData.trim());
      receivedData = '';
    }
  }
};

// Attach event handler to serial port
port.on('data', onData);

// Function to send data to Arduino and return received data as Promise
function sendDataToArduino(data) {
  return new Promise((resolve, reject) => {
    port.write(data, (err) => {
      if (err) {
        reject(`Error writing to port: ${err}`);
      } else {
        resolveDataPromise = resolve;
      }
    });
  });
}

// Endpoint to get data from Arduino
app.get('/getData', async (req, res) => {
  console.log('GET /getData')
  try {
    const data = await sendDataToArduino('R');
    if (data) { 
      res.send(data); 
    }
  } catch (error) {
    res.status(500).send('Error while fetching data from Arduino');
  }
});

// Endpoint to send data to Arduino
app.post('/sendData', async (req, res) => {
  const dataToSend = req.body.data;
  console.log('POST /sendData with data:', dataToSend);
  port.write(dataToSend);
  res.send('Data sent to Arduino');
});

// Event handler for serial port errors
port.on('error', (err) => {
  console.error('Serial port error:', err);
});

// Handle process termination by closing serial port
process.on('SIGINT', () => {
  port.close(() => {
    console.log('Serial port closed');
    process.exit();
  });
});

// Start the Express server
const server = app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
