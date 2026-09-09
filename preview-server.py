#!/usr/bin/env python3
"""Local preview server. Serves the repo and treats trailing dots as the same file."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", "8765"))


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def translate_path(self, path):
        path = unquote(path.split("?", 1)[0]).rstrip(".")
        if path in ("/concept", "/concept/"):
            path = "/concept.html"
        return super().translate_path(path)


if __name__ == "__main__":
    httpd = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"preview on 0.0.0.0:{PORT}", flush=True)
    httpd.serve_forever()
