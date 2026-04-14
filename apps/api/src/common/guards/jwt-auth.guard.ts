import { Injectable } from '@nestjs/common';
import { BearerAuthGuard } from './bearer-auth.guard';

/**
 * JwtAuthGuard serves as a unified JWT verification layer.
 * In this architecture, it delegates to BearerAuthGuard for token extraction and synthesis.
 */
@Injectable()
export class JwtAuthGuard extends BearerAuthGuard {}
