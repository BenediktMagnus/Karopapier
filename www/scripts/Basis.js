document.addEventListener("DOMContentLoaded", Initialisieren, false); 

var Papier;
var Palette;
var Auswahl = null;

var Verbindung = io();

/**
 * Initialisierungsroutine.
 */
function Initialisieren ()
{
    KarteWaehlen();
    Verbindung.on('reconnect', KarteWaehlen);

    function KarteWaehlen ()
    {
        //Raum-ID aus dem Querystring der URL extrahieren, vorangehendes Fragezeichen entfernen:
        Verbindung.emit('KarteWaehlen', window.location.search.substring(1));
    }

    //Das Zeichenpapier, sprich die Tabelle, ermitteln:
    Papier = document.getElementById('Papier');
    //Die Palette zum Zuweisen von Kartenteilen:
    Palette = document.getElementById('Palette');

    Papier.HolePunkt = function (x, y)
    {
        if (Papier.Liste.has(y))
        {
            ListeY = Papier.Liste.get(y);
            if (ListeY.has(x))
                return ListeY.get(x);
        }
        return undefined;
    };

    Papier.Liste = new Map();
    //Karos auf dem Papier zeichnen:
    for (let y = -20; y < 20; y++)
    {
        let Reihe = document.createElement('tr');
        Papier.appendChild(Reihe);

        let ListeX = new Map();
        Papier.Liste.set(y, ListeX);

        for(let x = -30; x < 30; x++)
        {
            let Punkt = document.createElement('td');
            
            Punkt.id = "Punkt_" + x + ':' + y;
            Punkt.x = x;
            Punkt.y = y;

            Reihe.appendChild(Punkt);
            ListeX.set(x, Punkt);

            Punkt.onclick = PunktKlick;
        }
    }

    //Werkzeuge laden und nach ID sortieren:
    let WerkzeugeNode = document.getElementsByClassName('Werkzeug');
    var Werkzeuge = [];
    for (let i = 0; i < WerkzeugeNode.length; i++)
        Werkzeuge.push(WerkzeugeNode[i]);
    Werkzeuge.sort(function (a, b) { return a.getAttribute('werkzeugid') - b.getAttribute('werkzeugid'); }); //Aufsteigend nach ID sortieren.

    //Werkzeuge in der Palette mit Funktion ausstatten:
    for (let i = 0; i < Werkzeuge.length; i++)
    {
        Werkzeuge[i].onclick = WerkzeugKlick;
        Werkzeuge[i].Stil = Werkzeuge[i].currentStyle || window.getComputedStyle(Werkzeuge[i], false)
    }

    function WerkzeugKlick ()
    {
        if (Auswahl != null)
        {
            Verbindung.emit('Eintrag', Auswahl.x, Auswahl.y, this.getAttribute('werkzeugid'));

            Auswahl.style.backgroundImage = this.Stil.backgroundImage;
            Auswahl = null;
            Palette.style.display = 'none';
        }
    }

    //Bei Klick irgendwohin, die Palette ausblenden:
    document.body.addEventListener('click', function ()
        {
            Palette.style.display = 'none';
        },
        true
    );

    Verbindung.emit('KarteHolen', function (Kartenwerte)
        {
            for (let i = 0; i < Kartenwerte.length; i++)
            {
                let Punkt = Papier.HolePunkt(Kartenwerte[i].x, Kartenwerte[i].y);
                if (Punkt != undefined)
                    Punkt.style.backgroundImage = Werkzeuge[Kartenwerte[i].id].Stil.backgroundImage;
            }
        }
    );

    Verbindung.on('Eintrag', function (X, Y, WerkzeugID)
        {
            let Punkt = Papier.HolePunkt(X, Y);
            if (Punkt != undefined)
                Punkt.style.backgroundImage = Werkzeuge[WerkzeugID].Stil.backgroundImage;
        }
    );
}

function PunktKlick ()
{
    Auswahl = this;

    //Palette zuerst anzeigen, um Größe zu haben:
    Palette.style.display = 'inline';

    //X- und Y-Wert ermitteln. Wenn die Palette dadurch über den Bildschirm ragte, Wert entsprechend verkleinern:
    let x = Papier.offsetLeft + this.offsetLeft + this.clientWidth;
    if (x + Palette.clientWidth > document.body.clientWidth)
        x = document.body.clientWidth - Palette.clientWidth;
    let y = Papier.offsetTop + this.offsetTop;
    if (y + Palette.clientHeight > document.body.clientHeight)
        y = document.body.clientHeight - Palette.clientHeight;

    Palette.style.left = x + 'px';
    Palette.style.top = y + 'px';
}