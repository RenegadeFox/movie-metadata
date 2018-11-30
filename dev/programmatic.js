const { getMetadata } = require('../src/');


/**
 * Available Options (with their defaults)
 */
const options = {
  key      : '[YOUR_API_KEY]',
  source   : '/Users/martincox/Desktop/movie-databases/moviesFrom2018-Object.json'
};

getMetadata(options).catch(err => console.error(err));
