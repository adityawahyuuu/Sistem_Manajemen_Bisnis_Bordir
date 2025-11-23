import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  WAMessage,
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
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private lastError: string | null = null;

  constructor() {
    super();
    this.authPath = path.join(storageConfig.whatsappPath, 'auth');
  }

  async initialize(): Promise<{ qrCode?: string; status: string; error?: string }> {
    // If already connecting, return current state
    if (this.isConnecting) {
      return {
        status: 'connecting',
        qrCode: this.qrCode || undefined,
        error: this.lastError || undefined
      };
    }

    // If already connected, return connected status
    if (this.isConnected && this.socket) {
      return { status: 'connected' };
    }

    this.isConnecting = true;
    this.lastError = null;

    try {
      // Ensure auth directory exists
      if (!fs.existsSync(this.authPath)) {
        fs.mkdirSync(this.authPath, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(this.authPath);

      this.socket = makeWASocket({
        auth: state,
        browser: ['Bordir System', 'Chrome', '1.0.0'],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        retryRequestDelayMs: 2000,
        markOnlineOnConnect: false,
        syncFullHistory: false,
      });

      // Create a promise that resolves when QR is generated or connection is established
      const connectionPromise = new Promise<{ qrCode?: string; status: string; error?: string }>((resolve) => {
        const timeout = setTimeout(() => {
          resolve({
            status: this.isConnected ? 'connected' : 'timeout',
            qrCode: this.qrCode || undefined,
            error: this.isConnected ? undefined : 'Connection timeout - please try again'
          });
        }, 15000); // 15 second timeout

        // Handle connection updates
        this.socket!.ev.on('connection.update', async (update) => {
          const { connection, lastDisconnect, qr } = update;

          if (qr) {
            this.qrCode = qr;
            this.emit('qr', qr);
            logger.info('QR Code generated - scan with WhatsApp to connect');
            clearTimeout(timeout);
            resolve({
              status: 'qr_ready',
              qrCode: qr
            });
          }

          if (connection === 'close') {
            const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            const errorMessage = (lastDisconnect?.error as Boom)?.message || 'Unknown error';

            logger.warn(
              `WhatsApp connection closed. Status: ${statusCode}, Error: ${errorMessage}, Reconnect: ${shouldReconnect}`
            );

            this.isConnected = false;
            this.isConnecting = false;
            this.lastError = errorMessage;

            // Only auto-reconnect if under max attempts and not logged out
            if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
              this.reconnectAttempts++;
              const delay = Math.min(5000 * this.reconnectAttempts, 30000); // Max 30 seconds
              logger.info(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms...`);
              setTimeout(() => this.initialize(), delay);
            } else {
              this.qrCode = null;
              this.reconnectAttempts = 0;
              if (statusCode === DisconnectReason.loggedOut) {
                logger.info('WhatsApp logged out - manual reconnection required');
              } else {
                logger.warn(`Max reconnection attempts (${this.maxReconnectAttempts}) reached. Manual reconnection required.`);
              }
              this.emit('disconnected');
              clearTimeout(timeout);
              resolve({
                status: 'disconnected',
                error: `Connection failed after ${this.maxReconnectAttempts} attempts: ${errorMessage}`
              });
            }
          } else if (connection === 'open') {
            this.isConnected = true;
            this.isConnecting = false;
            this.qrCode = null;
            this.reconnectAttempts = 0; // Reset on successful connection
            this.lastError = null;
            logger.info('WhatsApp connected successfully');
            this.emit('connected');
            clearTimeout(timeout);
            resolve({ status: 'connected' });
          } else if (connection === 'connecting') {
            logger.info('Connecting to WhatsApp...');
          }
        });
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

      // Wait for connection result
      return await connectionPromise;

    } catch (error) {
      this.isConnecting = false;
      this.lastError = (error as Error).message;
      logger.error('WhatsApp initialization error:', error);
      return {
        status: 'error',
        error: (error as Error).message
      };
    }
  }

  async sendMessage(
    phoneNumber: string,
    message: string
  ): Promise<WAMessage> {
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
  ): Promise<WAMessage> {
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
  ): Promise<WAMessage> {
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
      this.reconnectAttempts = 0;

      // Remove auth files
      if (fs.existsSync(this.authPath)) {
        fs.rmSync(this.authPath, { recursive: true, force: true });
      }

      logger.info('WhatsApp logged out');
      this.emit('disconnected');
    }
  }

  // Reset and try to connect again (manual reconnection)
  async reconnect(): Promise<{ qrCode?: string; status: string; error?: string }> {
    this.reconnectAttempts = 0;
    this.isConnecting = false;
    this.isConnected = false;
    this.qrCode = null;
    this.lastError = null;

    if (this.socket) {
      this.socket.end(undefined);
      this.socket = null;
    }

    return this.initialize();
  }

  getStatus(): {
    isConnected: boolean;
    isConnecting: boolean;
    qrCode: string | null;
    reconnectAttempts: number;
    lastError: string | null;
  } {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      qrCode: this.qrCode,
      reconnectAttempts: this.reconnectAttempts,
      lastError: this.lastError,
    };
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