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
        }
    }


}