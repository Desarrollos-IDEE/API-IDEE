import Help from 'facade/help';

M.language.setLang('es');
// M.language.setLang('en');

const map = M.map({
  container: 'mapjs',
  controls: ['scale'],
});
window.map = map;

const mp = new Help({
  position: 'TR', // TR, BR, TL, BL
  initialIndex: 3,
  // tooltip: 'Mi ayuda',
  header: {
    images: [
      'https://www.gravatar.com/avatar/586252adace7084ee98aa8977fe5cc2b?rating=PG&size=128&default=wavatar',
      'https://www.gravatar.com/avatar/75df827b1b67c5f04f1715dd01016735?rating=PG&size=64x64&default=wavatar',
    ],
    // title: 'Título'
    title: {
      es: 'Título definido por el usuario',
      en: 'User Defined Title',
    },
  },
  extendInitialExtraContents: true,
  /* / PRUEBA initialExtraContents 1
  initialExtraContents: {es: [
    { title: 'Índice 1', content: '<div><h2>Título 1</h2><div><p>Contenido 1</p> <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Tyto_alba_close_up.jpg/200px-Tyto_alba_close_up.jpg" width="300" height="400"></div></div>',
      subContents : [
        { title: 'Índice 2', content: '<div><h2>Título 2</h2><div><p>Contenido 2</p></div></div>'},
      ]
    },
    { title: 'Índice 3', content: '<div><h2>Título 3</h2><div><p>Contenido 3</p></div></div>'},
    { title: 'Índice 4', content: '<div><h2>Título 4</h2><div><p>Contenido 4</p></div></div>',
      subContents : [
        { title: 'Índice 5', content: '<div><h2>Título 5</h2><div><p>Contenido 5</p></div></div>',
          subContents : [{ title: 'Índice 6', content: '<div><h2>Título 6</h2><div><p>Contenido 6</p></div></div>',
        subContents : [{ title: 'Índice 6 esp', content: '<div><h2>Título 6 esp</h2><div><p>Contenido 6 esp</p></div></div>' }], },
      ]
        },
      ]
    },
  ], en: [
    { title: 'Index 1', content: '<div><h2>Title 1</h2><div><p>Content 1</p> <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Tyto_alba_close_up.jpg/200px-Tyto_alba_close_up.jpg" width="300" height="400"></div></div>',
      subContents : [
        { title: 'Index 2', content: '<div><h2>Title 2</h2><div><p>Content 2</p></div></div>'},
      ]
    },
    { title: 'Index 3', content: '<div><h2>Title 3</h2><div><p>Content 3</p></div></div>'},
    { title: 'Index 4', content: '<div><h2>Title 4</h2><div><p>Content 4</p></div></div>',
      subContents : [
        { title: 'Index 5', content: '<div><h2>Title 5</h2><div><p>Content 5</p></div></div>',
          subContents : [{ title: 'Index 6', content: '<div><h2>Title 6</h2><div><p>Content 6</p></div></div>',
        subContents : [{ title: 'Index 6 esp', content: '<div><h2>Title 6 esp</h2><div><p>Content 6 esp</p></div></div>' }], },
      ]
        },
      ]
    },
  ]}, // */
  // PRUEBA initialExtraContents 2
  initialExtraContents: [
    {
      title: 'Índice 1',
      content: '<div><h2 style="text-align: center; color: #fff; background-color: #364b5f; padding: 8px 10px;">Título 1</h2><div><p>Contenido 1</p> <img style="margin-left: 20%;" src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Tyto_alba_close_up.jpg/200px-Tyto_alba_close_up.jpg" width="300" height="400"></div></div>',
      subContents: [
        { title: 'Índice 2', content: '<div><h2 style="text-align: center; color: #fff; background-color: #364b5f; padding: 8px 10px;">Título 2</h2><div><p>Contenido 2</p></div></div>' },
      ],
    },
    { title: 'Índice 3', content: '<div><h2 style="text-align: center; color: #fff; background-color: #364b5f; padding: 8px 10px;">Título 3</h2><div><p>Contenido 3</p></div></div>' },
    {
      title: 'Índice 4',
      content: '<div><h2 style="text-align: center; color: #fff; background-color: #364b5f; padding: 8px 10px;">Título 4</h2><div><p>Contenido 4</p></div></div>',
      subContents: [
        {
          title: 'Índice 5',
          content: '<div><h2 style="text-align: center; color: #fff; background-color: #364b5f; padding: 8px 10px;">Título 5</h2><div><p>Contenido 5</p></div></div>',
          subContents: [{
            title: 'Índice 6',
            content: '<div><h2 style="text-align: center; color: #fff; background-color: #364b5f; padding: 8px 10px;">Título 6</h2><div><p>Contenido 6</p></div></div>',
            subContents: [{ title: 'Índice 6 esp', content: '<div><h2 style="text-align: center; color: #fff; background-color: #364b5f; padding: 8px 10px;">Título 6 esp</h2><div><p>Contenido 6 esp</p></div></div>' }],
          },
          ],
        },
      ],
    },
  ], // */
  /* / PRUEBA finalExtraContents 1
  finalExtraContents: { es: [
    { title: 'Índice 7', content: '<div><h2>Título 7</h2><div><p>Contenido 7</p> <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Tyto_alba_close_up.jpg/200px-Tyto_alba_close_up.jpg" width="300" height="400"></div></div>',
      subContents : [
        { title: 'Índice 8', content: '<div><h2>Título 8</h2><div><p>Contenido 8</p></div></div>'},
      ]
    },
    { title: 'Índice 9', content: '<div><h2>Título 9</h2><div><p>Contenido 9</p></div></div>'},
    { title: 'Índice 10', content: '<div><h2>Título 10</h2><div><p>Contenido 10</p></div></div>',
      subContents : [
        { title: 'Índice 11', content: '<div><h2>Título 11</h2><div><p>Contenido 11</p></div></div>',
          subContents : [{ title: 'Índice 12', content: '<div><h2>Título 10</h2><div><p>Contenido 12</p></div></div>' },
      ]
        },
      ]
    },
  ], en: [
    { title: 'Index 7', content: '<div><h2>Title 7</h2><div><p>Content 7</p> <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Tyto_alba_close_up.jpg/200px-Tyto_alba_close_up.jpg" width="300" height="400"></div></div>',
      subContents : [
        { title: 'Index 8', content: '<div><h2>Title 8</h2><div><p>Content 8</p></div></div>'},
      ]
    },
    { title: 'Index 9', content: '<div><h2>Title 9</h2><div><p>Content 9</p></div></div>'},
    { title: 'Index 10', content: '<div><h2>Title 10</h2><div><p>Content 10</p></div></div>',
      subContents : [
        { title: 'Index 11', content: '<div><h2>Title 11</h2><div><p>Content 11</p></div></div>',
          subContents : [{ title: 'Index 12', content: '<div><h2>Title 10</h2><div><p>Content 12</p></div></div>' },
      ]
        },
      ]
    },
  ]}, // */
  // PRUEBA finalExtraContents 2
  finalExtraContents: [
    {
      title: 'Índice 7',
      content: '<div><h2 style="text-align: center; color: #fff; background-color: #364b5f; padding: 8px 10px;">Título 7</h2><div><p>Contenido 7</p> <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Tyto_alba_close_up.jpg/200px-Tyto_alba_close_up.jpg" width="300" height="400"></div></div>',
      subContents: [
        { title: 'Índice 8', content: '<div><h2 style="text-align: center; color: #fff; background-color: #364b5f; padding: 8px 10px;">Título 8</h2><div><p>Contenido 8</p></div></div>' },
      ],
    },
    { title: 'Índice 9', content: '<div><h2 style="text-align: center; color: #fff; background-color: #364b5f; padding: 8px 10px;">Título 9</h2><div><p>Contenido 9</p></div></div>' },
    {
      title: 'Índice 10',
      content: '<div><h2 style="text-align: center; color: #fff; background-color: #364b5f; padding: 8px 10px;">Título 10</h2><div><p>Contenido 10</p></div></div>',
      subContents: [
        {
          title: 'Índice 11',
          content: '<div><h2 style="text-align: center; color: #fff; background-color: #364b5f; padding: 8px 10px;">Título 11</h2><div><p>Contenido 11</p></div></div>',
          subContents: [{ title: 'Índice 12', content: '<div><h2 style="text-align: center; color: #fff; background-color: #364b5f; padding: 8px 10px;">Título 10</h2><div><p>Contenido 12</p></div></div>' },
          ],
        },
      ],
    },
  ], // */
});

map.addPlugin(mp);
window.mp = mp;
