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
    this.name = ParsingError
    this.file = file
  }
}

class ESError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ESError'
  }
}

class ESPostError extends ESError {
  constructor(details, code) {
    super('[ES API] Error while sending post request: ' + details)
    this.name = 'ESPostError'
    this.code = code
  }
}

class ESAuthError extends ESError {
  constructor(details) {
    super('[ES AUTH] Error while authenticating: ' + details)
    this.name = 'ESAuthError'
  }
}

class OCError extends Error {
  constructor(message) {
    super(message)
    this.name = 'OCError'
  }
}

class OCGetError extends OCError {
  constructor(details, code) {
    super('[OC API] Error while sending get request: ' + details)
    this.name = 'OCGetError'
    this.code = code
  }
}

module.exports = {
  StorageError,
  NoSavedDataError,
  ParsingError,
  ESError,
  ESPostError,
  ESAuthError,
  OCError,
  OCGetError
}
