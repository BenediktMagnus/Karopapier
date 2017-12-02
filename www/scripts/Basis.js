document.addEventListener("DOMContentLoaded", Initialisieren, false); 

var Papier;
var Palette;
var Auswahl = null;

/**
 * Initialisierungsroutine.
 */
function Initialisieren ()
{
    //Das Zeichenpapier, sprich die Tabelle, ermitteln:
    Papier = document.getElementById('Papier');
    //Die Palette zum Zuweisen von Kartenteilen:
    Palette = document.getElementById('Palette');

    //Karos auf dem Papier zeichnen:
    for (let y = 0; y < 40; y++)
    {
        let Reihe = document.createElement('tr');
        Papier.appendChild(Reihe);

        for(let x = 0; x < 40; x++)
        {
            let Punkt = document.createElement('td');
            
            Punkt.id = "Punkt_" + x + ':' + y;
            Punkt.x = x;
            Punkt.y = y;

            Reihe.appendChild(Punkt);

            Punkt.onclick = PunktKlick;
        }
    }
    //Werkzeuge in der Palette mit Funktion ausstatten:
    let Werkzeuge = document.getElementsByClassName('Werkzeug');
    for (let i = 0; i < Werkzeuge.length; i++)
        Werkzeuge[i].onclick = WerkzeugKlick;

    function WerkzeugKlick ()
    {
        if (Auswahl != null)
        {
            var Stil = this.currentStyle || window.getComputedStyle(this, false);

            Auswahl.style.backgroundImage = Stil.backgroundImage;
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