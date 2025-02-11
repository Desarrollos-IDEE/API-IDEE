const { map } = require('IDEE/api-idee');

const createMap = (mapArgs) => {
  return new Promise((resolve) => {
    const mapjs = map(mapArgs);
    setTimeout(() => {
      resolve(mapjs);
    }, 2000);
  });
};

module.exports = createMap;
