console.log('Beginne mit dem Laden der Module.');

var express = require('express');
var app = express();
var compression = require('compression');
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(compression()); // Gzip-Kompression für alle Seiten.

console.log('Module geladen.');

// Mache dem Server alle notwendigen Verzeichnisse und Dateien bekannt:
app.use('/', express.static('./www/'));

var Kartenverwaltung = require('./scripts/Kartenverwaltung.js');
Kartenverwaltung.Initialisieren();

console.log('Beginne mit Ereignisinitialisierung.');

io.on('connection', function(socket)
{
  if (Debug)
    console.log('Verbindung aufgebaut.');

  socket.on('disconnect', function ()
    {
      if (Debug)
        console.log('Verbindung beendet.');
    }
  );

  Kartenverwaltung.SocketAnbinden(socket);
});

console.log('Ereignisse initialisiert.');

http.listen(8031, function()
{
  console.log('\nServer erfolgreich gestartet: *:8031');
});
