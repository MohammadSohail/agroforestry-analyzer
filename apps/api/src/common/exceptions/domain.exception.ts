/**
 * Base class for domain/application errors. Carrying an HTTP status here lets the
 * application layer signal intent (not-found, conflict, upstream-failure) without
 * importing Nest's HttpException — keeping the inner layers framework-agnostic.
 */
export class DomainException extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ResourceNotFoundException extends DomainException {
  constructor(resource: string, id: string) {
    super(`${resource} '${id}' was not found.`, 404, 'resource_not_found');
  }
}

export class UpstreamProviderException extends DomainException {
  constructor(message: string) {
    super(message, 502, 'upstream_provider_error');
  }
}

export class InvalidInputException extends DomainException {
  constructor(message: string) {
    super(message, 400, 'invalid_input');
  }
}
