## [2.2.5] -2018-11-30

## Breaking
- The `--destination` and `destination` options are no longer valid. They are now `--dest` and `dest` respectively.
- The `--notfound` and `notfound` options are not longer valid. They are not `--notFound` and `notFound` respectively.

### Changed
- Completely refactored the metadata source code to comply with [node-style-guide](https://github.com/felixge/node-style-guide)

## [1.2.4] -2018-11-29

### Added
- Can now accept an `Array` of `Objects` containing the movie title and year (for more accurate searches)
- `titleKey` and `yearKey` parameters which represent the property for movie title and year in the above Objects

## [1.0.3] -2018-11-29

### Added
- Programmatic API usage instructions to README
- `splitter` parameter for splitting `source` into an `Array`

## [1.0.2] -2018-11-29
### Changed
- Global command is now `getmetadata` instead of `movie-metadata`

### Removed
- Remove the global command `movie-metadata`. It is now `getmetadata` instead

### Fixed
- Issue where bin file was not executing properly

## [1.0.1] -2018-11-29
### Fixed
- Issue with global command not working

## [1.0.0] -2018-11-29
### Added
- Initial release
