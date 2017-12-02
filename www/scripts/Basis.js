document.addEventListener("DOMContentLoaded", Initialisieren, false); 

var Papier;

/**
 * Initialisierungsroutine.
 */
function Initialisieren ()
{
    //Das Zeichenpapier, sprich die Tabelle, ermitteln:
    Papier = document.getElementById('Papier');

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


}

function PunktKlick ()
{
    console.log(this.offsetLeft + ' : ' + this.offsetTop);
    //alert(this.id);
    let Palette = document.getElementById('Palette');

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