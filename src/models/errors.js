class StorageError extends Error {
  constructor(message) {
    super(message)
    this.name = 'StorageError'
  }
}

class NoSavedDataError extends StorageError {
  constructor(file) {
    super('[Storage] No saved data found (' + file + ')')
    this.name = NoSavedDataError
    this.file = file
  }
}

class ParsingError extends StorageError {
  constructor(file) {
    super('[Storage] Error while parsing data (' + file + ')')
    this.name = NoSavedDataError
    this.file = file
  }
}

module.exports = {
  StorageError,
  NoSavedDataError,
  ParsingError
}
