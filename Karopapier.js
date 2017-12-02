///////////////////
/////Karopapier////
//Benedikt Magnus//
///////////////////

var Debug = false;
if (process.argv[2] == 'debug')
  Debug = true;

console.log('\nStarte Karopapier.');

//Komprimiere bei Serverstart CSS und Javascript:
if (!Debug) //Nur im Debugmodus die Kompression umgehen:
{
  var Kompressor = require('./scripts/Kompressor.js');
  Kompressor.Komprimiere();
  Kompressor = null;
}

console.log('Beginne mit dem Laden der Module.');

var express = require('express');
var app = express();
var compression = require('compression');
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(compression()); //Gzip-Kompression für alle Seiten.

console.log('Module geladen.');

//Mache dem Server alle notwendigen Verzeichnisse und Dateien bekannt:
var Verzeichnisse = require('./scripts/Verzeichnisse.js');
Verzeichnisse.Eintragen(app, express, Debug);
Verzeichnisse = null; //Verzeichnisobjekt wird nicht mehr benötigt.

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
