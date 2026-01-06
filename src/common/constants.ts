/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Application-wide constants
 */

/**
 * Default port numbers
 */
export const DEFAULT_PORTS = {
  MYSQL: 3306,
  REDIS: 6379,
} as const

/**
 * Time constants (in seconds)
 */
export const TIME_CONSTANTS = {
  ONE_HOUR: 3600,
  ONE_DAY: 86400,
  ONE_WEEK: 604800,
} as const

/**
 * Application environment values
 */
export const APP_ENV = {
  DEVELOPMENT: 'dev',
  PRODUCTION: 'production',
  TEST: 'test',
} as const

/**
 * Default pagination values
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const

/**
 * Process exit codes
 */
export const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  FATAL_ERROR: 2,
} as const
