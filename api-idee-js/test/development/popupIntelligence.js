import { map as Mmap } from 'M/mapea';
import Popup from 'M/Popup';

const mapjs = Mmap({
  container: 'map',
  controls: ['scale*1'],
  center: [-391232.32792904036, 4915993.4141376745],
  zoom: 12
});
window.mapjs = mapjs;

// const featureTabOpts = {
//   'icon': 'g-cartografia-pin',
//   'title': 'Título',
// intelligence: {
//   activate: true,
//   sizes: {
//     images: ['20px', '20px'],
//     documents: ['50px', '50px'],
//     videos: ['100px', '100px'],
//     audios: ['200px', '20px'],
//   }
// },
// intelligence: true,
// IMAGES
// 'content': 'http://localhost:8080/test/development/ficheros/imagenes/png.png'
// 'content': 'Texto http://localhost:8080/test/development/ficheros/imagenes/png.png texto'
// 'content': 'Texto http://localhost:8080/test/development/ficheros/imagenes/png.png, texto'
// 'content': 'Texto http://localhost:8080/test/development/ficheros/imagenes/png.png. Texto'
// 'content': 'Texto http://localhost:8080/test/development/ficheros/imagenes/png.png* Texto'
// 'content': 'Texto http://localhost:8080/test/development/ficheros/imagenes/png.png* Texto <img src="http://localhost:8080/test/development/ficheros/imagenes/jpg.jpg"/>'
// DOCUMENTS
// 'content': 'http://localhost:8080/test/development/ficheros/documentos/pdf.pdf'
// 'content': 'Texto http://localhost:8080/test/development/ficheros/documentos/pdf.pdf texto'
// 'content': 'Texto http://localhost:8080/test/development/ficheros/documentos/pdf.pdf, texto'
// 'content': 'Texto http://localhost:8080/test/development/ficheros/documentos/pdf.pdf. texto'
// 'content': 'Texto http://localhost:8080/test/development/ficheros/documentos/pdf.pdf* texto'
// 'content': 'Texto http://localhost:8080/test/development/ficheros/documentos/pdf.pdf* texto <iframe src="http://localhost:8080/test/development/ficheros/documentos/pdf.pdf"></iframe>'
// VIDEOS
// 'content': 'http://localhost:8080/test/development/ficheros/videos/mp4.mp4'
// 'content': 'Texto http://localhost:8080/test/development/ficheros/videos/mp4.mp4 texto'
// 'content': 'Texto http://localhost:8080/test/development/ficheros/videos/mp4.mp4, texto'
// 'content': 'Texto http://localhost:8080/test/development/ficheros/videos/mp4.mp4. texto'
// 'content': 'Texto http://localhost:8080/test/development/ficheros/videos/mp4.mp4* texto'
// AUDIOS
// 'content': 'http://localhost:8080/test/development/ficheros/audios/wav.wav'
// 'content': 'Texto http://localhost:8080/test/development/ficheros/audios/wav.wav texto'
// 'content': 'Texto http://localhost:8080/test/development/ficheros/audios/wav.wav, texto'
// 'content': 'Texto http://localhost:8080/test/development/ficheros/audios/wav.wav* texto'
// 'content': 'Texto http://localhost:8080/test/development/ficheros/audios/wav.wav. texto',
// 'content': 'Texto http://localhost:8080/test/development/ficheros/audios/wav.wav* texto <audio controls><source src="http://localhost:8080/test/development/ficheros/audios/wav.wav"></audio>'
// ENLACES
// 'content': 'https://www.google.es'
// 'content': 'Texto https://www.google.es texto <a href="https://centrodedescargas.cnig.es/CentroDescargas/index.jsp">enlace</a> más texto'
// COMBINAR
// 'content': 'Aquí tines un enlace https://www.google.es un audio http://localhost:8080/test/development/ficheros/audios/wav.wav un video http://localhost:8080/test/development/ficheros/videos/mp4.mp4 una imagen http://localhost:8080/test/development/ficheros/imagenes/png.png y un documento http://localhost:8080/test/development/ficheros/documentos/pdf.pdf'
// };

// const featureTabOpts2 = {
//   'icon': 'g-cartografia-pin',
//   'title': 'Título',
//   intelligence: {
//     activate: true,
//     sizes: {
//       images: ['20px', '20px'],
//       documents: ['50px', '50px'],
//       videos: ['100px', '100px'],
//       audios: ['200px', '20px'],
//     }
//   },
//   'content': 'Texto http://localhost:8080/test/development/ficheros/videos/mp4.mp4 texto'
// };

const featureTabOpts3 = {
  'icon': 'g-cartografia-pin',
  'title': 'Título',
  // intelligence: {
  //   activate: false,
  //   sizes: {
  //     images: ['20px', '20px'],
  //     documents: ['50px', '50px'],
  //     videos: ['100px', '100px'],
  //     audios: ['200px', '20px'],
  //   }
  // },
  'content': `kajklsajkldjaskjddsfsdfñlskdflsdlfkñlskdñlkfdñlskfsñlkdlkdsklsdklkk 
  https://ethic.es/wp-content/uploads/2023/03/imagen-1280x768.jpg https://www.google.es`
};

const popup = new Popup();
// popup.addTab(featureTabOpts);
// popup.addTab(featureTabOpts2);
popup.addTab(featureTabOpts3);
mapjs.addPopup(popup, [-391232.32792904036, 4915993.4141376745]);
