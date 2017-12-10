//
//Verwaltet das Kartenmaterial und dessen Handhabung.
//

var Karten = new Map();

exports.Initialisieren = function ()
{
    //Mögliche Level befüllen:
    let Level = ['testus', 'gr1_level10', 'gr1_level11', 'gr1_level12', 'gr1_level13'];
    for (let i = 1; i < 10; i++)
        Level.push('gr1_level0' + i);

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
    var LevelWeiterleitungen = [];
    for (let i = 1; i < 10; i++)
        LevelWeiterleitungen.push('gr1_level' + i);
    var LevelErsetzungen = [];
    for (let i = 1; i < 10; i++)
        LevelErsetzungen.push('gr1_level0' + i);

    //Wenn hinter einem Proxy (Apache), ist die angegebene IP falsch un der Proxyheader muss beachtet werden:
    socket.IP = socket.handshake.headers['x-forwarded-for'] || socket.request.connection.remoteAddress;

    socket.on('KarteWaehlen', function (Kartenname)
        {
            let Levelindex = LevelWeiterleitungen.indexOf(Kartenname);
            if (Levelindex > -1)
                Kartenname = LevelErsetzungen[Levelindex];

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

            //Reihen initialisieren:
            if (!Karte.has(x))
                Karte.set(x, new Map());
            let KarteX = Karte.get(x);
            //Spalten initialisieren:
            if (!KarteX.has(y))
                KarteX.set(y, {Liste: [1]});
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
                KarteY.Liste[WerkzeugID] = 2;
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
    let fs = require('fs');
    fs.writeFile('./speicher/' + Name + '.karo', JSON.stringify(KarteSerialisieren(Karte)), 'utf8', () => {} );
}

function KarteLaden (Name)
{
    let fs = require('fs');
    try
    {
        return JSON.parse(fs.readFileSync('./speicher/' + Name + '.karo', 'utf8').toString());
    }
    catch (error)
    {
        return [];
    }
}