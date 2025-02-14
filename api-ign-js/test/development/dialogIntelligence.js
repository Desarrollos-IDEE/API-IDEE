import { map as Mmap } from 'M/mapea';
import { info, error, success, show } from 'M/dialog';


const mapjs = Mmap({
  container: 'map',
  controls: ['scale*1'],
  center: [-391232.32792904036, 4915993.4141376745],
  zoom: 12
});
window.mapjs = mapjs;

// IMAGES

// info('Texto http://localhost:8080/test/development/ficheros/imagenes/png.png* Texto <img width="30px" height="30px" src="http://localhost:8080/test/development/ficheros/imagenes/gif.gif"/>', 'Título', 1, {
//   intelligence: {
//     activate: true,
//     sizes: {
//       images: ['20px', '20px'],
//       documents: ['50px', '50px'],
//       videos: ['80px', '80px'],
//       audios: ['200px', '20px'],
//     }
//   }
// });

// error('Texto http://localhost:8080/test/development/ficheros/imagenes/png.png* Texto <img width="30px" height="30px" src="http://localhost:8080/test/development/ficheros/imagenes/gif.gif"/>', 'Título', 1, {
//   intelligence: true
// });

// success('Texto http://localhost:8080/test/development/ficheros/imagenes/png.png* Texto <img width="30px" height="30px" src="http://localhost:8080/test/development/ficheros/imagenes/gif.gif"/>', 'Título', 1, {
//   intelligence: true
// });

// show('Texto http://localhost:8080/test/development/ficheros/imagenes/png.png* Texto <img width="30px" height="30px" src="http://localhost:8080/test/development/ficheros/imagenes/gif.gif"/>', null, 'Título', 1, {
//   intelligence: true
// });


// DOCUMENTS

// info('Texto http://localhost:8080/test/development/ficheros/documentos/pdf.pdf* texto <iframe src="http://localhost:8080/test/development/ficheros/documentos/pdf.pdf"></iframe>', 'Título', 1, {
//   intelligence: true
// });

// error('Texto http://localhost:8080/test/development/ficheros/documentos/pdf.pdf* texto <iframe src="http://localhost:8080/test/development/ficheros/documentos/pdf.pdf"></iframe>', 'Título', 1, {
// intelligence: true
// });

// success('Texto http://localhost:8080/test/development/ficheros/documentos/pdf.pdf* texto <iframe src="http://localhost:8080/test/development/ficheros/documentos/pdf.pdf"></iframe>', 'Título', 1, {
//   intelligence: true
// });

// show('Texto http://localhost:8080/test/development/ficheros/documentos/pdf.pdf* texto <iframe src="http://localhost:8080/test/development/ficheros/documentos/pdf.pdf"></iframe>', null, 'Título', 1, {
//   intelligence: true
// });


// VIDEOS

// info('Texto http://localhost:8080/test/development/ficheros/videos/mp4.mp4* texto <video controls><source src="http://localhost:8080/test/development/ficheros/videos/mp4.mp4"></video>', 'Título', 1, {
//   intelligence: true
// });

// error('Texto http://localhost:8080/test/development/ficheros/videos/mp4.mp4* texto <video controls><source src="http://localhost:8080/test/development/ficheros/videos/mp4.mp4"></video>', 'Título', 1, {
//   intelligence: true
// });

// success('Texto http://localhost:8080/test/development/ficheros/videos/mp4.mp4* texto <video controls><source src="http://localhost:8080/test/development/ficheros/videos/mp4.mp4"></video>', 'Título', 1, {
//   intelligence: true
// });

// show('Texto http://localhost:8080/test/development/ficheros/videos/mp4.mp4* texto <video controls><source src="http://localhost:8080/test/development/ficheros/videos/mp4.mp4"></video>', null, 'Título', 1, {
//   intelligence: true
// });


// AUDIOS

// info('Texto http://localhost:8080/test/development/ficheros/audios/wav.wav* texto <audio controls><source src="http://localhost:8080/test/development/ficheros/audios/wav.wav"></audio>', 'Título', 1, {
//   intelligence: true
// });

// error('Texto http://localhost:8080/test/development/ficheros/audios/wav.wav* texto <audio controls><source src="http://localhost:8080/test/development/ficheros/audios/wav.wav"></audio>', 'Título', 1, {
//   intelligence: true
// });

// success('Texto http://localhost:8080/test/development/ficheros/audios/wav.wav* texto <audio controls><source src="http://localhost:8080/test/development/ficheros/audios/wav.wav"></audio>', 'Título', 1, {
//   intelligence: true
// });

// show('Texto http://localhost:8080/test/development/ficheros/audios/wav.wav* texto <audio controls><source src="http://localhost:8080/test/development/ficheros/audios/wav.wav"></audio>', null, 'Título', 1, {
//   intelligence: true
// });


// ENLACES

// info('Texto https://www.google.es texto <a href="https://centrodedescargas.cnig.es/CentroDescargas/index.jsp">enlace</a> más texto', 'Título', 1, {
//   intelligence: true
// });

// error( 'Texto https://www.google.es texto <a href="https://centrodedescargas.cnig.es/CentroDescargas/index.jsp">enlace</a> más texto', 'Título', 1, {
//   intelligence: true
// });

// success('Texto https://www.google.es texto <a href="https://centrodedescargas.cnig.es/CentroDescargas/index.jsp">enlace</a> más texto', 'Título', 1, {
//   intelligence: true
// });

// show( 'Texto https://www.google.es texto <a href="https://centrodedescargas.cnig.es/CentroDescargas/index.jsp">enlace</a> más texto', null, 'Título', 1, {
//   intelligence: true
// });


// COMBINADO

// success('Texto http://localhost:8080/test/development/ficheros/documentos/pdf.pdf Texto http://localhost:8080/test/development/ficheros/audios/wav.wav texto http://localhost:8080/test/development/ficheros/videos/mp4.mp4 texto http://localhost:8080/test/development/ficheros/imagenes/png.png', 'Título ', 1, {
//   intelligence: {
//     activate: true,
//     sizes: {
//       images: ['20px', '20px'],
//       documents: ['50px', '50px'],
//       videos: ['80px', '80px'],
//       audios: ['200px', '20px'],
//     }
//   },
// });
