const { resolve } = require('path')
const url = require('url')
const fs = require('fs-extra')
const _cliProgress = require('cli-progress')
const fetch = require('node-fetch')
const _ = require('lodash')
const AbortContoller = require('abort-controller')

const signalController = new AbortContoller()

/**
 * Will be the progress bar instance, if enabled
 *
 * @type {Object}
 */
let progressBar = {}

/**
 * Titles of movies that have been updated. This is in the
 * global scope so if we need to abort the connection to the API server, we can
 * still continue without skipping a movie.
 *
 * @type {Array} Array of Objects
 */
let UPDATED_MOVIES = []

/**
 * Titles of movies that were not found on the omdb API server. This is in the
 * global scope so if we need to abort the connection to the API server, we can
 * still continue without skipping a movie.
 *
 * @type {Array} Array of Strings
 */
let NOT_FOUND_MOVIES = []

module.exports = async (userOptions) => {
  /**
   * Default user options
   *
   * @type {Object}
   */
  const _defaults = {
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
     destination: '%source%-metadata.json',

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
     notfound: '%source%-notfound.json',

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
     timeout: 30000,

     /**
      * What String to use to split {source} into an Arraym, if it is a string
      * and not a JSON file path or an Array.
      *
      * @default '\n' (newline)
      * @type    {String}
      */
     splitter: '\n',

     /**
      * Method to call everytime metadata is either successfully fetched or
      * the movie is not found. Takes an Object with properties:
      * {
      *   movie: fetchedOrNotFoundMovie // Object|String,
      *   status: true|false            // Boolean
      * }
      */
     onUpdate() {},

     /**
      * Name of the Object key representing the {movie title}
      *
      * @type {String}
      */
     titleKey: 'title',

     /**
      * Name of the Object key representing the {release year}
      *
      * @type {String}
      */
     yearKey: 'year'
   }

  /**
   * Merge the default options and the users' options
   *
   * @type {Object}
   */
  const options = _.defaults(userOptions, _defaults)

  // Check if {source} option is missing
  if(typeof options.source === 'undefined') {
    throw new Error('\x1b[31m[MISSING PARAMETER:\x1b[0m The "source" parameter is required!]')
  }
  // End - Check if {source} option is missing

  // Check if {key} option is missing
  if(typeof options.key === 'undefined') {
    throw new Error('\x1b[31m[MISSING PARAMETER:\x1b[0m The "key" parameter is required!]')
  }
  // End - Check if {key} option is missing

  // Check if {destination} and {notfound} parameters are not set to false (CLI)
  if(options.destination && options.notfound) {
    /**
     * Set {destination} to either {source} (if {overwite} is enabled) or
     * {destination} with the placeholder replaced by {source} with its extension
     *
     * @type {String}
     */
    options.destination = options.overwrite
      ? options.source
        : options.destination.replace('%source%', options.source.replace(/\.json$/, ''))

    /**
     * Set {notfound} to the {notfound} path with the placeholder replaced with the source filename
     * {destination} with the placeholder replaced by {source} with its extension
     *
     * @type {String}
     */
    options.notfound = options.notfound.replace('%source%', options.source.replace(/\.json$/, ''))
  }
  // End - Check if {destination} and {notfound} parameters are not set to false (CLI)

  // Check if {progress} or {verbose} parameter is enabled
  if(options.progress || options.verbose) {
    options.progress = !options.verbose
  }
  // End - Check if {progress} or {verbose} parameter is enabled

  // Check if {progress} parameter is enabled and {verbose} is disabled
  if(options.progress && !options.verbose) {
    progressBar = new _cliProgress.Bar({ hideCursor: true }, _cliProgress.Presets.shades_classic)
  }
  // End - Check if {progress} parameter is enabled and {verbose} is disabled

  // Check if {source} parameter is a JSON path
  if(typeof options.source === 'string' && /\.json$/i.test(options.source)) {
    // End - Check if {source} parameter is a JSON path
      /**
       * Resolve the {source} path
       *
       * @type {String}
       */
      options.source = resolve(options.source)
  }

  // Check if {destination} parameter is a JSON path
  if(typeof options.destination === 'string' && /\.json$/i.test(options.destination)) {
    /**
     * Resolve the {destination} path
     *
     * @type {String}
     */
    options.destination = resolve(options.source, '../', options.destination)
  }
  // End - Check if {destination} parameter is a JSON path

  // Check if {notfound} parameter is a JSON path
  if(typeof options.notfound === 'string' && /\.json$/i.test(options.notfound)) {
    /**
     * Resolve the {notfound} path
     *
     * @type {String}
     */
    options.notfound = resolve(options.source, '../', options.notfound)
  }
  // End - Check if {notfound} parameter is a JSON path

  /**
   *****************************************************************************
   ********************************* MAIN LOGIC ********************************
   *****************************************************************************
   */

   /**
    * Set {movieTitles} to the {source} parameter.
    * (changed later if it's a JSON path instead of an Array)
    *
    * @type {Array|Path}
    */
   let movieTitles = options.source

  // Check if {source} is a JSON path
  if(typeof options.source === 'string' && /\.json$/i.test(options.source)) {
    /**
     * Get the movie titles from the {source} JSON file
     *
     * @type {Array}
     */
    movieTitles = await fs.readJson(options.source).catch(err => console.error(err))
  } else if (typeof movieTitles === 'string') {
    // If {source} is not a JSON file, split it into an Array based on the {splitter} parameter
    movieTitles = movieTitles.split(options.splitter)
  }
  // End - Check if {source} is a JSON path


  // Check if the {progress} parameter is enabled
  if(options.progress && !options.verbose) {
    // Start the progress bar, starting at 0
    progressBar.start(movieTitles.length, 0)
  } else if(options.verbose && !options.progress) {
    // Display a message to the user stating that we have started fetching metadata
    console.log('---------------------------------------------------------------')
    console.log(`--------------- FETCHING METADATA FOR ${movieTitles.length} MOVIES ---------------`)
    console.log('---------------------------------------------------------------')
  }
  // End - Check if the {progress} parameter is enabled

  /**
   * Set the metadata for each movie in the {movieTitles} Array
   *
   * {Array} updatedMovies  = Movies that were successfully tagged with their metadata
   * {Array} notFoundMovies = Movie titles that were not found on the omdb API server
   *
   * @type {Array}
   */
  const { updatedMovies, notFoundMovies } = await setMetadata(options, movieTitles)

  // Check if {destination} parameter is a JSON path
  if((typeof options.destination === 'string' && /\.json$/i.test(options.destination)
    &&(typeof options.notfound === 'string' && /\.json$/i.test(options.notfound)))) {
    /**
     * Save the movie metadata to the {destination} parameter
     *
     *
     * @type {Object}
     */
     await saveUpdatedMovies(options, { updatedMovies, notFoundMovies })
  }
  // End - Check if {destination} parameter is a JSON path

   // Check if the {progress} parameter is enabled
   if(options.progress && !options.verbose) {
     /**
      * Stop / finish the progress bar once all the metadata has been fetched and saved
      */
     progressBar.stop()
   }
   // End - Check if the {progress} parameter is enabled

  // Check if {verbose} or {progress} parameter is enabled
  if(options.verbose || options.progress) {
    console.log('\n---------------------------------------------------------------')
    console.log(`\x1b[32mSuccessfully fetched metadata for ${updatedMovies.length} of ${movieTitles.length} movies\x1b[0m`)

    // Check if any movies couldn't be found
    if(notFoundMovies.length > 0) {
      console.log(`\x1b[31m${notFoundMovies.length} movies were not found on the server\x1b[0m`)
    }
    // End - Check if any movies couldn't be found
    console.log('---------------------------------------------------------------\n')
  }
  // End - Check if {verbose} or {progress} parameter is enabled

  // @return {Object} Return the {updatedMovies}, and {notFoundMovies} Arrays/Dictionaries
  return { fetchedMetadata: updatedMovies, notFoundMovies }
}
// End - {module.exports} Function

