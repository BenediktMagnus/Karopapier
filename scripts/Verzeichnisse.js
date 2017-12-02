//Trägt alle notwendigen statischen Verzeichnisse und besonderen Dateien ein:
exports.Eintragen = function (app, express, Debug)
{
  console.log('Starte mit Verzeichniseintrag.');

  var Postfix = '/c';
  if (Debug) Postfix = ''; //Nur im Debugmodus die originalen Skripte laden.

  app.use('/css', express.static('./www/css' + Postfix));
  app.use('/scripts', express.static('./www/scripts' + Postfix));

  app.use('/images', express.static('./www/images')); //Bilder ohne Postfix!
  
  app.use('/', express.static('./www/index' + Postfix + '/'));

  console.log('Verzeichnisse eingetragen.');
};