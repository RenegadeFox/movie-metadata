const { getMetadata } = require('../src/');


/**
 * Available Options (with their defaults)
 */
const options = {
  dest     : false,
  notfound : false,
  key      : '[YOUR_API_KEY]',
  verbose  : true,
  source   : [
    'Man\'s Chest',
    'Ocean\'s Eight'
  ]
};

getMetadata(options)
  .then(({ fetched, notFound }) => {
    console.log(fetched.map(data => {
      return { title: data.Title, year: data.Year }
    }), notFound);

  })
  .catch(err => console.error(err));
