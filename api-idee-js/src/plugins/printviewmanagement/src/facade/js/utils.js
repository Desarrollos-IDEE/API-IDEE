// eslint-disable-next-line import/first
import JsZip from 'jszip';
// eslint-disable-next-line import/first
import { saveAs } from 'file-saver';
import { getValue } from './i18n/language';

// FORMAT IMAGE (png|jpeg)
const REGEX_FORMAT_IMAGE = /^data:image\/(png|jpeg);base64,/;

// Generate wld file
export function createWLD(bbox, dpi, size, epsgUser = false) {
  let px;

  if (epsgUser) {
    const rotateX = 0;
    const rotateY = 0;

    const sizePixelX = ((bbox[2] - bbox[0]) / size[0]);
    const sizePixelY = ((bbox[3] - bbox[1]) / size[1]) * -1;
    const upperLeftX = bbox[0] + (sizePixelX / 2);
    const upperLeftY = bbox[3] + (sizePixelY / 2);

    px = sizePixelX.toString().concat('\n', rotateX.toString(), '\n', rotateY.toString(), '\n', sizePixelY.toString(), '\n', upperLeftX.toString(), '\n', upperLeftY.toString());
  } else {
    const Px = (((bbox[2] - bbox[0]) / size[0]) * (72 / dpi)).toString();
    const GiroA = (0).toString();
    const GiroB = (0).toString();
    const Py = (-((bbox[3] - bbox[1]) / size[1]) * (72 / dpi)).toString();
    const Cx = (bbox[0] + (Px / 2)).toString();
    const Cy = (bbox[3] + (Py / 2)).toString();

    px = Px.concat('\n', GiroA, '\n', GiroB, '\n', Py, '\n', Cx, '\n', Cy);
  }

  return px;
}

// Create jsZip file
export function createZipFile(files, type, titulo) {
  const zip = new JsZip();

  files.forEach(({ name, data, base64 }) => {
    zip.file(name, data, { base64 });
  });

  zip.generateAsync({ type: 'blob' }).then((content) => {
    // see FileSaver.js
    saveAs(content, titulo.concat(type));
  });
}

// Generate title
export function generateTitle(titulo = '') {
  if (titulo === '' || titulo === getValue('notitle')) {
    const f = new Date();
    return 'mapa_'.concat(f.getFullYear(), '-', f.getMonth() + 1, '-', f.getDay() + 1, '_', f.getHours(), f.getMinutes(), f.getSeconds());
  }
  return titulo;
}

// Get base64 image
export function getBase64Image(imgUrl, format) {
  const formatType = format || 'jpeg';
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossorigin', 'anonymous');
    img.src = imgUrl;
    img.onload = function can() {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL(`image/${formatType}`, 1.0);
      resolve(dataURL.replace(REGEX_FORMAT_IMAGE, ''));
    };

    img.onerror = function rej() {
      Promise.reject(new Error(getValue('exception.loaderror')));
      IDEE.dialog.error(getValue('exception.imageError'));
    };
  });
}

// Get base64 image client
export function formatImageBase64(base64) {
  return base64.replace(REGEX_FORMAT_IMAGE, '');
}

// Create loading spinner
export function createLoadingSpinner() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '50');
  svg.setAttribute('height', '50');
  svg.setAttribute('viewBox', '0 0 50 50');
  svg.setAttribute('class', 'loading-spinner');

  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '25');
  circle.setAttribute('cy', '25');
  circle.setAttribute('r', '20');
  circle.setAttribute('stroke', '#fff');
  circle.setAttribute('stroke-width', '5');
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke-dasharray', '31.4 31.4');

  svg.appendChild(circle);

  const container = document.createElement('div');
  container.setAttribute('class', 'loading-overlay');
  container.appendChild(svg);
  document.body.appendChild(container);

  return container;
}

// Services SIG Geoprint List
export const LIST_SERVICES = `
    <section style='max-height: 56vh; overflow-y: auto;'>
      <h1 style="text-align: center;">${getValue('available_sources')}</h1>
      <p><b>${getValue('layer_raster')}</b></p>
      <ul>
        <li><b>WMS: </b>${getValue('layer_wms')}</li>
        <li><b>WMTS: </b>${getValue('layer_wmts')}</li>
        <li><b>TMS: </b>${getValue('layer_tms')}</li>
        <li><b>XYZ: </b>${getValue('layer_xyz')}</li>
      </ul>
      <p><b>${getValue('layer_vector')}</b></p>
      <ul>
        <li><b>GeoJSON: </b> ${getValue('layer_geojson')}</li>
        <li><b>WFS: </b> ${getValue('layer_wfs')} </li>
        <li><b>KML: </b> ${getValue('layer_kml')}</li>
        <li><b>OGCAPIFeatures: </b> ${getValue('layer_OGCAPIFeatures')}</li>
      </ul>
      <p><b>Más información:</b> <a href="https://github.com/Desarrollos-IDEE/API-IDEE/wiki/2.1.-Capas">https://github.com/Desarrollos-IDEE/API-IDEE/wiki/2.1.-Capas</a></p>
    </section>
`;
