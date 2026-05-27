#!/usr/bin/env python3
"""Local dev server with CORS proxy for the vlrggapi."""
import http.server
import urllib.request
import urllib.error
import os

API_BASE = 'https://v.kiringo.cn'
VLR_API_BASE = 'https://vlr.kiringo.cn'
PORT = 8080

class CORSProxyHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/v2/'):
            self._proxy(API_BASE)
        elif self.path.startswith('/api/v1/'):
            self._proxy(VLR_API_BASE)
        else:
            super().do_GET()

    def _proxy(self, base):
        url = base + self.path
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = resp.read()
                self.send_response(resp.status)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Cache-Control', 'no-cache')
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(e.read())
        except Exception as e:
            self.send_response(502)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(f'{{"error":"{e}"}}'.encode())

os.chdir(os.path.dirname(os.path.abspath(__file__)))
print(f'Starting server at http://localhost:{PORT}')
http.server.HTTPServer(('', PORT), CORSProxyHandler).serve_forever()
