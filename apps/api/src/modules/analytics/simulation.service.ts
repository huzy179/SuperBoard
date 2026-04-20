import { Injectable } from '@nestjs/common';
import { ForecastService } from './forecast.service';

export interface SimulationParameters {
  velocityMultiplier: number;
  addedPoints: number;
  driftIntensityModifier: number;
}

@Injectable()
export class SimulationService {
  constructor(private forecastService: ForecastService) {}

  async runMissionSimulation(projectId: string, params: SimulationParameters) {
    // We simply proxy to forecastService with overrides
    return this.forecastService.getMissionForecast(projectId, params);
  }
}