/**
 * Set the metadata for each item in the {movieTitles} Array
 *
 * @param  {Object}   {options}     User options
 * @param  {Array}    {movieTitles} Movie titles to search for
 *
 * @return {Object}      Array of Objects with the fetched metadata
 */
async function setMetadata(options, movieTitles) {
  /**
   * Total amount of movies to search for
   *
   * @type {Number}
   */
  const totalMoviesCount = movieTitles.length

  /**
   * Will contain the fetched movie metadata
   *
   * @type {Object}
   */
  let fetchedMetadata = null

  /**
   * Run the {_setMetadata} function internally so we can recall it later (when aborting a connection)
   *
   * @param       {Object} options     User options
   * @param       {Array}  movieTitles Movie titles to fetch metadata for
   */
  async function _setMetadata(options, movieTitles) {
    /**
     * Set to only movies that have not already been looked up / updated with metadata
     *
     * @type {Array}
     */
    let remainingMovies = movieTitles.filter(currentMovie => {
      const year = typeof currentMovie[options.yearKey] !== 'undefined' ? currentMovie[options.yearKey] : false
      const title = typeof currentMovie[options.titleKey] !== 'undefined' ? currentMovie[options.titleKey] : currentMovie

      // Check if {movieTitles} contains the title + year
      if(year) {
        // Check if the title+year is already in the {UPDATED_MOVIES} dictionary (Array of Objects)
        if (UPDATED_MOVIES.filter(data => data.Title.toLowerCase() !== title.toLowerCase() && parseInt(data.Year) !== parseInt(year)).length === 0) {
          return true
        }

        // Check if the title+year is already in the {NOT_FOUND_MOVIES} dictionary (Array of Objects)
        if (NOT_FOUND_MOVIES.filter(data => data.Title.toLowerCase() !== title.toLowerCase() && parseInt(data.Year) !== parseInt(year)).length === 0) {
          return true
        }
      } else {
        // Otherwise, just check if the movie title is already in the {UPDATED_MOVIES} or {NOT_FOUND_MOVIES} Array
        return UPDATED_MOVIES.map(data => data.Title).indexOf(currentMovie) === -1 && NOT_FOUND_MOVIES.indexOf(currentMovie) === -1
      }
      // End - Check if {movieTitles} contains the title + year

      return false
    })

    // Loop through each of the {remainingMovies}
    for(let i=0;i<remainingMovies.length;i++) {

      /**
       * The current movie title in the loop
       *
       * @type {String}
       */
      let currentMovie = remainingMovies[i]
      let title = currentMovie
      let year = ''

      // Check if {title} contains the title+year of the movie (as an Object)
      if(typeof currentMovie !== 'string') {
        title = currentMovie[options.titleKey]
        year = typeof currentMovie[options.yearKey] !== 'undefined' ? currentMovie[options.yearKey] : false
      }
      // End - Check if {title} contains the title+year of the movie (as an Object)

      /**
       * Set a request timeout, if the {fetchMetadata} Function takes more than 90 seconds,
       * then abort the connection and run this function again
       *
       * @type {Timeout Object}
       */
      let abortTimeout = setTimeout(() => {
        signalController.abort()
        _setMetadata(options,movieTitles)
      }, options.timeout)

      /**
       * Fetch the metadata the current movie in the loop
       *
       * @type {Object}
       */
      fetchedMetadata = await fetchMetadata(options.key, title, year)

      /**
       * Clear the timeout after the metadata has been fetched and the request didn't timeout (resolved)
       */
      clearTimeout(abortTimeout)

      // Check if the request was aborted
      if(fetchedMetadata === 'AbortError') {
        // Break out of the loop, allowing the Function to restart
        break
      }
      // End - Check if the request was aborted

      // Ensure that there was no errors when retrieving the metadata (returned true)
      if(fetchedMetadata !== 'Not Found') {
        // Add the updated movie Object to the {UPDATED_MOVIES} Array
        UPDATED_MOVIES.push(fetchedMetadata)

        // Check if {verbose} parameter is enabled
        if(options.verbose && !options.progress) {
          console.log(`${(UPDATED_MOVIES.length + NOT_FOUND_MOVIES.length).toString().padStart(totalMoviesCount.toString().length, '0')}/${totalMoviesCount} - \x1b[32mUpdated:\x1b[0m\t"${fetchedMetadata.Title}"`)
        }
        // End - Check if {verbose} parameter is enabled

        /**
         * Run the {onUpdate} Method parameter, with the metadata just fetched, and
         * whether or not the metadata was found (true) or not found (false)
         *
         * @type {Object}
         */
        options.onUpdate({ movie: fetchedMetadata, found: true })
      }
      else if(fetchedMetadata === 'Not Found') {

        // Check if year was provided
        if(year) {
          // Add the not found movie title+year to the {NOT_FOUND_MOVIES} Array
          NOT_FOUND_MOVIES.push({ title, year })
        } else {
          // Add the not found movie title to the {NOT_FOUND_MOVIES} Array
          NOT_FOUND_MOVIES.push(title)
        }
        // End - Check if year was provided

        // Check if {verbose} parameter is enabled
        if(options.verbose && !options.progress) {
          console.log(`${(UPDATED_MOVIES.length + NOT_FOUND_MOVIES.length).toString().padStart(totalMoviesCount.toString().length, '0')}/${totalMoviesCount} - \x1b[31mNot Found:\x1b[0m\t"${title}"`)
        }
        // End - Check if {verbose} parameter is enabled

        /**
         * Run the {onUpdate} Method parameter, with the metadata just fetched, and
         * whether or not the metadata was found (true) or not found (false)
         *
         * @type {Object}
         */
        options.onUpdate({ movie: title, found: false })
      }
      // End - Ensure that there was no errors when retrieving the metadata

      // Check if {progress} parameter is enabled
      if(options.progress && !options.verbose) {
        // Increment the progress bar by one (1) if enabled
        progressBar.increment()
      }
      // End - Check if {progress} parameter is enabled
    }
    // End - Loop through each of the {remainingMovies}

    // Check if the metadata fetch was aborted
    if(fetchedMetadata === 'AbortError' || fetchedMetadata === null) {
      await _setMetadata(options,movieTitles)
    }
    // End - Check if the metadata fetch was aborted
  }

  // Check if the metadata fetch was aborted
  if(fetchedMetadata === 'AbortError' || fetchedMetadata === null) {
    await _setMetadata(options,movieTitles)
  }
  // End - Check if the metadata fetch was aborted

  // Check if the metadata fetch was aborted
  if(fetchedMetadata !== 'AbortError' && fetchedMetadata !== null) {
    return {
      updatedMovies: UPDATED_MOVIES,
      notFoundMovies: NOT_FOUND_MOVIES
    }
  }
  // End - Check if the metadata fetch was aborted
}
// End - {setMetadata} Function

