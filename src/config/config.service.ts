import { ConfigService } from '@nestjs/config'
import { Injectable, Logger } from '@nestjs/common'
import { DEFAULT_PORTS, APP_ENV } from '@/common/constants'

/**
 * Application configuration service
 * Provides typed access to environment variables
 */
@Injectable()
export class MyConfigService {
  private readonly logger = new Logger(MyConfigService.name)

  // Zone configuration
  readonly zoneChartUrl: string

  // Database configuration
  readonly mysqlHost: string
  readonly mysqlPort: number
  readonly mysqlUser: string
  readonly mysqlPassword: string
  readonly mysqlDatabase: string

  // Redis configuration
  readonly redisHost: string
  readonly redisPort: number

  // Application configuration
  readonly appEnv: string
  readonly synchronizeDatabase: boolean

  constructor(private readonly configService: ConfigService) {
    // Zone configuration
    this.zoneChartUrl = this.getRequired<string>('ZONE_CHART_URL')

    // Database configuration
    this.mysqlHost = this.getRequired<string>('MYSQL_HOST')
    this.mysqlPort = this.getNumber('MYSQL_PORT', DEFAULT_PORTS.MYSQL)
    this.mysqlUser = this.getRequired<string>('MYSQL_USER')
    this.mysqlPassword = this.getRequired<string>('MYSQL_PASSWORD')
    this.mysqlDatabase = this.getRequired<string>('MYSQL_DATABASE')

    // Redis configuration
    this.redisHost = this.getRequired<string>('REDIS_HOST')
    this.redisPort = this.getNumber('REDIS_PORT', DEFAULT_PORTS.REDIS)

    // Application configuration
    this.appEnv = this.get<string>('APP_ENV', APP_ENV.PRODUCTION)
    this.synchronizeDatabase = this.appEnv === APP_ENV.DEVELOPMENT

    this.logger.log('Configuration loaded successfully')
  }

  /**
   * Get required environment variable
   * Throws error if variable is not set
   */
  private getRequired<T = string>(key: string): T {
    const value = this.configService.get<T>(key)
    if (value === undefined || value === null) {
      throw new Error(`Required environment variable ${key} is not set`)
    }
    return value
  }

  /**
   * Get optional environment variable with default value
   */
  private get<T = string>(key: string, defaultValue: T): T {
    return this.configService.get<T>(key, defaultValue)
  }

  /**
   * Get number from environment variable
   */
  private getNumber(key: string, defaultValue: number): number {
    const value = this.configService.get<string>(key)
    if (!value) {
      return defaultValue
    }
    const parsed = parseInt(value, 10)
    if (isNaN(parsed)) {
      this.logger.warn(
        `Invalid number value for ${key}: ${value}. Using default: ${defaultValue}`,
      )
      return defaultValue
    }
    return parsed
  }
}
