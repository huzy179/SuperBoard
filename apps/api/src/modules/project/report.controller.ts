import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportService } from './report.service';
import type { ProjectReportResponseDTO } from '@superboard/shared';

@Controller('v1/projects')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get(':projectId/reports')
  async getProjectReport(@Param('projectId') projectId: string): Promise<ProjectReportResponseDTO> {
    const report = await this.reportService.getProjectReport(projectId);
    return {
      success: true,
      data: report,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Get(':projectId/predictive-health')
  async getPredictiveHealth(@Param('projectId') projectId: string) {
    const data = await this.reportService.getPredictiveHealth(projectId);
    return {
      success: true,
      data,
    };
  }

  @Get(':projectId/export')
  async exportProjectTasks(@Param('projectId') projectId: string, @Res() res: Response) {
    const csv = await this.reportService.exportProjectTasksCsv(projectId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=project-export-${projectId}-${Date.now()}.csv`,
    );

    return res.send(csv);
  }

  @Get(':projectId/export/json')
  async exportProjectTasksJson(@Param('projectId') projectId: string, @Res() res: Response) {
    const json = await this.reportService.exportProjectTasksJson(projectId);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=project-export-${projectId}-${Date.now()}.json`,
    );

    return res.send(json);
  }
}
