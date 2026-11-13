# 2H4Y 3D Studio 1.0

**Was funktioniert:**
- Offline: eigenes Foto laden, Rechteck per Touch ziehen, Helligkeitsrelief auf geschlossener Grundplatte erzeugen
- Modellvorschau über WebGL, Finger drehen, Pinch-Zoom; STL (ASCII und binär), OBJ und einfache 3MF-Meshes importieren
- STL (binär) und OBJ exportieren; Quader/Zylinder mit Maßen erzeugen
- Mobile HTML-Einzeldatei, Android-WebView-Projekt und Update-Menü (Quelladresse konfigurierbar)
- Daten bleiben lokal, keine Internet- oder Speicher-Berechtigung notwendig

**Grenzen:** Ein einziges Foto erzeugt kein vollständiges photogrammetrisches Rundum-Modell. 3MF-Materialfarben, Komponenten und Objekt-Transformationen werden nicht vollständig rekonstruiert. 'Druckbar' setzt Nachprüfung im Slicer voraus.

## Sofort benutzen
`2H4Y_3D_Studio_1.0.html` auf dem Smartphone in Chrome oder einem aktuellen Browser öffnen. Alternativ über HTTP(S) hosten. Der Datei-Import erfolgt über die Schaltflächen; STL-Export über 'STL speichern'.

## Android APK auf einem Rechner mit Internet und Android SDK bauen
1. JDK 17 und Android SDK Plattform 35 sowie Gradle 8.9 bereitstellen.
2. Im Verzeichnis `android`: `gradle :app:assembleDebug`.
3. Die Installationsdatei liegt unter `android/app/build/outputs/apk/debug/app-debug.apk`.
4. Oder das gesamte Paket als GitHub-Repository bereitstellen und den Workflow `.github/workflows/android-apk.yml` ausführen. Die APK erscheint als Build-Artefakt.

**Build-Status dieser Lieferung:** Quellcode/HTML erstellt, JavaScript-Berechnungen getestet, Browser-Funktionstest dokumentiert. Die Android-APK konnte in der hiesigen Buildumgebung mangels Android SDK und erreichbaren Paket-Repositories nicht kompiliert werden. Dies ist **keine** fertig signierte APK.

## APK-Signatur und Updates
Debug-APK wird automatisch mit lokalem Android-Debug-Zertifikat signiert. Release-APK benötigt eigenen dauerhaften Keystore, sonst sind spätere App-Updates unter derselben Paket-ID nicht möglich. Der sichtbare Update-Button bietet Versionsanzeige und konfigurierbare HTTPS-Update-Quelle. Vollautomatische In-App-APK-Aktualisierung ist in 1.0 nicht implementiert.

## Datensicherheit
Keine Netzwerk-Berechtigung, keine Cloud-Upload-Funktionen. Android-Systemauswahldialog öffnet nur benutzergewählte Dateien. Der STL-Export erfolgt über Androids `ACTION_CREATE_DOCUMENT`. Dateitypen im WebView-Auswahldialog werden durch den Nutzer geprüft.

## Lizenz
Eigener Quellcode, ohne nachgeladene Drittbibliotheken. Für private Anpassung frei nutzbar.
