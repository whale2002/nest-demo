import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  transporter: Transporter;
  configService: ConfigService;

  constructor(@Inject(ConfigService) configService: ConfigService) {
    this.configService = configService;
    this.transporter = createTransport({
      host: this.configService.get<string>('EMAIL_SERVER'),
      port: 465,
      secure: true,
      auth: {
        user: this.configService.get<string>('EMAIL_SENDER'),
        pass: this.configService.get<string>('EMAIL_CODE')
      }
    });
  }

  async sendMail({ to, subject, html }) {
    await this.transporter.sendMail({
      from: {
        name: '会议室预定系统',
        address: this.configService.get<string>('EMAIL_SENDER')
      },
      to,
      subject,
      html
    });
  }
}
