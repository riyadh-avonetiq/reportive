import http.server, os, shutil, pathlib

# Sync app files to /tmp/avonetiq-app on every start
SRC = pathlib.Path(__file__).parent.parent / 'app'
DST = pathlib.Path('/tmp/avonetiq-app')
if DST.exists():
    shutil.rmtree(DST)
shutil.copytree(SRC, DST)

os.chdir(DST)
http.server.test(HandlerClass=http.server.SimpleHTTPRequestHandler, port=3101, bind='127.0.0.1')
