import http.server, os, socketserver

PORT = int(os.environ.get("PORT", 3100))
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        pass  # suppress logs

with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    httpd.serve_forever()
