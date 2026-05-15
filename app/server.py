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
        if args and len(args) > 1 and not str(args[1]).startswith('2'):
            super().log_message(format, *args)

with socketserver.TCPServer(("127.0.0.1", PORT), NoCacheHandler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    httpd.serve_forever()
