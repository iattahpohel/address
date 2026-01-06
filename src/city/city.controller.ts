import { Controller, Get, Query } from '@nestjs/common'
import { GrpcMethod } from '@nestjs/microservices'
import { CityService } from './city.service'
import * as CONST from '@/city/provider/city.constant'
import { CityListReply, CityReply } from '@generated/city/city_reply'
import { GetCityConditionRequestDto } from './dto/get-city-condition'
import { BaseController } from '@/common/base.controller'

/**
 * Controller for city-related operations
 * Supports both HTTP and gRPC endpoints
 */
@Controller({ path: 'city' })
export class CityController extends BaseController {
  constructor(private readonly service: CityService) {
    super(CityController.name)
  }

  /**
   * HTTP endpoint: Get list of cities
   */
  @Get('list')
  async getListHTTP(
    @Query() request: GetCityConditionRequestDto,
  ): Promise<CityListReply> {
    const cityData = await this.service.getList(request)

    return this.handleResult(
      cityData,
      (value) =>
        this.createSuccessResponse(
          value,
          CONST.DEFAULT_SUCCESS_CODE,
          CONST.DEFAULT_SUCCESS_MESSAGE,
        ) as CityListReply,
    )
  }

  /**
   * HTTP endpoint: Get city detail
   */
  @Get('detail')
  async getDetailHTTP(
    @Query() request: GetCityConditionRequestDto,
  ): Promise<CityReply> {
    const cityData = await this.service.getDetail(request)

    return this.handleResult(
      cityData,
      (value) =>
        this.createSuccessResponse(
          value,
          CONST.DEFAULT_SUCCESS_CODE,
          CONST.DEFAULT_SUCCESS_MESSAGE,
        ) as CityReply,
    )
  }

  /**
   * gRPC endpoint: Get city detail
   */
  @GrpcMethod('CityService', 'GetDetail')
  async getDetail(request: GetCityConditionRequestDto): Promise<CityReply> {
    const cityData = await this.service.getDetail(request)

    return this.handleResult(
      cityData,
      (value) =>
        this.createSuccessResponse(
          value,
          CONST.DEFAULT_SUCCESS_CODE,
          CONST.DEFAULT_SUCCESS_MESSAGE,
        ) as CityReply,
    )
  }

  /**
   * gRPC endpoint: Get list of cities
   */
  @GrpcMethod('CityService', 'GetList')
  async getListCity(
    request: GetCityConditionRequestDto,
  ): Promise<CityListReply> {
    const cityData = await this.service.getList(request)

    return this.handleResult(
      cityData,
      (value) =>
        this.createSuccessResponse(
          value,
          CONST.DEFAULT_SUCCESS_CODE,
          CONST.DEFAULT_SUCCESS_MESSAGE,
        ) as CityListReply,
    )
  }
}
