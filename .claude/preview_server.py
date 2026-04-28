import http.server, os, shutil, pathlib

# Sync app files to /tmp/avonetiq-app on every start
SRC = pathlib.Path(__file__).parent.parent / 'app'
DST = pathlib.Path('/tmp/avonetiq-app')
DST.mkdir(parents=True, exist_ok=True)
shutil.copytree(SRC, DST, dirs_exist_ok=True)

os.chdir(DST)
http.server.test(HandlerClass=http.server.SimpleHTTPRequestHandler, port=3101, bind='127.0.0.1')
