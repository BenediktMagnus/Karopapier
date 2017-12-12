//
//Verwaltet das Kartenmaterial und dessen Handhabung.
//

var Karten, fs;

exports.Initialisieren = function ()
{
    //Instanzen initialisieren:
    Karten = new Map();
    fs = require('fs');

    //Level/Karten laden:
    let Level = JSON.parse(fs.readFileSync('./config/karten.conf', 'utf8').toString());

    //Level in die Kartenmap setzen:
    for (let i = 0; i < Level.length; i++)
        Karten.set(Level[i], new Map());

    Karten.forEach(function (Karte, Kartenname)
        {
            KarteDeserialisieren(Karte, KarteLaden(Kartenname));
        }
    );
};

/**
 * Bindet alles Notwendige zur Kartenverwaltung an das Socket.
 * @param {Socket} socket 
 */
exports.SocketAnbinden = function (socket)
{
    var Aliase = JSON.parse(fs.readFileSync('./config/aliase.conf', 'utf8').toString());

    //Wenn hinter einem Proxy (Apache), ist die angegebene IP falsch un der Proxyheader muss beachtet werden:
    socket.IP = socket.handshake.headers['x-forwarded-for'] || socket.request.connection.remoteAddress;

    socket.on('KarteWaehlen', function (Kartenname)
        {
            let Alias = Aliase[Kartenname];
            if (Alias != undefined)
                Kartenname = Alias;

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
            //Nur Zahlen(!) zwischen -128 und 128 erlauben, außerdem Werkzeuge begrenzen:
            if (x > 128 || x < -128 || y > 128 || y < 128 || isNaN(x) || isNaN(y) || WerkzeugID < 0 || WerkzeugID > 16 || isNaN(WerkzeugID))
                return;

            let Karte = socket.Karte;
            if (Karte == undefined) return;

            //Reihen initialisieren:
            if (!Karte.has(x))
                Karte.set(x, new Map());
            let KarteX = Karte.get(x);
            //Spalten initialisieren:
            if (!KarteX.has(y))
                KarteX.set(y, {Liste: [2]});
            let KarteY = KarteX.get(y);

            //IP-Liste ggf. initialisieren und andernfalls prüfen, ob ein Werkzeug bereits ausgewählt:
            if (KarteY.IPs == undefined)
                KarteY.IPs = new Map();
            else if (KarteY.IPs.has(socket.IP))
            {
                let Werkzeug = KarteY.IPs.get(socket.IP);
                if (Werkzeug == WerkzeugID)
                    return; //Wenn dasselbe Werkzeug nochmal ausgewählt wurde, muss nichts getan werden.
                else
                    KarteY.Liste[Werkzeug]--;
            }

            //Entsprechendes Werkzeug setzen:
            if (KarteY.Liste[WerkzeugID] == undefined)
                KarteY.Liste[WerkzeugID] = 1;
            else
                KarteY.Liste[WerkzeugID]++;

            KarteY.IPs.set(socket.IP, WerkzeugID);

            //Die anderen nur über die Änderung informieren, wenn es dadurch das Höchste ist:
            if (HoechstenWertErmitteln(KarteY.Liste) == WerkzeugID)
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

function HoechstenWertErmitteln (Punkt)
{
    let Hoechstes = 0;
    let Wert = 0;

    //Höchste Zahl an Unterstützern ermitteln, das nehmen, undefinierte Werte ignorieren:
    for (let i = 0; i < Punkt.length; i++)
        if ((Punkt[i] != undefined) && (Punkt[i] > Hoechstes))
        {
            Hoechstes = Punkt[i];
            Wert = i;
        }

    return Wert;
}

function KarteSerialisieren (Karte)
{
    let Kartenwerte = [];

    Karte.forEach((KarteX, x) => 
        {
            KarteX.forEach((KarteY, y) =>
                {
                    Kartenwerte.push({'x': x, 'y': y, 'id': HoechstenWertErmitteln(KarteY.Liste)});
                }
            );
        }
    );
    
    return Kartenwerte;
}

function KarteDeserialisieren (Karte, Kartenwerte)
{
    for (let i = 0; i < Kartenwerte.length; i++)
    {
        let x = Kartenwerte[i].x;
        let y = Kartenwerte[i].y;
    
        //Reihen initialisieren:
        if (!Karte.has(x))
            Karte.set(x, new Map());
        let KarteX = Karte.get(x);
        //Spalten initialisieren:
        if (!KarteX.has(y))
            KarteX.set(y, {Liste: []});
        let KarteY = KarteX.get(y);

        KarteY.Liste[Kartenwerte[i].id] = 2;
    }
}

function KarteSpeichern (Karte, Name)
{
    fs.writeFile('./speicher/' + Name + '.karo', JSON.stringify(KarteSerialisieren(Karte)), 'utf8', () => {} );
}

function KarteLaden (Name)
{
    try
    {
        return JSON.parse(fs.readFileSync('./speicher/' + Name + '.karo', 'utf8').toString());
    }
    catch (error)
    {
        return [];
    }
}