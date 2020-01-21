
/**
 * Initialisierungsroutine.
 */
function Initialisieren ()
{
    Verbindung.on('reconnect', KarteWaehlen);

    function KarteWaehlen ()
    {
        var URLPosition = window.location.search;
        if (URLPosition.charAt(1) == '-')
        {
            URLPosition = URLPosition.substring(1); //Erstes Zeichen abschneiden.

            var link  = document.createElement('link');
            link.rel  = 'stylesheet';
            link.type = 'text/css';
            link.href = '/css/Trans.css';
            document.body.appendChild(link);
        }
    }

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
