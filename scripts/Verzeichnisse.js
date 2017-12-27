//Trägt alle notwendigen statischen Verzeichnisse und besonderen Dateien ein:
exports.Eintragen = function (app, express, Debug)
{
  console.log('Starte mit Verzeichniseintrag.');

  if(Debug)
  {
    app.use('/', express.static('./www/'));
  }
  else
  {
    app.use('/', express.static('./dist/'));
  }

  console.log('Verzeichnisse eingetragen.');
};
