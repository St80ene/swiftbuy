// src/common/filters/global-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface NestHttpExceptionResponse {
  message?: string | string[];
  errorCode?: string;
  error?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Generate or fetch a tracing correlation ID
    const incomingId = request.headers['x-correlation-id'];

    const correlationId: string = Array.isArray(incomingId)
      ? incomingId[0]
      : incomingId || uuidv4();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? (exception.getResponse() as NestHttpExceptionResponse | string)
        : null;

    const rawMessage =
      exception instanceof HttpException
        ? typeof exceptionResponse === 'object' && exceptionResponse !== null
          ? exceptionResponse.message
          : exception.message
        : 'An unexpected internal error occurred. Please contact support.';

    const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;

    const errorCode =
      exception instanceof HttpException && exceptionResponse
        ? typeof exceptionResponse === 'string'
          ? 'ERR_INTERNAL_SERVER'
          : (exceptionResponse as NestHttpExceptionResponse).errorCode ||
            'ERR_BAD_REQUEST'
        : 'ERR_UNEXPECTED_SYSTEM_FAILURE';

    // 1. Telemetry Logging (To CloudWatch, Datadog, or Loki)
    console.error(
      JSON.stringify({
        correlationId,
        status,
        errorCode,
        path: request.url,
        stack:
          exception instanceof Error
            ? exception.stack
            : 'No stack trace available',
      }),
    );

    // 2. Client Sanitized Response
    response.status(status).json({
      success: false,
      statusCode: status,
      errorCode,
      message: Array.isArray(message) ? message[0] : message, // Clean up class-validator arrays
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
    });
  }
}
