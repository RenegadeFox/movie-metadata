const { getMetadata } = require('../src/')


/**
 * Available Options (with their defaults)
 */
const options = {
  /**
   * Where to save the JSON file, with the fetched metadata, to.
   * "%source%" is a placeholder for the source file.
   *
   * If set to false the fetched metadata will be returned as a
   * Promise Object.
   * ===========================================================================
   * @default '%source%-metadata.json'
   * @type    {String|Boolean}
   */
  destination: false,

  /**
   * Path where to save the movies that are not found on the omdb API server
   * "%source%" is a placeholder for the source file (minus the .json extension)
   *
   * If set to false the not found movies will be returned as a
   * Promise Array of movie titles.
   * ===========================================================================
   * @default '%source%-notfound.json'
   * @type    {String|Boolean}
   */
  notfound: false,

  /**
   * Whether or not to show each movie as its metadata is being fetched.
   * Enabling this will disable the {progress} option.
   *
   * @default false
   * @type    {Boolean}
   */
  verbose: false,

  /**
   * Whether or not to show a progress bar while the movie metadata
   * is being fetched. Enabling this will disable the {verbose} option.
   *
   * @default true
   * @type    {Boolean}
   */
  progress: true,

  /**
   * Whether or not to overwrite the {source} JSON file with the updated
   * JSON metadata.
   *
   * If the "destination" or "notfound" option is set to false, this is
   * automatically disabled, and the metadata is returned as a Promise instead.
   *
   * @default false
   * @type    {Boolean}
   */
  overwrite: false,

  /**
   * Amount of time to wait before aborting the request for metadata from the
   * API server. Will automatically continue, and the movie metadata will
   * not be skipped.
   *
   * @default 120000 (2 minutes)
   * @type    {Number}
   */
  timeout: 120000
}
getMetadata(options)
  .catch(err => console.error(err))
