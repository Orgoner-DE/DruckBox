# Programme-Final

Finale, zusammengeführte Version aller 3D- und Utility-Programme für den Alltag mit Prusa CORE One L, STL/3MF und Mesh-Pipeline.

Stand: 28. August 2026 · Paketversion 1.0.0

Repo: https://github.com/Orgoner-DE/DruckBox

## Inhalt

- `werkzeug.py` – eine CLI für alle Befehle
- `tools/generate_stl.py` – Primitive als druckbare STL
- `tools/repair_mesh.py` – wasserdicht / manifold für PrusaSlicer
- `tools/batch_repair.sh` – ganze Ordner reparieren
- `tools/mesh_optimizer.py` – repair / simplify / smooth / full
- `tools/performance_optimizer.py` – aggressive Triangle-Reduktion
- `tools/adaptive_cache.py` – selbstlernender In-Memory-Cache
- `druckbox/index.html` – Demo-Katalog im Stil Printables/MakerWorld

## Installation

```bash
python3 -m pip install -r requirements.txt
chmod +x werkzeug.py tools/batch_repair.sh
```

## Schnellstart

```bash
python3 werkzeug.py create cube --length 20 --width 10 --height 5 -o examples/wuerfel.stl
python3 werkzeug.py repair datei.stl -o out/
python3 werkzeug.py optimize datei.stl --operation full --ratio 0.4
python3 werkzeug.py performance datei.stl --ratio 0.25
python3 werkzeug.py cache --demo
```

Vollständige Doku steht in diesem README und in der lokalen ZIP `Programme-Final.zip`.
