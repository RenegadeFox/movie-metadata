<p align="center">
    <img width="40%" src="https://raw.githubusercontent.com/rootr/movie-metadata/master/img/movie-metadata.png" alt="movie-metadata title image">
</p>

<p align="center">
    A simple utility to easily fetch movie metadata from an Array of movie titles using the API from the Open Movie Database.
</p>

<p align="center">    
    <a href="https://github.com/rootr/movie-metadata/issues" title="Open Issues" alt="Open Issues"><img src="https://img.shields.io/github/issues-raw/rootr/movie-metadata.svg" /></a>
    <a href="https://github.com/rootr/movie-metadata/blob/master/LICENSE" title="License" alt="License"><img src="https://img.shields.io/github/license/rootr/movie-metadata.svg" /></a>
    <a href="https://npmjs.org/package/movie-metadata" title="View on npm" alt="View on npm"><img src="http://img.shields.io/npm/v/movie-metadata.svg?style=flat" /></a>
</p>

## What Movie Metadata Does

`movie-metadata` will take an Array, List or JSON file filled with movie titles, and search the Open Movie Database (omdb) API for their respective metadata (Title, Rating, Writers, Actors, Plot, Runtime, etc.) and output the metadata into a JSON file *(CLI)* or return an Object with the same information.

### Installing

`movie-metadata` is available via npm.

It can be installed either locally (for programmatic implementation) or globally (for general usage)

**Local Installation:**

```
npm install movie-metadata --save
```

**Global Installation:**

```
npm install -g movie-metadata --save
```

## Usage
This is how you can use `movie-metadata`.

### CLI Usage
How to use `movie-metadata` with the Command-Line Interface (CLI).
>Note: *Assuming that `movie-metadata` is globally installed*

**Example**

```bash
$ getmetadata --key YOUR_API_KEY  /Users/me/moviesList.json
```
This will create a `moviesList-metadata.json` and `moviesList-notfound.json` file in the `/Users/me/` directory. 

>Note: *The `moviesList-notfound.json` file is only created if some movies in the list were not found on the omdb API server.*

The `moviesList-metadata.json` file will contain an Array of Objects containing each movies respective metadata fetched from omdb's API server [omdbapi.com](https://www.omdbapi.com).

### Programmatic usage
How to use `movie-metadata` from within a `.js` file
>Note: *Assuming that `movie-metadata` is locally installed*

**Example: Async/Await**

```javascript
const { getMetadata } = require('movie-metadata')

async function getIt() {
    const metadata = await getMetadata({
        key: 'YOUR_API_KEY',
        source: ['dead man\'s chest', 'at world\'s end', 'ralph breaks the internet', 'Ocean\'s Eight']
    })
    
    console.log(metadata)
}

getIt()

// Outputs

{ fetchedMetadata: [ 
    {
        Title: 'Pirates of the Caribbean: Dead Man\'s Chest',
        Year: '2006',
        Rated: 'PG-13',
        Released: '07 Jul 2006',
        Runtime: '151 min',
        Genre: 'Action, Adventure, Fantasy',
        Director: 'Gore Verbinski',
        Writer: 'Ted Elliott, Terry Rossio, Ted Elliott (characters), Terry Rossio (characters), Stuart Beattie (characters), Jay Wolpert...'
        Actors: 'Johnny Depp, Orlando Bloom, Keira Knightley, Jack Davenport',
        Plot: 'Jack Sparrow races to recover the heart of Davy Jones to avoid enslaving his soul to Jones\' service, as other friends a...'
        Language: 'English, Turkish, Greek, Mandarin, French',
        Country: 'USA',
        Awards: 'Won 1 Oscar. Another 42 wins & 53 nominations.',
        Poster: 'https://m.media-amazon.com/images/M/MV5BMTcwODc1MTMxM15BMl5BanBnXkFtZTYwMDg1NzY3._V1_SX300.jpg',
        Ratings: [Array],
        Metascore: '53',
        imdbRating: '7.3',
        imdbVotes: '597,591',
        imdbID: 'tt0383574',
        Type: 'movie',
        DVD: '05 Dec 2006',
        BoxOffice: '$423,032,628',
        Production: 'Buena Vista',
        Website: 'http://pirates.movies.com',
        Response: 'True'
    },
    ...
],
notFoundMovies: [] }
```

**Example: Promises**

```javascript
const { getMetadata } = require('movie-metadata')

getMetadata({
    key: 'YOUR_API_KEY',
    source: ['dead man\'s chest', 'at world\'s end', 'ralph breaks the internet', 'Ocean\'s Eight']
}).then(metadata => {
  console.log(metadata)  
})

// Same output
```

## API Reference

Below is a reference to all of `movie-metadata`'s API properties.

