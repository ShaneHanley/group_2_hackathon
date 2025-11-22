import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface JWK {
  kty: string;
  use: string;
  kid: string;
  n: string;
  e: string;
  alg: string;
}

@Injectable()
export class JwtKeyService implements OnModuleInit {
  private readonly logger = new Logger(JwtKeyService.name);
  private privateKey: crypto.KeyObject;
  private publicKey: crypto.KeyObject;
  private keyId: string;
  private readonly keysDir = path.join(process.cwd(), 'keys');

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.loadOrGenerateKeys();
  }

  private async loadOrGenerateKeys(): Promise<void> {
    // Ensure keys directory exists
    if (!fs.existsSync(this.keysDir)) {
      fs.mkdirSync(this.keysDir, { recursive: true });
    }

    const privateKeyPath = path.join(this.keysDir, 'private.pem');
    const publicKeyPath = path.join(this.keysDir, 'public.pem');
    const keyIdPath = path.join(this.keysDir, 'keyid.txt');

    try {
      // Try to load existing keys
      if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
        const privateKeyPem = fs.readFileSync(privateKeyPath, 'utf8');
        const publicKeyPem = fs.readFileSync(publicKeyPath, 'utf8');
        
        this.privateKey = crypto.createPrivateKey(privateKeyPem);
        this.publicKey = crypto.createPublicKey(publicKeyPem);
        
        if (fs.existsSync(keyIdPath)) {
          this.keyId = fs.readFileSync(keyIdPath, 'utf8').trim();
        } else {
          this.keyId = this.generateKeyId();
          fs.writeFileSync(keyIdPath, this.keyId);
        }
        
        this.logger.log('Loaded existing RSA keypair');
        return;
      }
    } catch (error) {
      this.logger.warn('Failed to load existing keys, generating new ones', error);
    }

    // Generate new keypair
    this.logger.log('Generating new RSA keypair for JWT signing...');
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    this.privateKey = crypto.createPrivateKey(privateKey);
    this.publicKey = crypto.createPublicKey(publicKey);
    this.keyId = this.generateKeyId();

    // Save keys to disk
    fs.writeFileSync(privateKeyPath, privateKey);
    fs.writeFileSync(publicKeyPath, publicKey);
    fs.writeFileSync(keyIdPath, this.keyId);

    this.logger.log('RSA keypair generated and saved');
  }

  private generateKeyId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  getPrivateKey(): crypto.KeyObject {
    return this.privateKey;
  }

  getPublicKey(): crypto.KeyObject {
    return this.publicKey;
  }

  getKeyId(): string {
    return this.keyId;
  }

  /**
   * Get JWKS (JSON Web Key Set) for token verification
   */
  getJWKS(): { keys: JWK[] } {
    try {
      // Export public key as JWK format
      const jwk = this.publicKey.export({
        format: 'jwk',
      }) as any;

      const jwkEntry: JWK = {
        kty: 'RSA',
        use: 'sig',
        kid: this.keyId,
        n: jwk.n,
        e: jwk.e,
        alg: 'RS256',
      };

      return {
        keys: [jwkEntry],
      };
    } catch (error) {
      // Fallback: return empty JWKS if export fails
      return {
        keys: [],
      };
    }
  }

  /**
   * Sign a JWT payload using RS256
   */
  sign(payload: any, options?: { expiresIn?: string }): string {
    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: this.keyId,
    };

    const now = Math.floor(Date.now() / 1000);
    const exp = options?.expiresIn
      ? now + this.parseExpiresIn(options.expiresIn)
      : now + 900; // Default 15 minutes

    const jwtPayload = {
      ...payload,
      iat: now,
      exp,
    };

    const encodedHeader = Buffer.from(JSON.stringify(header))
      .toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(jwtPayload))
      .toString('base64url');

    const signature = crypto
      .createSign('RSA-SHA256')
      .update(`${encodedHeader}.${encodedPayload}`)
      .sign(this.privateKey, 'base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verify a JWT token
   */
  verify(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;

    // Verify signature
    const isValid = crypto
      .createVerify('RSA-SHA256')
      .update(`${encodedHeader}.${encodedPayload}`)
      .verify(this.publicKey, signature, 'base64url');

    if (!isValid) {
      throw new Error('Invalid token signature');
    }

    // Decode payload
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    );

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token expired');
    }

    return payload;
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 900; // Default 15 minutes
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900;
    }
  }
}

