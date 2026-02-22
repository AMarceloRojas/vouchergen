import { Controller, Post, Get, Delete, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VouchersService } from './vouchers.service';

@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(@UploadedFile() file: Express.Multer.File) {
    return this.vouchersService.procesarExcel(file.buffer);
  }

  @Post('enviar/:loteId')
  async enviarVouchers(@Param('loteId') loteId: string) {
    return this.vouchersService.enviarVouchers(parseInt(loteId));
  }

  @Get('lotes')
  async getLotes() {
    return this.vouchersService.getLotes();
  }

  @Get('lotes/:loteId')
  async getVouchersByLote(@Param('loteId') loteId: string) {
    return this.vouchersService.getVouchersByLote(parseInt(loteId));
  }

  @Delete('lotes/:loteId')
  async eliminarLote(@Param('loteId') loteId: string) {
    return this.vouchersService.eliminarLote(parseInt(loteId));
  }
}
