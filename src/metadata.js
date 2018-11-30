const { resolve }    = require('path');
const fs             = require('fs-extra');
const _cliProgress   = require('cli-progress');
const fetch          = require('node-fetch');
const _              = require('lodash');
const AbortContoller = require('abort-controller');

const _errors        = {
  noSource: new Error('\x1b[31m[MISSING PARAMETER:\x1b[0m The "source" parameter is required!]'),
  noKey:    new Error('\x1b[31m[MISSING PARAMETER:\x1b[0m The "key" parameter is required!]')
};
const _signalController = new AbortContoller();
const isJsonPath        = filePath => {
  return (typeof filePath === 'string' && /\.json$/i.test(filePath));
};

let _progressBar    = {};
let _updatedMovies  = [];
let _notFoundMovies = [];

/**
 * Merge the user options with the default options
 *
 * @param  {Object} userOptions User provided options
 *
 * @return {Object}             { options, state }
 */
async function mergeOptions(userOptions) {
  const defaults = {
    dest: '%source%-metadata.json',
    notFound: '%source%-notFound.json',
    verbose: false,
    progress: true,
    overwrite: false,
    timeout: 30000,
    splitter: '\n',
    keys: { title: 'title', year: 'year' },
    onUpdate() {}
  };

  return validateOptions(_.defaults(userOptions, defaults));
};

/**
 * Validate and update the options Object
 *
 * @param  {Object} options Merged options
 *
 * @return {Object}         { options, state }
 */
async function validateOptions (options) {
  // Ensure the {source} and {key} parameters were provided
  if (_.isUndefined(options.source) || _.isUndefined(options.key)) {
    throw !_.isUndefined(options.source) ? _errors.noSource : _errors.noKey;
  };

  const state = {
    isSaveToFile   : options.dest && options.notfound,
    isArraySource  : _.isArray(options.source)
  };

  if (isJsonPath(options.source)) {
    options.source = await fs.readJson(resolve(options.source)).catch(err => console.error(err));
  };

  if (!state.isArraySource && !isJsonPath(options.source)) {
    options.source = options.source.split(options.splitter);
  };

  // Only {progress} OR {verbose} can be enabled (not both)
  options.progress = !options.verbose;

  if (state.isSaveToFile) {
    // Set {destination} to {source} (overwriting {source} file)
    options.dest = options.overwrite ? options.source : options.dest;
  };

  if (options.progress) {
    // Initialize the CLI progress bar
    _progressBar = new _cliProgress.Bar({ hideCursor: true }, _cliProgress.Presets.shades_classic);
  };

  return { options, state };
}

/**
 * Different steps in which data is displayed to the user
 *
 * @type {Object}
 */
const step = {
  init(options) {
    if (options.progress) {
      _progressBar.start(options.source.length, 0);
    } else if (options.verbose) {
      console.log('---------------------------------------------------------------');
      console.log(`--------------- FETCHING METADATA FOR ${options.source.length} MOVIES ---------------`);
      console.log('---------------------------------------------------------------');
    };
  },
  updateFound({ options, movie }) {
    const processedMovies = (_updatedMovies.length + _notFoundMovies.length).toString().padStart(options.source.length.toString().length, '0');

    if (options.progress) {
      // Increment the progress bar by one (1) if enabled
      _progressBar.increment(1);
    } else {
      console.log(`${processedMovies}/${options.source.length} - \t\x1b[32mUpdated:\x1b[0m\t"${movie}"`);
    }
  },
  updateNotFound({ options, movie }) {
    const processedMovies = (_updatedMovies.length + _notFoundMovies.length).toString().padStart(options.source.length.toString().length, '0');

    if (options.progress) {
      // Increment the progress bar by one (1) if enabled
      _progressBar.increment(1);
    } else {
      console.log(`${processedMovies}/${options.source.length} - \t\x1b[31mNot Found:\x1b[0m\t"${movie}"`);
    };
  },
  final(options) {
    if (options.progress) {
      _progressBar.stop();
    };

    // Check if {verbose} or {progress} parameter is enabled
    if (options.verbose || options.progress) {
      console.log('\n');
     if (_updatedMovies.length) {
       console.log(`\x1b[32mFetched metadata for ${_updatedMovies.length} of ${options.source.length} movies\x1b[0m`);
     }

     if (_notFoundMovies.length) {
       console.log(`\x1b[31m${_notFoundMovies.length} movies were not found\x1b[0m\n\n`);
     };
    };
  }
};

