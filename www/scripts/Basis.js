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

    Papier.Liste = [];
    //Karos auf dem Papier zeichnen:
    for (let y = 0; y < 40; y++)
    {
        let Reihe = document.createElement('tr');
        Papier.appendChild(Reihe);
        Papier.Liste[y] = [];

        for(let x = 0; x < 60; x++)
        {
            let Punkt = document.createElement('td');
            
            Punkt.id = "Punkt_" + x + ':' + y;
            Punkt.x = x;
            Punkt.y = y;

            Reihe.appendChild(Punkt);
            Papier.Liste[y][x] = Punkt;

            Punkt.onclick = PunktKlick;
        }
    }

    //Werkzeuge in der Palette mit Funktion ausstatten:
    let Werkzeuge = document.getElementsByClassName('Werkzeug');
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
            let WerkzeugeNode = document.getElementsByClassName('Werkzeug');
            let Werkzeuge = [];
            for (let i = 0; i < WerkzeugeNode.length; i++)
                Werkzeuge.push(WerkzeugeNode[i]);
            Werkzeuge.sort(function (a, b) { return a.getAttribute('werkzeugid') - b.getAttribute('werkzeugid'); }); //Aufsteigend nach ID sortieren.

            for (let i = 0; i < Kartenwerte.length; i++)
                Papier.Liste[Kartenwerte[i].y][Kartenwerte[i].x].style.backgroundImage = Werkzeuge[Kartenwerte[i].id].Stil.backgroundImage;
        }
    );

    Verbindung.on('Eintrag', function (X, Y, WerkzeugID)
        {
            document.getElementById('Punkt_' + X + ':' + Y).style.backgroundImage = document.getElementById('Werkzeug_' + WerkzeugID).Stil.backgroundImage;
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