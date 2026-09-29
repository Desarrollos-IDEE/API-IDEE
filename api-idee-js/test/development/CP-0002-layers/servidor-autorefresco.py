#!/usr/bin/env python3
"""Servidor manual local: bundles actuales y datos sintéticos, sin dependencias extra.
No es un servidor WFS/OGC completo ni forma parte del WAR o de la API pública.
"""
import argparse
import base64
from collections import Counter
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import struct
from urllib.parse import urlsplit, parse_qs

ROOT = Path(__file__).resolve().parents[3]
FIXTURES = ROOT / 'test/playwright/fixtures/refresh'
PAGE = '/test/development/CP-0002-layers/AUTOREFRESH_LOCAL.html'
COUNTS = Counter()
PIXEL = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC')


def point(revision):
    return {'type': 'FeatureCollection', 'features': [{
        'type': 'Feature', 'id': 'prueba',
        'geometry': {'type': 'Point', 'coordinates': [0, 0]},
        'properties': {'revision': revision, 'nombre': 'Punto de prueba'},
    }]}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        # Permite usar estos datos también desde la consola de Tomcat.
        origin = self.headers.get('Origin', '')
        if origin.startswith(('http://localhost:', 'http://127.0.0.1:')):
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Vary', 'Origin')
            self.send_header('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges')
        super().end_headers()

    def reply(self, body, content_type):
        if isinstance(body, dict):
            body = json.dumps(body).encode()
        elif isinstance(body, str):
            body = body.encode()
        start, end, status = 0, len(body) - 1, 200
        # GeoTIFF usa peticiones parciales HTTP Range.
        range_header = self.headers.get('Range')
        if range_header:
            try:
                unit, interval = range_header.split('=', 1)
                first, last = interval.split('-', 1)
                if unit != 'bytes' or not first or ',' in interval:
                    raise ValueError()
                start = int(first)
                end = min(int(last) if last else end, end)
                if start < 0 or start > end:
                    raise ValueError()
                status = 206
            except ValueError:
                self.send_error(416)
                return
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Accept-Ranges', 'bytes')
        if status == 206:
            self.send_header('Content-Range', f'bytes {start}-{end}/{len(body)}')
        self.send_header('Content-Length', str(end - start + 1))
        self.end_headers()
        self.wfile.write(body[start:end + 1])

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == '/':
            self.send_response(302)
            self.send_header('Location', PAGE + ('?' + urlsplit(self.path).query if urlsplit(self.path).query else ''))
            self.end_headers()
            return
        if path == '/datos-prueba/estado.json':
            self.reply(dict(COUNTS), 'application/json')
            return
        if path.startswith('/datos-prueba/'):
            COUNTS[path] += 1
            revision = COUNTS[path]
            name = path.removeprefix('/datos-prueba/')
            if name in ('puntos.geojson', 'wfs') or name == 'collections/puntos/items':
                # WFS sintético: devuelve GeoJSON al GetFeature del cargador existente.
                self.reply(point(revision), 'application/json')
            elif name == 'puntos.kml':
                self.reply(f'<kml xmlns="http://www.opengis.net/kml/2.2"><Document>'
                           f'<Placemark id="prueba"><name>{revision}</name>'
                           '<Point><coordinates>0,0,0</coordinates></Point>'
                           '</Placemark></Document></kml>', 'application/vnd.google-earth.kml+xml')
            elif name in ('vector.mbtiles', 'raster.mbtiles', 'raster.tif', 'points.gpkg'):
                self.reply((FIXTURES / name).read_bytes(), 'application/octet-stream')
            elif name.endswith('.pbf'):
                self.reply((FIXTURES / 'point.pbf').read_bytes(), 'application/x-protobuf')
            elif name == 'wms' and any(v[0].lower() == 'getcapabilities'
                    for k, v in parse_qs(urlsplit(self.path).query).items() if k.lower() == 'request'):
                url = f'http://127.0.0.1:{self.server.server_port}/datos-prueba/wms?'
                layers = ''.join(f'<Layer queryable="0"><Name>{n}</Name><Title>{n}</Title>'
                    '<CRS>EPSG:3857</CRS><BoundingBox CRS="EPSG:3857" minx="-20037508" '
                    'miny="-20037508" maxx="20037508" maxy="20037508"/></Layer>'
                    for n in ('prueba', 'tematicos:Municipios'))
                self.reply(f'''<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms"
                    xmlns:xlink="http://www.w3.org/1999/xlink"><Service><Name>WMS</Name>
                    <Title>Datos sintéticos locales</Title><OnlineResource xlink:href="{url}"/>
                    </Service><Capability><Request><GetMap><Format>image/png</Format>
                    <DCPType><HTTP><Get><OnlineResource xlink:href="{url}"/></Get></HTTP></DCPType>
                    </GetMap></Request><Layer><Title>Local</Title><CRS>EPSG:3857</CRS>
                    <EX_GeographicBoundingBox><westBoundLongitude>-180</westBoundLongitude>
                    <eastBoundLongitude>180</eastBoundLongitude><southBoundLatitude>-85</southBoundLatitude>
                    <northBoundLatitude>85</northBoundLatitude></EX_GeographicBoundingBox>
                    <BoundingBox CRS="EPSG:3857" minx="-20037508" miny="-20037508"
                    maxx="20037508" maxy="20037508"/>{layers}</Layer></Capability></WMS_Capabilities>''',
                    'application/xml')
            elif name.endswith('.png') or name == 'wms':
                self.reply(PIXEL, 'image/png')
            elif name == 'contexto.xml':
                url = f'http://127.0.0.1:{self.server.server_port}/datos-prueba/wms?'
                self.reply(f'''<ViewContext xmlns="http://www.opengis.net/context"
                    xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1.0" id="prueba">
                    <General><Window width="800" height="600"/>
                    <BoundingBox SRS="EPSG:3857" minx="-1000000" miny="-1000000"
                    maxx="1000000" maxy="1000000"/><Title>Prueba local</Title></General>
                    <LayerList><Layer hidden="0" queryable="0"><Server service="OGC:WMS"
                    version="1.1.1" title="Local"><OnlineResource xlink:type="simple"
                    xlink:href="{url}"/></Server><Name>prueba</Name><Title>Prueba</Title>
                    <SRS>EPSG:3857</SRS><FormatList><Format current="1">image/png</Format>
                    </FormatList><Extension><ol:singleTile xmlns:ol="http://openlayers.org/context">true</ol:singleTile>
                    </Extension></Layer></LayerList></ViewContext>''', 'application/xml')
            elif name == 'tileset.json':
                self.reply({'asset': {'version': '1.1'}, 'geometricError': 0,
                    'root': {'boundingVolume': {'sphere': [6378137, 0, 0, 20000]},
                             'geometricError': 0}}, 'application/json')
            elif name == 'terrain/layer.json':
                self.reply({'tilejson': '2.1.0', 'format': 'heightmap-1.0', 'version': '1.0.0',
                    'scheme': 'tms', 'projection': 'EPSG:4326',
                    'tiles': ['{z}/{x}/{y}.terrain'], 'maxzoom': 0}, 'application/json')
            elif name.endswith('.terrain'):
                self.reply(struct.pack('<H', 5000) * (65 * 65) + bytes([0, 0]),
                           'application/octet-stream')
            else:
                self.send_error(404, 'Dato de prueba inexistente')
            return
        # Solo recursos necesarios; no expone otros módulos del repositorio.
        allowed = ('/dist/', '/test/configuration_filtered.js', '/node_modules/sql.js/dist/',
                   '/test/development/CP-0002-layers/AUTOREFRESH_LOCAL.')
        target = (ROOT / path.lstrip('/')).resolve()
        if not path.startswith(allowed) or not target.is_relative_to(ROOT) or not target.is_file():
            self.send_error(404)
            return
        super().do_GET()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8083)
    args = parser.parse_args()
    print(f'Pruebas: http://localhost:{args.port}/ (Ctrl+C para terminar)', flush=True)
    try:
        ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
    except KeyboardInterrupt:
        print('Servidor detenido.')