function getRemainingMovies (options) {
  let hasYear = false;
  let year    = hasYear;
  return { remainingMovies: options.source.filter(currentMovie => {
    hasYear   = !_.isUndefined(currentMovie[options.keys.year]);

    year                     = hasYear ? currentMovie[options.keys.year]  : false;
    const title              = hasYear ? currentMovie[options.keys.title] : currentMovie;

    const justTitlesFetched  = _updatedMovies.map(data  => _.toLower(data.Title));
    const justTitlesNotFound = _notFoundMovies.map(data => _.toLower(data.title));
    const justYearsFetched   = _updatedMovies.map(data  => data.Year);
    const justYearsNotFound  = _notFoundMovies.map(data => data.year);

    if (hasYear) {
      return (justTitlesFetched.indexOf(_.toLower(title))  === -1 && justYearsFetched.indexOf(year.toString())  === -1)
          && (justTitlesNotFound.indexOf(_.toLower(title)) === -1 && justYearsNotFound.indexOf(year.toString())  === -1);
    } else {
      return justTitlesFetched.indexOf(_.toLower(title))  === -1
          && justTitlesNotFound.indexOf(_.toLower(title)) === -1;
    }
  }), movieYear: year };
};

function beforeFetch ({ options, currentMovie, movieYear }) {
  let title = currentMovie;
  let year  = movieYear;

  if (movieYear) {
    title = currentMovie[options.keys.title];
    year  = currentMovie[options.keys.year];
  }

  let abortTimeout = setTimeout(() => {
    _signalController.abort();
    getMetadata(options);
  }, options.timeout);

  return { title, year, abortTimeout };
};

async function getMetadata (options) {
  const { remainingMovies, movieYear } = getRemainingMovies(options);

  for (let i = 0; i < remainingMovies.length; i++) {
    const currentMovie = remainingMovies[i];

    const { title, year, abortTimeout } = beforeFetch({ options, currentMovie, movieYear });

    const metadata = await fetchMetadata({ options, title, year });

    clearTimeout(abortTimeout);

    const status = afterFetch({ options, metadata, title, year });

    if (status.isAborted) {
      break;
    };
  };

  return { fetched: _updatedMovies, notFound: _notFoundMovies };
};

async function fetchMetadata ({ options, title, year }) {
  title = encodeURIComponent(title);
  year = year ? `&y=${year}` : '';
  const apiUrl = new URL(`http://www.omdbapi.com/?t=${title}&type=movie&apikey=${options.key}${year}`);
  let jsonData = null;

  try {
    const response = await fetch(apiUrl, { signal: _signalController.signal });
    jsonData       = await response.json();
  } catch (err) {
    throw err;
  };

  return jsonData.Response === 'True' ? jsonData : 'Not Found';
};

function afterFetch ({ options, metadata, title, year }) {
  const isAborted   = metadata === 'AbortError';
  const isFound     = metadata !== 'Not Found';
  let movie         = !year ? title : { title, year };
  movie             = isFound ? metadata : movie;

  if (isAborted) {
    return { isFound, isAborted };
  };

  if (isFound) {
    _updatedMovies.push(movie);

    step.updateFound({ options, movie: movie.Title });
  } else {
    _notFoundMovies.push(movie);

    step.updateNotFound({ options, movie: title });
  };

  options.onUpdate({ movie, isFound });

  return { isAborted, isFound };
};

async function saveMetadataToJson ({ options }) {
  if (isJsonPath(options.source)) {
    fs.writeJson(resolve(options.source, '../', options.dest), _updatedMovies, {spaces: '\t'});

    if (_notFoundMovies.length) {
      fs.writeJson(resolve(options.source, '../', options.notfound), _notFoundMovies, {spaces: '\t'});
    };
  };
};

async function main(userOptions) {
  const { options } = await mergeOptions(userOptions);

  // Run the initial step
  step.init(options);

  await getMetadata(options);

  await saveMetadataToJson({ options });

  // Run the end step
  step.final(options);

  return { fetched: _updatedMovies, notFound: _notFoundMovies };
};

module.exports = main;