/**
 * Fetch metadata for the specified movie title
 *
 * @param  {String}   {apiKey}     Developers API key for omdb API
 * @param  {String}   {movieTitle} Movie title to search for
 *
 * @return {Object}      Metadata for the specified movie
 */
async function fetchMetadata(apiKey, movieTitle, movieYear) {
  movieYear = (typeof movieYear !== 'undefined' && movieYear) ? `&y=${movieYear}` : ''

  // @return {Object} Metadata Object for the specified movie
  return fetch(new URL(`http://www.omdbapi.com/?t=${encodeURIComponent(movieTitle)}&type=movie&apikey=${apiKey}${movieYear}`),
    { signal: signalController.signal })
    .then(request => request.json())
    .then(jsonData => {
      // Ensure there were no errors when retrieving the metadata
      if(jsonData.Response === 'True') {
        // Return JSON data if there were no errors
        return jsonData
      } else {
        // Otherwise, return 'Not Found' if the movie was not found
        return 'Not Found'
      }
      // End - Ensure there were no errors when retrieving the metadata
    },
    err => {
      return err.name
    })
    .catch(err => err)
}
// End - {fetchMetadata} Function

/**
 * Save the metadata to the {destination} JSON file,
 * and the not found movies to the {notFound} JSON file.
 *
 * @param  {Object}   {options}       User options
 * @param  {Object}   {movieMetadata} { updatedMovies, notFoundMovies } Array of Objects, and Array of Strings
 */
async function saveUpdatedMovies(options, movieMetadata) {

  /**
   * Write the update movie metadata to the {destination} JSON file path
   */
  fs.writeJson(options.destination, movieMetadata.updatedMovies, {spaces: '\t'})

  // Check if any movies were not found
  if(movieMetadata.notFoundMovies.length > 0) {
    /**
     * Write the not found movies to the {notfound} JSON file path
     */
    fs.writeJson(options.notfound, movieMetadata.notFoundMovies, {spaces: '\t'})
  }
  // End - Check if any movies were not found
}
// End - {saveUpdatedMovies} Function
