import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type MobileChannel = 'sms' | 'whatsapp';

@Injectable()
export class MobileMessagingService {
  private readonly logger = new Logger(MobileMessagingService.name);

  constructor(private readonly config: ConfigService) {}

  async sendRecoveryCode(phone: string, channel: MobileChannel, code: string): Promise<void> {
    const provider = this.config.get<string>('MOBILE_PROVIDER') ?? 'console';
    if (provider === 'console') {
      if (this.config.get<string>('NODE_ENV') === 'production') {
        throw new ServiceUnavailableException('El proveedor móvil no está configurado');
      }
      this.logger.log(`[LOCAL ${channel.toUpperCase()}] ${this.maskPhone(phone)} código ${code}`);
      return;
    }
    if (provider !== 'twilio') {
      throw new ServiceUnavailableException('Proveedor móvil no soportado');
    }
    await this.sendWithTwilio(phone, channel, code);
  }

  private async sendWithTwilio(phone: string, channel: MobileChannel, code: string): Promise<void> {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    const from = this.config.get<string>(
      channel === 'whatsapp' ? 'TWILIO_WHATSAPP_FROM' : 'TWILIO_SMS_FROM',
    );
    if (!accountSid || !authToken || !from) {
      throw new ServiceUnavailableException('Faltan credenciales del proveedor móvil');
    }

    const prefix = channel === 'whatsapp' ? 'whatsapp:' : '';
    const body = new URLSearchParams({
      To: `${prefix}${phone}`,
      From: from.startsWith(prefix) ? from : `${prefix}${from}`,
      Body: `Tu código de Taller Multi es ${code}. Expira en 10 minutos. No lo compartas.`,
    });
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );
    if (!response.ok) {
      this.logger.error(`Twilio rechazó el mensaje con estado ${response.status}`);
      throw new ServiceUnavailableException('No fue posible enviar el código');
    }
  }

  private maskPhone(phone: string): string {
    return `${phone.slice(0, 3)}••••${phone.slice(-4)}`;
  }
}
