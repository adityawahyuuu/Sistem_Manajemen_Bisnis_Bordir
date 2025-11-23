import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as fs from 'fs';
import * as path from 'path';
import { storageConfig } from '../../../config';
import { logger } from '../../../shared/utils/logger.util';
import { EventEmitter } from 'events';

class WhatsAppService extends EventEmitter {
  private socket: WASocket | null = null;
  private qrCode: string | null = null;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private authPath: string;

  constructor() {
    super();
    this.authPath = path.join(storageConfig.whatsappPath, 'auth');
  }

  async initialize(): Promise<{ qrCode?: string; status: string }> {
    if (this.isConnecting) {
      return { status: 'connecting', qrCode: this.qrCode || undefined };
    }

    if (this.isConnected && this.socket) {
      return { status: 'connected' };
    }

    this.isConnecting = true;

    try {
      // Ensure auth directory exists
      if (!fs.existsSync(this.authPath)) {
        fs.mkdirSync(this.authPath, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(this.authPath);

      this.socket = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ['Bordir System', 'Chrome', '1.0.0'],
      });

      // Handle connection updates
      this.socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrCode = qr;
          this.emit('qr', qr);
          logger.info('QR Code generated');
        }

        if (connection === 'close') {
          const shouldReconnect =
            (lastDisconnect?.error as Boom)?.output?.statusCode !==
            DisconnectReason.loggedOut;

          logger.info(
            `Connection closed. Reconnect: ${shouldReconnect}`
          );

          this.isConnected = false;
          this.isConnecting = false;

          if (shouldReconnect) {
            setTimeout(() => this.initialize(), 5000);
          } else {
            this.qrCode = null;
            this.emit('disconnected');
          }
        } else if (connection === 'open') {
          this.isConnected = true;
          this.isConnecting = false;
          this.qrCode = null;
          logger.info('WhatsApp connected successfully');
          this.emit('connected');
        }
      });

      // Save credentials on update
      this.socket.ev.on('creds.update', saveCreds);

      // Handle incoming messages (optional)
      this.socket.ev.on('messages.upsert', async (m) => {
        const message = m.messages[0];
        if (!message.key.fromMe && m.type === 'notify') {
          logger.info(`New message from ${message.key.remoteJid}`);
          this.emit('message', message);
        }
      });

      // Wait a bit for QR code to be generated
      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        status: this.isConnected ? 'connected' : 'connecting',
        qrCode: this.qrCode || undefined,
      };
    } catch (error) {
      this.isConnecting = false;
      logger.error('WhatsApp initialization error:', error);
      throw error;
    }
  }

  async sendMessage(
    phoneNumber: string,
    message: string
  ): Promise<proto.WebMessageInfo> {
    if (!this.socket || !this.isConnected) {
      throw new Error('WhatsApp is not connected');
    }

    // Format phone number (remove + and add @s.whatsapp.net)
    const formattedNumber = this.formatPhoneNumber(phoneNumber);

    const result = await this.socket.sendMessage(formattedNumber, {
      text: message,
    });

    if (!result) {
      throw new Error('Failed to send message');
    }

    logger.info(`Message sent to ${phoneNumber}`);
    return result;
  }

  async sendDocument(
    phoneNumber: string,
    filePath: string,
    fileName: string,
    caption?: string
  ): Promise<proto.WebMessageInfo> {
    if (!this.socket || !this.isConnected) {
      throw new Error('WhatsApp is not connected');
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    const fileBuffer = fs.readFileSync(filePath);

    const result = await this.socket.sendMessage(formattedNumber, {
      document: fileBuffer,
      fileName: fileName,
      mimetype: 'application/pdf',
      caption: caption,
    });

    if (!result) {
      throw new Error('Failed to send document');
    }

    logger.info(`Document sent to ${phoneNumber}: ${fileName}`);
    return result;
  }

  async sendImage(
    phoneNumber: string,
    imagePath: string,
    caption?: string
  ): Promise<proto.WebMessageInfo> {
    if (!this.socket || !this.isConnected) {
      throw new Error('WhatsApp is not connected');
    }

    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image not found: ${imagePath}`);
    }

    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    const imageBuffer = fs.readFileSync(imagePath);

    const result = await this.socket.sendMessage(formattedNumber, {
      image: imageBuffer,
      caption: caption,
    });

    if (!result) {
      throw new Error('Failed to send image');
    }

    logger.info(`Image sent to ${phoneNumber}`);
    return result;
  }

  async checkNumberExists(phoneNumber: string): Promise<boolean> {
    if (!this.socket || !this.isConnected) {
      throw new Error('WhatsApp is not connected');
    }

    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    const results = await this.socket.onWhatsApp(formattedNumber.replace('@s.whatsapp.net', ''));

    if (!results || results.length === 0) {
      return false;
    }

    return Boolean(results[0]?.exists);
  }

  async logout(): Promise<void> {
    if (this.socket) {
      await this.socket.logout();
      this.socket = null;
      this.isConnected = false;
      this.qrCode = null;

      // Remove auth files
      if (fs.existsSync(this.authPath)) {
        fs.rmSync(this.authPath, { recursive: true, force: true });
      }

      logger.info('WhatsApp logged out');
      this.emit('disconnected');
    }
  }

  getStatus(): {
    isConnected: boolean;
    isConnecting: boolean;
    qrCode: string | null;
  } {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      qrCode: this.qrCode,
    };
  }

  getQRCode(): string | null {
    return this.qrCode;
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Remove leading zeros
    cleaned = cleaned.replace(/^0+/, '');

    // Add country code if not present (assuming Indonesia +62)
    if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }

    return `${cleaned}@s.whatsapp.net`;
  }
}

export const whatsappService = new WhatsAppService();
