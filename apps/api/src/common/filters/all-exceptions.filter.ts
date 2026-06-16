import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException } from '../exceptions/domain.exception';

/**
 * Translates every thrown error into an RFC 7807 `application/problem+json` body.
 * One filter, one error shape — clients never see a raw stack trace or an
 * inconsistent payload, regardless of where in the stack the error originated.
 */
interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  code: string;
  instance: string;
  timestamp: string;
  errors?: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const problem = this.toProblem(exception, request);

    if (problem.status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${problem.status} ${problem.code}: ${problem.detail}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} -> ${problem.status} ${problem.code}`);
    }

    response
      .status(problem.status)
      .setHeader('Content-Type', 'application/problem+json')
      .json(problem);
  }

  private toProblem(exception: unknown, request: Request): ProblemDetails {
    const base = {
      instance: request.url,
      timestamp: new Date().toISOString(),
      type: 'about:blank',
    };

    if (exception instanceof DomainException) {
      return {
        ...base,
        status: exception.status,
        title: titleFor(exception.status),
        detail: exception.message,
        code: exception.code,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const detail =
        typeof res === 'string'
          ? res
          : ((res as Record<string, unknown>).message as string) ?? exception.message;
      const errors =
        typeof res === 'object' ? (res as Record<string, unknown>).message : undefined;
      return {
        ...base,
        status,
        title: titleFor(status),
        detail: Array.isArray(detail) ? 'Request validation failed.' : detail,
        code: codeFromStatus(status),
        errors: Array.isArray(errors) ? errors : undefined,
      };
    }

    return {
      ...base,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      title: 'Internal Server Error',
      detail: 'An unexpected error occurred.',
      code: 'internal_error',
    };
  }
}

function titleFor(status: number): string {
  return (
    {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
    }[status] ?? 'Error'
  );
}

function codeFromStatus(status: number): string {
  return (
    {
      400: 'bad_request',
      401: 'unauthorized',
      403: 'forbidden',
      404: 'not_found',
      409: 'conflict',
      422: 'unprocessable_entity',
      429: 'rate_limited',
    }[status] ?? 'error'
  );
}
