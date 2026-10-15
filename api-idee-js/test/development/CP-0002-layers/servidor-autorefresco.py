#!/usr/bin/env python3
"""Servidor manual local: bundles actuales y datos sintéticos, sin dependencias extra.
No es un servidor WFS/OGC completo ni forma parte del WAR o de la API pública.
"""
import argparse
import base64
from collections import Counter
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import io
import zipfile
from pathlib import Path
import struct
import sqlite3
import zlib
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


def geopackage(revision, raster=False):
    """GeoPackage sintético cambiante, vectorial o mixto; no modifica fixtures existentes."""
    db = sqlite3.connect(':memory:')
    db.executescript("""
        PRAGMA application_id=1196444487;
        PRAGMA user_version=10300;
        CREATE TABLE gpkg_spatial_ref_sys (srs_name TEXT NOT NULL, srs_id INTEGER PRIMARY KEY,
            organization TEXT NOT NULL, organization_coordsys_id INTEGER NOT NULL,
            definition TEXT NOT NULL, description TEXT);
        INSERT INTO gpkg_spatial_ref_sys VALUES ('Undefined Cartesian', -1, 'NONE', -1, 'undefined', '');
        INSERT INTO gpkg_spatial_ref_sys VALUES ('Undefined Geographic', 0, 'NONE', 0, 'undefined', '');
        INSERT INTO gpkg_spatial_ref_sys VALUES ('WGS 84', 4326, 'EPSG', 4326, 'undefined', '');
        INSERT INTO gpkg_spatial_ref_sys VALUES ('Web Mercator', 3857, 'EPSG', 3857, 'undefined', '');
        CREATE TABLE gpkg_contents (table_name TEXT PRIMARY KEY, data_type TEXT NOT NULL,
            identifier TEXT UNIQUE, description TEXT DEFAULT '', last_change DATETIME NOT NULL,
            min_x DOUBLE, min_y DOUBLE, max_x DOUBLE, max_y DOUBLE, srs_id INTEGER);
        CREATE TABLE gpkg_geometry_columns (table_name TEXT NOT NULL, column_name TEXT NOT NULL,
            geometry_type_name TEXT NOT NULL, srs_id INTEGER NOT NULL, z TINYINT NOT NULL,
            m TINYINT NOT NULL, PRIMARY KEY(table_name, column_name));
        CREATE TABLE puntos (id INTEGER PRIMARY KEY, geom POINT, revision INTEGER);
        INSERT INTO gpkg_contents VALUES ('puntos','features','puntos','','2026-10-07T00:00:00Z',0,0,0,0,4326);
        INSERT INTO gpkg_geometry_columns VALUES ('puntos','geom','POINT',4326,0,0);
    """)
    geometry = b'GP' + bytes([0, 1]) + struct.pack('<iBIdd', 4326, 1, 1, 0, 0)
    db.execute('INSERT INTO puntos VALUES (1, ?, ?)', (geometry, revision))
    if raster:
        db.executescript("""
            CREATE TABLE gpkg_tile_matrix_set (table_name TEXT PRIMARY KEY, srs_id INTEGER NOT NULL,
                min_x DOUBLE NOT NULL, min_y DOUBLE NOT NULL, max_x DOUBLE NOT NULL, max_y DOUBLE NOT NULL);
            CREATE TABLE gpkg_tile_matrix (table_name TEXT NOT NULL, zoom_level INTEGER NOT NULL,
                matrix_width INTEGER NOT NULL, matrix_height INTEGER NOT NULL,
                tile_width INTEGER NOT NULL, tile_height INTEGER NOT NULL,
                pixel_x_size DOUBLE NOT NULL, pixel_y_size DOUBLE NOT NULL,
                PRIMARY KEY(table_name, zoom_level));
            CREATE TABLE raster (id INTEGER PRIMARY KEY, zoom_level INTEGER NOT NULL,
                tile_column INTEGER NOT NULL, tile_row INTEGER NOT NULL, tile_data BLOB NOT NULL);
            INSERT INTO gpkg_contents VALUES ('raster','tiles','raster','','2026-10-07T00:00:00Z',
                -20037508.342789244,-20037508.342789244,20037508.342789244,20037508.342789244,3857);
            INSERT INTO gpkg_tile_matrix_set VALUES ('raster',3857,
                -20037508.342789244,-20037508.342789244,20037508.342789244,20037508.342789244);
            INSERT INTO gpkg_tile_matrix VALUES ('raster',0,1,1,256,256,156543.03392804097,156543.03392804097);
        """)
        def chunk(kind, data):
            return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data))
        color = bytes([40, 120, 220]) if revision % 2 else bytes([220, 120, 40])
        png = (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', 256, 256, 8, 2, 0, 0, 0))
               + chunk(b'IDAT', zlib.compress((b'\x00' + color * 256) * 256)) + chunk(b'IEND', b''))
        db.execute('INSERT INTO raster VALUES (1, 0, 0, 0, ?)', (png,))
    db.commit()
    result = db.serialize()
    db.close()
    return result


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
            elif name in ('puntos.kml', 'puntos.kmz'):
                kml = (f'<kml xmlns="http://www.opengis.net/kml/2.2"><Document>'
                       f'<Placemark id="prueba"><name>{revision}</name>'
                       '<Point><coordinates>0,0,0</coordinates></Point>'
                       '</Placemark></Document></kml>')
                if name.endswith('.kmz'):
                    output = io.BytesIO()
                    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
                        archive.writestr('doc.kml', kml)
                    self.reply(output.getvalue(), 'application/vnd.google-earth.kmz')
                else:
                    self.reply(kml, 'application/vnd.google-earth.kml+xml')
            elif name == 'puntos.gpx':
                self.reply('<gpx version="1.1" creator="API-IDEE test" '
                           'xmlns="http://www.topografix.com/GPX/1/1">'
                           '<wpt lon="0" lat="0"><ele>10</ele>'
                           f'<name>GPX revisión {revision}</name>'
                           '<desc>Punto sintético para comprobar el autorefresco.</desc>'
                           '<time>2026-10-01T00:00:00Z</time></wpt></gpx>',
                           'application/gpx+xml')
            elif name in ('autorefresh-vector.gpkg', 'autorefresh-mixed.gpkg'):
                self.reply(geopackage(revision, 'mixed' in name), 'application/geopackage+sqlite3')
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
