import { Transform, Type } from 'class-transformer'
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator'
import { GetCityConditionRequest } from '@generated/city/city_request'
import { ApiPropertyOptional } from '@nestjs/swagger'

/**
 * DTO for city query conditions
 */
export class GetCityConditionRequestDto implements GetCityConditionRequest {
  @ApiPropertyOptional({
    description: 'City ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'cityId must be a number' })
  @IsPositive({ message: 'cityId must be a positive number' })
  @Type(() => Number)
  cityId?: number

  @ApiPropertyOptional({
    description: 'City name (partial match)',
    example: 'Ho Chi Minh',
  })
  @IsOptional()
  @IsString({ message: 'cityName must be a string' })
  cityName?: string

  @ApiPropertyOptional({
    description: 'City slug',
    example: 'ho-chi-minh',
  })
  @IsOptional()
  @IsString({ message: 'citySlug must be a string' })
  citySlug?: string

  @ApiPropertyOptional({
    description: 'List of country IDs',
    type: [Number],
    example: [1, 2],
  })
  @IsOptional()
  @IsArray({ message: 'listCountryId must be an array' })
  @IsNumber({}, { each: true, message: 'Each countryId must be a number' })
  @Transform(({ value }) => {
    if (!value) return undefined
    const arrayValue = Array.isArray(value) ? value : [value]
    return arrayValue
      .map((each: unknown) => Number(each))
      .filter((n: number) => !isNaN(n))
  })
  listCountryId: number[]

  @ApiPropertyOptional({
    description: 'Country ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'countryId must be a number' })
  @IsPositive({ message: 'countryId must be a positive number' })
  @Type(() => Number)
  countryId?: number

  @ApiPropertyOptional({
    description: 'List of state IDs',
    type: [Number],
    example: [1, 2],
  })
  @IsOptional()
  @IsArray({ message: 'listStateId must be an array' })
  @IsNumber({}, { each: true, message: 'Each stateId must be a number' })
  @Transform(({ value }) => {
    if (!value) return undefined
    const arrayValue = Array.isArray(value) ? value : [value]
    return arrayValue
      .map((each: unknown) => Number(each))
      .filter((n: number) => !isNaN(n))
  })
  listStateId: number[]

  @ApiPropertyOptional({
    description: 'State ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'stateId must be a number' })
  @IsPositive({ message: 'stateId must be a positive number' })
  @Type(() => Number)
  stateId?: number

  @ApiPropertyOptional({
    description: 'List of city IDs',
    type: [Number],
    example: [1, 2],
  })
  @IsOptional()
  @IsArray({ message: 'listCityId must be an array' })
  @IsNumber({}, { each: true, message: 'Each cityId must be a number' })
  @Transform(({ value }) => {
    if (!value) return undefined
    const arrayValue = Array.isArray(value) ? value : [value]
    return arrayValue
      .map((each: unknown) => Number(each))
      .filter((n: number) => !isNaN(n))
  })
  listCityId: number[]

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'page must be a number' })
  @Min(1, { message: 'page must be at least 1' })
  @Type(() => Number)
  page?: number

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'limit must be a number' })
  @IsPositive({ message: 'limit must be a positive number' })
  @Type(() => Number)
  limit?: number
}
