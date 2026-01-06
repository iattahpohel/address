import { InMemoryDBService } from '@nestjs-addons/in-memory-db'
import { HttpStatus, Injectable, Logger } from '@nestjs/common'
import { err, ok, Result } from 'neverthrow'
import CustomException from '@lib/utils/custom.exception'
import { City } from '@generated/city/city'
import { CityListDataReply } from '@generated/city/city_reply'
import { GetCityConditionRequestDto } from '../dto/get-city-condition'
import { CityEntity } from '../entities/city.entity'
import * as unidecode from 'unidecode'
import { UtilsService } from '@lib/utils'
import { CityReflect } from './city.proto'

interface CityEntityInMemory extends CityEntity {
  id: string
}

/**
 * Repository for city data stored in memory
 */
@Injectable()
export class CityInMemoryRepository extends InMemoryDBService<CityEntityInMemory> {
  private readonly logger = new Logger(CityInMemoryRepository.name)

  constructor(
    private readonly utilsService: UtilsService,
    private readonly proto: CityReflect,
  ) {
    super({ featureName: 'city' })
  }

  async createCityInMemory(createData: City): Promise<Result<City, Error>> {
    try {
      const data = this.create(createData as unknown as CityEntityInMemory)

      if (this.utilsService.isObjectEmpty(data)) {
        return err(new Error('Cannot create city in memory: empty data returned'))
      }

      return ok(this.proto.reflect(data))
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'
      this.logger.error(`Failed to create city in memory: ${errorMessage}`, error instanceof Error ? error.stack : undefined)
      throw new CustomException(
        'CREATE_CITY_ERROR',
        `Failed to create city: ${errorMessage}`,
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  async createListCityInMemory(
    createData: CityEntity[],
  ): Promise<Result<boolean, Error>> {
    try {
      if (!createData || createData.length === 0) {
        return err(new Error('Cannot create list: empty data provided'))
      }

      const data = this.createMany(
        createData as unknown as CityEntityInMemory[],
      )

      if (this.utilsService.isObjectEmpty(data) || data.length === 0) {
        return err(
          new Error('Cannot create list city in memory: no data created'),
        )
      }

      this.logger.debug(`Created ${data.length} cities in memory`)
      return ok(true)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'
      this.logger.error(
        `Failed to create list of cities in memory: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      )
      throw new CustomException(
        'CREATE_CITY_LIST_ERROR',
        `Failed to create city list: ${errorMessage}`,
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  async getCityInMemory(
    condition: GetCityConditionRequestDto,
    isDetail = false,
  ): Promise<Result<CityListDataReply, Error>> {
    try {
      const reply = this.query((record: CityEntityInMemory) => {
        // City name filter (exact match for detail, partial for list)
        if (condition.cityName) {
          const recordName = unidecode(record.cityName.toLowerCase())
          const conditionName = unidecode(condition.cityName.toLowerCase())

          if (isDetail) {
            if (recordName !== conditionName) return false
          } else {
            if (!recordName.includes(conditionName)) return false
          }
        }

        // City slug filter
        if (condition.citySlug && !record.citySlug.includes(condition.citySlug)) {
          return false
        }

        // City ID filter
        if (condition.cityId !== undefined && record.cityId !== condition.cityId) {
          return false
        }

        // List of city IDs filter
        if (
          condition.listCityId !== undefined &&
          condition.listCityId.length > 0 &&
          !condition.listCityId.includes(record.cityId)
        ) {
          return false
        }

        // Country ID filter
        if (
          condition.countryId !== undefined &&
          record.countryId !== condition.countryId
        ) {
          return false
        }

        // List of country IDs filter
        if (
          condition.listCountryId !== undefined &&
          condition.listCountryId.length > 0 &&
          !condition.listCountryId.includes(record.countryId)
        ) {
          return false
        }

        // State ID filter
        if (
          condition.stateId !== undefined &&
          record.stateId !== condition.stateId
        ) {
          return false
        }

        // List of state IDs filter
        if (
          condition.listStateId !== undefined &&
          condition.listStateId.length > 0 &&
          record.stateId !== null &&
          !condition.listStateId.includes(record.stateId)
        ) {
          return false
        }

        return true
      })

      if (!reply || !Array.isArray(reply)) {
        return err(new Error('Cannot query cities from memory'))
      }

      const data = CityListDataReply.create()

      reply.forEach((each: CityEntityInMemory) => {
        data.cityList.push(this.proto.reflect(each))
        data.total++
      })

      return ok(data)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'
      this.logger.error(
        `Failed to get cities from memory: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      )
      throw new CustomException(
        'QUERY_CITY_ERROR',
        `Failed to query cities: ${errorMessage}`,
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  async getDetail(
    condition: GetCityConditionRequestDto,
  ): Promise<Result<City, Error>> {
    if (!condition) {
      return err(new Error('Empty condition provided'))
    }

    // For detail query, listCityId should not be used
    const detailCondition = { ...condition, listCityId: undefined }

    const reply = await this.getCityInMemory(detailCondition, true)

    if (reply.isErr()) {
      return err(reply.error)
    }

    if (reply.value.total === 0) {
      return err(
        new Error(
          `City not found with conditions: ${JSON.stringify(condition)}`,
        ),
      )
    }

    if (reply.value.total > 1) {
      this.logger.warn(
        `Multiple cities found (${reply.value.total}) for detail query: ${JSON.stringify(condition)}`,
      )
      return err(
        new Error(
          `Multiple cities found. Expected exactly one city, found ${reply.value.total}`,
        ),
      )
    }

    return ok(reply.value.cityList[0])
  }

  async getList(
    condition: GetCityConditionRequestDto,
  ): Promise<Result<CityListDataReply, Error>> {
    const reply = await this.getCityInMemory(condition, false)

    if (reply.isErr()) {
      return err(reply.error)
    }

    // Apply pagination if provided
    if (condition.page !== undefined && condition.limit !== undefined) {
      const page = Math.max(1, condition.page)
      const limit = Math.max(1, condition.limit)
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit

      return ok({
        cityList: reply.value.cityList.slice(startIndex, endIndex),
        total: reply.value.total,
        page,
        limit,
      })
    }

    return reply
  }
}
