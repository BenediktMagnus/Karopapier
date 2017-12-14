;(function($, io) {

    var werkzeugIdAttribut = 'werkzeugId';
    var werkzeuge = [
        {
            id: 1,
            tooltip: 'Weg',
            klasse: 'PWeg'
        },
        {
            id: 2,
            tooltip: 'Platte',
            klasse: 'PPlatte'
        },
        {
            id: 3,
            tooltip: 'Tor Oben',
            klasse: 'PTorO'
        },
        {
            id: 4,
            tooltip: 'Tor Unten',
            klasse: 'PTorU'
        },
        {
            id: 5,
            tooltip: 'Tor Links',
            klasse: 'PTorL'
        },
        {
            id: 6,
            tooltip: 'Tor Rechts',
            klasse: 'PTorR'
        },
        {
            id: 7,
            tooltip: 'Stufen',
            klasse: 'PStufen'

        },
        {
            id: 8,
            tooltip: 'Spielerposition',
            klasse: 'PPfeil'
        },
        {
            id: 0,
            tooltip: 'Leer',
            klasse: 'PLeer'
        }
    ];


    var ausgewaehltesWerkzeug = null;
    var $ausgewaehltesFeld = null;

    var felder;

    var minX = -30, maxX = 30;
    var minY = -20, maxY = 20;

    var socket = io();

    var $palette = null;

    /* Kartenfunktionen */


    function feldSetzen(x, y, werkzeugId) {
        x = x - minX;
        y = y - minY;
        if(felder.length > x && felder[x].length > y) {
            var werkzeug = werkzeuge.find(function(w) { return w.id === werkzeugId });
            if(werkzeug) {
                felder[x][y].removeClass().addClass(werkzeug.klasse);
            }
        }
    }

    /* Event Handler */
    function sidebarWerkzeugKlick() {
        var $this = $(this);
        var werkzeugId = $this.data(werkzeugIdAttribut);
        $('.sidebar .werkzeug').removeClass('selected');
        $this.addClass('selected');
        ausgewaehltesWerkzeug = werkzeugId;
        paletteVerstecken();
    }

    function paletteWerkzeugKlick() {
        if(!$ausgewaehltesFeld) {
            return;
        }
        var x = $ausgewaehltesFeld.data('x');
        var y = $ausgewaehltesFeld.data('y');
        var werkzeugId = $(this).data(werkzeugIdAttribut);
        feldSetzen(x, y, werkzeugId);
        socket.emit('Eintrag', x, y, werkzeugId);
        $ausgewaehltesFeld = null;
        paletteVerstecken();
    }

    function feldKlick () {
        var $this = $(this);
        if(!isNaN(ausgewaehltesWerkzeug) && isFinite(ausgewaehltesWerkzeug) && ausgewaehltesWerkzeug !== null) {
            var x = $this.data('x');
            var y = $this.data('y');
            feldSetzen(x, y, ausgewaehltesWerkzeug);
            socket.emit('Eintrag', x, y, ausgewaehltesWerkzeug);
        }
        else {
            paletteAnzeigen($this);
        }
    }

    function feldMouseEnter() {
        var $this = $(this);
        $('.sidebar .koordinaten').text($this.data('x') + ':' + $this.data('y'));
    }

    /* Socket.IO Geraffel */
    function karteWaehlen() {
        var URLPosition = window.location.search;
        if (URLPosition.charAt(1) === '-')
        {
            URLPosition = URLPosition.substring(1); //Erstes Zeichen abschneiden.

            $('body').removeClass().addClass('transparent-background');
        }
        //Raum-ID aus dem Querystring der URL extrahieren, vorangehendes Fragezeichen entfernen:
        socket.emit('KarteWaehlen', URLPosition.substring(1));

        socket.emit('KarteHolen', function (karte)
            {
                // Randwerte ermitteln
                minX = -30;
                maxX = 30;
                minY = -20;
                maxY = 20;
                for(var j = 0; j < karte.length; j++) {
                    if(karte[j].x < minX) {
                        minX = karte[j].x;
                    }
                    else if(karte[j].x > maxX) {
                        maxX = karte[j].x;
                    }
                    if(karte[j].y < minY) {
                        minY = karte[j].y;
                    }
                    else if(karte[j].y > maxY) {
                        maxY = karte[j].y;
                    }
                }
                felder = [];
                var $tabelle = $('#Papier');
                $tabelle.empty();

                // Jede Tabellenzeile enthaelt alle [x]. Da wir aber [x][y] wollen muessen wir die Array-Zuweisung drehen

                for(var y = minY; y <= maxY; y++) {
                    var reihe = [];
                    for(var x = minX; x <= maxX; x++) {
                        if(felder.length <= x - minX) {
                            felder.push([]);
                        }
                        var $zelle = $('<td></td>');
                        $zelle.attr('id', 'Punkt_' + x + ':' + y);
                        $zelle.data('x', x);
                        $zelle.data('y', y);
                        $zelle.click(feldKlick);
                        $zelle.on('mouseenter', feldMouseEnter);
                        felder[x - minX].push($zelle);
                        reihe.push($zelle);
                    }
                    felder.push(reihe);
                    var $reihe = $('<tr></tr>');
                    $reihe.append(reihe);
                    $tabelle.append($reihe);
                }

                for (var i = 0; i < karte.length; i++)
                {
                    feldSetzen(karte[i].x, karte[i].y, karte[i].id);
                }
            }
        );
    }


    socket.on('reconnect', karteWaehlen);
    socket.on('Eintrag', feldSetzen);

    // UI Hilfsfunktionen
    function paletteAnzeigen($feld) {
        // Palette zuerst anzeigen, um Größe zu haben:
        $palette.show();
        if($feld) {
            // hier gibt es einen Bug wenn die Palette ausserhalb des Bildschirms erscheint. Dadurch verschieben sich alle Elemente wegen der Scrollbar
            // deshalb initial einmal die Position auf (0, 0) setzen, dadurch wird die Scrollbar vermieden
            $palette.css({'top': 0, 'left': 0});
            var feldOffset = $feld.offset();
            // X- und Y-Wert ermitteln. Wenn die Palette dadurch über den Bildschirm ragte, Wert entsprechend verkleinern:
            var $body = $('body');
            var x = feldOffset.left + $feld.innerWidth();
            if (x + $palette.innerWidth() > $body.innerWidth()) {
                x = $body.innerWidth() - $palette.innerWidth();
            }
            var y = feldOffset.top;
            if (y + $palette.innerHeight() > $body.innerHeight()) {
                y = $body.innerHeight() - $palette.innerHeight();
            }
            $ausgewaehltesFeld = $feld;
            $palette.css({'top': y + 'px', 'left': x + 'px'});
            $('.palette-koordinaten').text($feld.data('x') + ':' + $feld.data('y'));
        }
    }

    function paletteVerstecken() {
        $palette.hide();
    }

    // Initialisierung

    function werkzeugButtonErstellen(tooltip, klasse, id) {
        var $button = $('<div></div>');
        $button.addClass('werkzeug');
        $button.attr('title', tooltip);
        if(!isNaN(id) && id > -1) {
            $button.addClass(klasse);
            $button.data(werkzeugIdAttribut, id);
        }
        return $button;
    }

    function buttonsErstellen() {
        var $elements = [];
        werkzeuge.forEach(function (werkzeug) {
            $elements.push(werkzeugButtonErstellen(werkzeug.tooltip, werkzeug.klasse, werkzeug.id));
        });
        return $elements;
    }

    $(document).ready(function() {
        $palette = $('.palette');
        paletteVerstecken();
        // beim Klick irgendwo hin weg mit der Palette
        // muss direkt addEventListener sein weil jQuery kein event capturing kann
        document.body.addEventListener('click', function() {
            paletteVerstecken();
        }, true);

        // Buttons erstellen und mit event handlern ausstatten

        var $sidebarButtons = buttonsErstellen();
        // In der sidebar noch den Button zum Moduswechsel einbauen
        var $modusButton = werkzeugButtonErstellen('Auswahl aufheben', 'PAuswahl');
        // Der ist auch direkt ausgewaehlt
        $modusButton.addClass('selected');
        $sidebarButtons.unshift($modusButton);
        $('.sidebar .werkzeug-container').append($sidebarButtons);
        $('.sidebar .werkzeug').on('click', sidebarWerkzeugKlick);



        var $paletteButtons = buttonsErstellen();
        $palette.find('.werkzeug-container').append($paletteButtons);
        $palette.find('.werkzeug').on('click', paletteWerkzeugKlick);

        karteWaehlen();

    });

})(window.jQuery, window.io);
