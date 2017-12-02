//
//Verwaltet das Kartenmaterial und dessen Handhabung.
//

var Karten = new Map();

exports.Initialisieren = function ()
{
    let Level = ['testus', 'level1', 'level2', 'level3', 'level4', 'level5', 'level6'];

    for (let i = 0; i < Level.length; i++)
        Karten.set(Level[i], []);

    Karten.forEach( KarteDeserialisieren); //Beide haben die gleichen Parameter, daher geht das.
};

/**
 * Bindet alles Notwendige zur Kartenverwaltung an das Socket.
 * @param {Socket} socket 
 */
exports.SocketAnbinden = function (socket)
{
    socket.on('KarteWaehlen', function (Kartenname)
        {
            if (Karten.has(Kartenname))
            {
                socket.Karte = Karten.get(Kartenname);
                socket.join(Kartenname);
                socket.Raum = Kartenname;
            }
        }
    );

    socket.on('Eintrag', function (x, y, WerkzeugID)
        {
            let Karte = socket.Karte;
            if (Karte == undefined) return;

            //Reihen und Spalten initialisieren:
            if (Karte[x] == undefined) Karte[x] = [];
            if (Karte[x][y] == undefined) Karte[x][y] = [];

            //IP-Liste ggf. initialisieren und andernfalls prüfen, ob ein Werkzeug bereits ausgewählt:
            if (Karte[x][y].IPs == undefined)
                Karte[x][y].IPs = new Map();
            else if (Karte[x][y].IPs.has(socket.request.connection.remoteAddress))
            {
                let Werkzeug = Karte[x][y].IPs.get(socket.request.connection.remoteAddress);
                if (Werkzeug == WerkzeugID)
                    return; //Wenn dasselbe Werkzeug nochmal ausgewählt wurde, muss nichts getan werden.
                else
                    Karte[x][y][Werkzeug]--;
            }

            //Entsprechendes Werkzeug setzen:
            if (Karte[x][y][WerkzeugID] == undefined)
                Karte[x][y][WerkzeugID] = 1;
            else
                Karte[x][y][WerkzeugID]++;

            Karte[x][y].IPs.set(socket.request.connection.remoteAddress, WerkzeugID);

            socket.broadcast.to(socket.Raum).emit('Eintrag', x, y, WerkzeugID);

            KarteSpeichern(socket.Karte, socket.Raum);
        }
    );

    socket.on('KarteHolen', function (KarteGeben)
        {
            let Karte = socket.Karte;
            if (Karte == undefined) return;
            
            KarteGeben(KarteSerialisieren(Karte));
        }
    );
};

function KarteSerialisieren (Karte)
{
    let Kartenwerte = [];

    for (let x = 0; x < Karte.length; x++)
        if (Karte[x] != undefined)
            for (let y = 0; y < Karte[x].length; y++)
            {
                if (Karte[x][y] != undefined)
                {
                    let Hoechstes = 0;
                    let Wert = 0;

                    //Höchste Zahl an Unterstützern ermitteln, das nehmen, undefinierte Werte ignorieren:
                    for (let i = 0; i < Karte[x][y].length; i++)
                        if ((Karte[x][y][i] != undefined) && (Karte[x][y][i] > Hoechstes))
                        {
                            Hoechstes = Karte[x][y][i];
                            Wert = i;
                        }

                        Kartenwerte.push({'x': x, 'y': y, 'id': Wert});
                }
            }
    
    return Kartenwerte;
}

function KarteDeserialisieren (Karte, Kartenwerte)
{
    for (let i = 0; i < Kartenwerte.length; i++)
    {
        let x = Kartenwerte[i].x;
        let y = Kartenwerte[i].y;
    
        //Reihen und Spalten initialisieren:
        if (Karte[x] == undefined) Karte[x] = [];
        if (Karte[x][y] == undefined) Karte[x][y] = [];

        Karte[x][y][Kartenwerte.id] = 3;
    }
}

function KarteSpeichern (Karte, Name)
{
    let fs = require('fs');
    fs.writeFile('./speicher/' + Name + '.karo', JSON.stringify(KarteSerialisieren(Karte)), 'utf8', () => {} );
}

function KarteLaden (Name)
{
    let fs = require('fs');
    return JSON.parse(fs.readFileSync('./speicher/' + Name + '.karo', 'utf8').toString());
}