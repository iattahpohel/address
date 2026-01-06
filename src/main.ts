import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { join } from 'path'
import { AppModule } from '@/app.module'
import { CustomRpcExceptionFilter } from '@/exception.filter'
import { EXIT_CODES } from '@/common/constants'

/**
 * Validates required environment variables
 */
function validateEnvironmentVariables(): void {
  const requiredEnvVars = ['GRPC_URL']
  const missingVars: string[] = []

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar)
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`,
    )
  }
}

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap')

  try {
    // Validate environment variables
    validateEnvironmentVariables()

    // Initialize gRPC microservice
    const grpcApp = await NestFactory.createMicroservice<MicroserviceOptions>(
      AppModule,
      {
        transport: Transport.GRPC,
        options: {
          url: process.env['GRPC_URL'],
          package: ['fadovn_store'],
          loader: {
            longs: String,
            enums: String,
            json: true,
            defaults: true,
          },
          protoPath: [join(__dirname, '../../proto/api.proto')],
        },
        logger: ['error', 'warn', 'debug', 'verbose'],
      },
    )

    // Apply global validation pipe
    await grpcApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    )

    // Apply global exception filter
    grpcApp.useGlobalFilters(new CustomRpcExceptionFilter())

    await grpcApp.listen()
    logger.log(`gRPC microservice is running on: ${process.env['GRPC_URL']}`)
  } catch (error) {
    logger.error('Failed to start application', error)
    process.exit(EXIT_CODES.GENERAL_ERROR)
  }
}

bootstrap()
