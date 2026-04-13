import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { DiagnosisService } from './diagnosis.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { apiSuccess } from '../../common/api-response.helper';

@Controller('v1/qa')
@UseGuards(JwtAuthGuard)
export class QaController {
  constructor(private diagnosisService: DiagnosisService) {}

  @Post('diagnose/manual')
  async manualDiagnose(@Body() data: { message: string; stack: string; url: string }) {
    const error = new Error(data.message);
    error.stack = data.stack;
    const diagnosis = await this.diagnosisService.diagnose(error, { url: data.url });
    return apiSuccess({ diagnosis });
  }

  @Post('generate-spec')
  async generateSpec(@Body() data: { prompt: string }) {
    const spec = await this.diagnosisService.generatePlaywrightSpec(data.prompt);
    return apiSuccess({ spec });
  }
}
