import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    const message =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
        ? exceptionResponse.message
        : exception instanceof Error
          ? exception.message
          : '서버 오류가 발생했습니다';

    const code =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'code' in exceptionResponse
        ? exceptionResponse.code
        : undefined;

    response.status(status).json({
      success: false,
      message: Array.isArray(message) ? message.join(', ') : message,
      code,
    });
  }
}

