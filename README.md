# Karopapier
Karopapier, ein Onlinezeichenpapier zum Erstellen von Karten.


# Eigene Einstellungen
Im Ordner "config" finden sich Standardeinstellungen. Durch das Erstellen gleich aufgebauter Dateien mit der Endung ".config" statt ".default" können eigene Einstellungen definiert werden, welche die Standards überschreiben.
Alle Einstellungsdateien müssen gültiges JSON darstellen.

Unter Linux:
```
cp config/xxx.default config/xxx.conf
nano config/xxx.conf
```