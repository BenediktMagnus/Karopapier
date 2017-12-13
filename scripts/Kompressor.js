//Komprimiert alle Javascript- und CSS-Dateien:
srcFolder = './www';
dstFolder = './dist';
module.exports = {
  Komprimiere: function ()
  {
    console.log('Starte Komprimierung.');

    var fs = require('fs');

    console.log('Komprimiere Javascript...');

    //////////////
    //Javascript//
    //////////////

    var KompressorJS = require('uglify-es');

    KompressorJS.Namenscache = {}; //Cache zum Abgleich aller Funktionsnamen in den JS-Dateien.

    var JSVerzeichnisse = [srcFolder + '/scripts'];
    JSVerzeichnisse.forEach( function (Verzeichnis)
      {
        Dateidurchlauf(fs, Verzeichnis, '.js', function (Dateiinhalt)
          {
            var Optionen = {
              warnings: true,
              compress:
              {
                passes: 3, //Anzahl der Durchläufe.
                toplevel: false, //Funktionen und Variablen niemals entfernen, weil das Vorkommen in anderen Skripten nicht erkannt wird!
                warnings: true
              },
              mangle:
              {
                toplevel: true //Alle Funktionen und Variablen mit kurzen Namen bennen. Möglich durch den Cache (s. nameCache).
              },
              nameCache: KompressorJS.Namenscache // Ein Namenscache sorgt für die Persistenz von Funktionsnamen zwischen allen Javascriptdateien.
            };

            var Ergebnis = KompressorJS.minify(Dateiinhalt, Optionen);

            Fehlerbehandlung(Ergebnis);

            return Ergebnis.code;
          }
        , true);
      }
    );

    KompressorJS = null; //Speicher freigeben.


    ///////
    //CSS//
    ///////

    console.log('Komprimiere CSS...');

    var KompressorCSS = require('clean-css');

    Dateidurchlauf(fs, srcFolder + '/css', '.css', function (Dateiinhalt)
      {
        var Ergebnis = new KompressorCSS().minify(Dateiinhalt);

        Fehlerbehandlung(Ergebnis);

        return Ergebnis.styles;
      }
    );

    KompressorCSS = null;


    ////////
    //HTML//
    ////////

    console.log('Komprimiere HTML...');

    var KompressorHTML = require('html-minifier');

    var HTMLVerzeichnisse = [srcFolder];
    HTMLVerzeichnisse.forEach( function (Verzeichnis)
      {
        Dateidurchlauf(fs, Verzeichnis, '.html', function (Dateiinhalt)
          {
            var Optionen = {
              collapseWhitespace: true,
              minifyCSS: true,
              minifyJS: true,
              minifyURLs: true,
              removeComments: true,
              removeEmptyAttributes: true,
              removeRedundantAttributes: true,
              removeScriptTypeAttributes: true,
              removeStyleLinkTypeAttributes: true
            }

            return KompressorHTML.minify(Dateiinhalt, Optionen);
          }
        );
      }
    );

    KompressorHTML = null;

    console.log('Komprimierung abgeschlossen.');
  }
}

/**
 * @param {Object} fs
 * @param {String} Pfad
 * @param {String} Typ
 * @param {Function} Prozedur
 * @param {Boolean} Doppelt
 */
function Dateidurchlauf (fs, Pfad, Typ, Prozedur, Doppelt = false)
{
  var Dateien = fs.readdirSync(Pfad);

  if (Doppelt) Dateien = Dateien.concat(Dateien); //Jede Datei doppelt durchlaufen, um auch über Inhalte der späteren zu wissen!

  for (var i in Dateien)
  {
    if (Dateien[i].includes(Typ))
    {
      var Dateiinhalt = fs.readFileSync(Pfad + '/' + Dateien[i], 'utf8').toString();
      fs.writeFileSync(Pfad.replace(srcFolder, dstFolder) + '/' + Dateien[i], Prozedur(Dateiinhalt), 'utf8');
    }
  }
}

/**
 * @param {String} Ergebnis
 */
function Fehlerbehandlung (Ergebnis)
{
  if (Ergebnis.errors == undefined)
    Ergebnis.errors = Ergebnis.error;

  if ((Ergebnis.error != undefined) && (Ergebnis.error.length != 0))
  {
    console.log('');
    console.log('Ein Fehler ist aufgetreten!');
    console.log('Fehlerhafte Datei: ' + Dateien[i]);
    console.log('');
    throw Ergebnis.error;
  }
  if ((Ergebnis.warnings != undefined) && (Ergebnis.warnings.length != 0))
    console.log(Ergebnis.warnings);
}
