import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { ProjectTaskAttachmentDTO } from '@superboard/shared';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('tasks/:taskId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTaskAttachment(
    @Param('taskId') taskId: string,
    @UploadedFile()
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
  ): Promise<ProjectTaskAttachmentDTO> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.uploadService.uploadTaskAttachment(taskId, file);
  }

  @Delete('attachments/:id')
  async deleteAttachment(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.uploadService.deleteAttachment(id);
    return { success: true };
  }
}