## CLI API
This is the API when `movie-metadata` is installed globally, and is used within the CLI.

### `--key|-k`
*omdb API key*

- **Default**: `none`
- **Type**: `String`

**Example**

```bash
$ getmetadata -k YOUR_API_KEY
// or
$ getmetadata --key YOUR_API_KEY
```

### `--source|-s`
*Source JSON file of movie titles to search with*

- **Default**: `none`
- **Type**: `String / JSON File Path`

**Example**

```bash
$ getmetadata -k YOUR_API_KEY -s /path/to/movies/list.json
// or
$ getmetadata -k YOUR_API_KEY --source /path/to/movies/list.json
```

### `--progress|-p`
*Whether or not to show a CLI progress bar while downloading the metadata*

- **Default**: `true`
- **Type**: `Boolean`

**Example**

```bash
$ getmetadata -k YOUR_API_KEY -s /movies/list.json -p false
// or
$ getmetadata -k YOUR_API_KEY -s /movies/list.json --progress false
```
![CLI Progress Bar Example](https://raw.githubusercontent.com/rootr/movie-metadata/master/img/movie-metadata - Progress Parameter.gif)

### `--verbose|-v`
*Whether or not to run verbosely*
>Note: This disables `--progress` parameter, if enabled

- **Default**: `false`
- **Type**: `Boolean`

**Example**

```bash
$ getmetadata -k YOUR_API_KEY -s /movies/list.json -v
// or
$ getmetadata -k YOUR_API_KEY -s /movies/list.json --verbose
```

### `--destination|-d`
*Where to save the JSON file with metadata*

- **Default**: `Same path as source with '-metadata' appended`
- **Type**: `String`

**Example**

```bash
$ getmetadata -k YOUR_API_KEY -s /movies/list.json -d /movies/metadata.json
// or
$ getmetadata -k YOUR_API_KEY -s /movies/list.json --destination /movies/metadata.json
```

### `--notfound|-n`
*Where to save the JSON file that holds the movies that were not found on the omdb API server*

>Note: the `notfound` file will only be create if there was any movies that were not found on the omdb API server.

- **Default**: `Same path as source with '-notfound' appended`
- **Type**: `String`

**Example**

```bash
$ getmetadata -k YOUR_API_KEY -s /movies/list.json -n /movies/metadata.json
// or
$ getmetadata -k YOUR_API_KEY -s /movies/list.json --notfound /movies/notfound.json
```

### `--overwrite|-o`
*Whether or not to overwrite the source file with the metadata JSON data*
>Note: If enabled, this disables `destination` parameter.

- **Default**: `false`
- **Type**: `Boolean`

**Example**

```bash
$ getmetadata -k YOUR_API_KEY -s /movies/list.json -o
// or
$ getmetadata -k YOUR_API_KEY -s /movies/list.json --overwrite
```
## Programmatic API
This is the API when `movie-metadata` is installed locally, and is used within a `.js` file.

### `key`
*[omdb](http://www.omdbapi.com/apikey.aspx) API key*

- **Default**: `none`
- **Type**: `String`

**Example**

```js
const { getMetadata } = require('movie-metadata')

getMetadata({
    key: 'YOUR_API_KEY',
    source: 'path/to/list/of/movies.json'
}).then(metadata => {
  // Do stuff with the Array of movies (with metadata)
})
```

### `source`
*Path to JSON file, Array, or list of movie titles to fetch metadata for*

- **Default**: `none`
- **Type**: `String|Array|JSON file path`

>Note: If a string is provided and it is not a path to a JSON file, then the "splitter" parameter is used to `split` the `String` into an `Array` of `Strings`

**Example: JSON file**

```js
const { getMetadata } = require('movie-metadata')

getMetadata({
    key: 'YOUR_API_KEY',
    source: 'path/to/list/of/movies.json'
}).then(metadata => {
  // Do stuff with the Array of movies (with metadata)
})

// movies.json file format
[
    "Ocean's Eight",
    "Ralph Breaks the Internet"
    // ...
]
```
**Example: Array (inline)**

```js
const { getMetadata } = require('movie-metadata')

getMetadata({
    key: 'YOUR_API_KEY',
    source: ["Ocean's Eight", "Ralph Breaks the Internet", "Pulp Fiction"]
}).then(metadata => {
  // Do stuff with the Array of movies (with metadata)
})
```

### `progress`
*Whether or not to show a CLI progress bar while downloading the metadata*

- **Default**: `true`
- **Type**: `Boolean`

**Example**

```js
const { getMetadata } = require('movie-metadata')

getMetadata({
    key: 'YOUR_API_KEY',
    source: 'path/to/list/of/movies.json',
    progress: true
}).then(metadata => {
  // Do stuff with the Array of movies (with metadata)
})
```
This will display a CLI progress bar using the [`cli-progress`](https://www.npmjs.com/package/cli-progress) module. 

![CLI Progress Bar Example](https://raw.githubusercontent.com/rootr/movie-metadata/master/img/movie-metadata - Progress Parameter.gif)

### `verbose`
*Whether or not to run verbosely*
> Note: This disables `progress` parameter, if enabled

- **Default**: `false`
- **Type**: `Boolean`

**Example**

```js
const { getMetadata } = require('movie-metadata')

getMetadata({
    key: 'YOUR_API_KEY',
    source: 'path/to/list/of/movies.json',
    verbose: true
}).then(metadata => {
  // Do stuff with the Array of movies (with metadata)
})
```
This will output each movie title to the console, along with whether or not it was found.

![Verbose Mode Example](https://raw.githubusercontent.com/rootr/movie-metadata/master/img/movie-metadata - Verbose Parameter.png)

### `destination`
*Where to save the fetched Array of movie metadata*

>Note: If set to false, the fetched movie metadata will be returned as a Promise of an Object with two properties `fetchedMetadata`:`[Object]` and `notFoundMovies`:`[String]`.

- **Default**: `Same path as source with '-metadata' appended`
- **Type**: `String|Boolean`

**Example**

```js
const { getMetadata } = require('movie-metadata')

getMetadata({
    key: 'YOUR_API_KEY',
    source: 'path/to/list/of/movies.json',
    destination: false
}).then(metadata => {
  // Do stuff with the Array of movies (with metadata)
})
```

### `notfound`
*Where to save the JSON file that holds the movies that were not found on the omdb API server*

>Note: If set to false, the fetched movie metadata will be returned as a Promise of an Object with two properties `fetchedMetadata`:`[Object]` and `notFoundMovies`:`[String]`.

- **Default**: `Same path as source with '-notfound' appended`
- **Type**: `String|Boolean`

**Example**

```js
const { getMetadata } = require('movie-metadata')

getMetadata({
    key: 'YOUR_API_KEY',
    source: 'path/to/list/of/movies.json',
    notfound: false
}).then(metadata => {
  // Do stuff with the Array of movies (with metadata)
})
```

### `overwrite`
*Whether or not to overwrite the source file with the metadata JSON data*
>Note: If enabled, this disables `destination` parameter. This is automatically disabled if `destination` parameter is disabled (`false`)

- **Default**: `false`
- **Type**: `Boolean`

**Example**

```js
const { getMetadata } = require('movie-metadata')

getMetadata({
    key: 'YOUR_API_KEY',
    source: 'path/to/list/of/movies.json',
    overwrite: true
}).then(metadata => {
  // Do stuff with the Array of movies (with metadata)
})
```

### `splitter`*(Not Yet Working)*
*What character to use to split the `source` `String` into an `Array`*
>Note: This is only applied if the `source` parameter is not a JSON file, or is a plain `String`.

>Note: As of version `1.0.3` this feature is not completely working yet. If the `source` parameter is a file, it must be a `JSON` file

- **Default**: `\n`
- **Type**: `String`

**Example**

```js
const { getMetadata } = require('movie-metadata')

getMetadata({
    key: 'YOUR_API_KEY',
    source: "Lucy::Se7en::Dead Man's Chest::Ocean's Eleven",
    splitter: '::'
}).then(metadata => {
  // Do stuff with the Array of movies (with metadata)
})
```
<!--This will split the `movies.txt` file into an `Array`, in which each newline is a `String` in the `Array`-->

## Built With

* [abort-controller](https://github.com/mysticatea/abort-controller#readme) - Smooth API fetch operations
* [cli-progress](https://github.com/AndiDittrich/Node.CLI-Progress) - CLI progress bar
* [command-line-args](https://github.com/75lb/command-line-args#readme) - Processing command-line arguments
* [fs-extra](https://github.com/jprichardson/node-fs-extra) - Reading/writing JSON files
* [lodash](https://lodash.com/) - General utilities
* [node-fetch](https://github.com/bitinn/node-fetch) - Running API calls to omdb
* [omdb](https://www.omdbapi.com//) - Open Movie Database (metadata API server)
* [node-tap](http://node-tap.org/) - Unit testing *(not yet implemented)*


## Versioning

We use [SemVer](http://semver.org/) for versioning.

## Authors

* **Martin Cox** - *Initial work*

## License

This project is licensed under the CC BY-NC 4.0 License - see the [LICENSE](LICENSE) file for details.
`movie-metadata` is not affiliated or endorsed by [omdbapi.com](https://www.omdbapi.com) in any way. An [API Key](http://www.omdbapi.com/apikey.aspx) (free) must be obtained prior to using this module.

## Future Additions
* Future additions/features for `movie-metadata`
