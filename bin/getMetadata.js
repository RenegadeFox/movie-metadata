const { getMetadata } = require('../src/')
const commandLineArgs = require('command-line-args')

/**
 * Available command-line arguments and options
 *
 * @type {Array}
 */
const options = commandLineArgs([
  // {Boolean} Whether or not to show each movie as it's metadata is being downloaded
  { name: 'verbose', alias: 'v', type: Boolean },
  // {Boolean} Whether or not to show a progress bar while downloading the metadata
  { name: 'progress', alias: 'p', type: Boolean },
  // {String} Path to JSON file containing an Array of movie titles to fetch metadata for
  { name: 'source', alias: 's', type: String },
  // {String} Developers API key for omdb API
  { name: 'key', alias: 'k', type: String },
  // {Boolean} Whether or not to overwrite the {source} JSON file with the updated JSON metadata
  { name: 'overwrite', alias: 'o', type: Boolean },
  // {String} Path where to save the updated movies to
  { name: 'destination', alias: 'd', type: String },
  // {String} Path where to save the movies that are not found on the omdb API server
  { name: 'notfound', alias: 'n', type: String },
  // {String} Path where to save the movies that are not found on the omdb API server
  { name: 'timeout', alias: 't', type: Number }
])

getMetadata(options).catch(err => console.error(err))
