import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface VerifyTokenResponse {
  userId: string;
  workspaceId: string;
}

@Injectable()
export class AuthService {
  private readonly coreApiUrl: string;

  constructor(private config: ConfigService) {
    this.coreApiUrl = this.config.get<string>('CORE_API_URL') ?? 'http://localhost:4000';
  }

  async verifyToken(token: string): Promise<VerifyTokenResponse | null> {
    try {
      const response = await axios.post<VerifyTokenResponse>(
        `${this.coreApiUrl}/api/v1/auth/verify-token`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000,
        },
      );
      return response.data;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }
}
