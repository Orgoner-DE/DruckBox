#!/usr/bin/env python3
"""werkzeug – einheitliche CLI für alle Programme-Final-Tools."""
from __future__ import annotations
import os, sys
ROOT = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.join(ROOT, "tools")
if TOOLS not in sys.path:
    sys.path.insert(0, TOOLS)
HELP = """Programme-Final | einheitliches 3D-Werkzeug
Befehle: create, repair, optimize, performance, cache, info"""
def main(argv=None):
    argv = list(sys.argv[1:] if argv is None else argv)
    if not argv or argv[0] in ("-h", "--help", "help", "info"):
        print(HELP); return 0
    cmd, rest = argv[0].lower(), argv[1:]
    if cmd in ("create", "stl", "generate"):
        from generate_stl import main as create_main
        if rest and not rest[0].startswith("{") and not rest[0].endswith(".json"):
            if rest[0] in ("cube", "box", "sphere", "cylinder", "cone", "torus"):
                rest = ["--type", rest[0], *rest[1:]]
        create_main(rest); return 0
    if cmd in ("repair", "fix", "prusa"):
        from repair_mesh import main as repair_main; repair_main(rest); return 0
    if cmd in ("optimize", "opt", "mesh"):
        from mesh_optimizer import main as opt_main; opt_main(rest); return 0
    if cmd in ("performance", "perf", "speed"):
        from performance_optimizer import main as perf_main; perf_main(rest); return 0
    if cmd in ("cache", "adaptive-cache"):
        from adaptive_cache import main as cache_main; cache_main(rest or ["--demo"]); return 0
    print("Unbekannter Befehl:", cmd); print(HELP); return 1
if __name__ == "__main__":
    sys.exit(main())
