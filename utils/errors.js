class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

class ClientError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

class AuthorizationError extends ClientError {
  constructor(message) {
    super(message);
    this.statusCode = 401;
  }
}

class PermissionError extends ClientError {
  constructor(message) {
    super(message);
    this.statusCode = 403;
  }
}

class ResourceError extends ClientError {
  constructor(message) {
    super(message);
    this.statusCode = 404;
  }
}

module.exports = {
  ValidationError,
  ClientError,
  AuthorizationError,
  PermissionError,
  ResourceError,
};
