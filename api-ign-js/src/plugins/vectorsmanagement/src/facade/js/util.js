// TODO Eliminar linea eslint cuando se añada otra utils.
// eslint-disable-next-line import/prefer-default-export
export const changeStyleDialog = () => {
  document.querySelectorAll('div.m-mapea-container div.m-dialog div.m-title').forEach((t) => {
    const title = t;
    title.style.backgroundColor = '#71a7d3';
  });

  document.querySelector('div.m-mapea-container div.m-dialog div.m-title').style.backgroundColor = '#71a7d3';

  const button = document.querySelector('div.m-dialog.info div.m-button > button');
  button.style.backgroundColor = '#71a7d3';
};
