import { Controller, Get, Query } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { apiSuccess } from '../../common/api-response';
import { Public } from '../../common/decorators/public.decorator';

type RouteInfo = {
  method: string;
  path: string;
};

function joinPaths(prefix: string, path: string): string {
  const p = `${prefix}/${path}`.replace(/\/+/g, '/');
  return p.startsWith('/') ? p : `/${p}`;
}

function listExpressRoutes(app: unknown): RouteInfo[] {
  const routes: RouteInfo[] = [];

  // Express 4 uses `app._router`; Express 5 uses `app.router`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyApp = app as any;
  const router = anyApp?._router ?? anyApp?.router;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stack = router?.stack as any[] | undefined;
  if (!Array.isArray(stack)) return routes;

  const visit = (layers: unknown[], prefix = ''): void => {
    for (const layer of layers) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const l = layer as any;

      // Direct route layer
      if (l?.route?.path && l?.route?.methods) {
        const path = joinPaths(prefix, String(l.route.path));
        for (const [method, enabled] of Object.entries<boolean>(l.route.methods)) {
          if (enabled) routes.push({ method: method.toUpperCase(), path });
        }
        continue;
      }

      // Nested router layer
      const handleStack = l?.handle?.stack as unknown[] | undefined;
      if (Array.isArray(handleStack)) {
        const mountPath =
          typeof l?.path === 'string'
            ? l.path
            : typeof l?.regexp?.source === 'string'
              ? l.regexp.source
              : '';
        const nextPrefix = mountPath ? joinPaths(prefix, mountPath) : prefix;
        visit(handleStack, nextPrefix);
      }
    }
  };

  visit(stack, '');

  // Normalize + sort for stable output
  return routes
    .map((r) => ({ ...r, path: r.path.replace(/\\\//g, '/') }))
    .sort((a, b) =>
      a.path === b.path ? a.method.localeCompare(b.method) : a.path.localeCompare(b.path),
    );
}

@Controller('_debug')
export class DebugController {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  /**
   * Development-only helper to verify which routes are actually registered.
   *
   * Gate via: ENABLE_DEBUG_ROUTES=true
   * Example: GET /api/v1/_debug/routes?q=auth
   */
  @Public()
  @Get('routes')
  routes(@Query('q') q?: string) {
    const enabled = process.env.ENABLE_DEBUG_ROUTES === 'true';
    const enabledValue = process.env.ENABLE_DEBUG_ROUTES;
    const app = this.httpAdapterHost.httpAdapter?.getInstance?.();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyApp = app as any;
    const router = anyApp?._router ?? anyApp?.router;
    const hasRouter = Boolean(router && Array.isArray(router?.stack));

    if (!enabled) {
      return apiSuccess({
        enabled: false,
        routes: [] as RouteInfo[],
        debug: {
          adapter: this.httpAdapterHost.httpAdapter?.constructor?.name,
          hasRouter,
          enabledValue,
          appKeys: app && typeof app === 'object' ? Object.keys(anyApp).slice(0, 30) : [],
        },
      });
    }

    const routes = listExpressRoutes(app);
    const filtered = q
      ? routes.filter((r) => r.path.toLowerCase().includes(q.toLowerCase()))
      : routes;

    return apiSuccess({
      enabled,
      count: filtered.length,
      routes: filtered,
      debug: {
        adapter: this.httpAdapterHost.httpAdapter?.constructor?.name,
        hasRouter,
        enabledValue,
        appKeys: app && typeof app === 'object' ? Object.keys(anyApp).slice(0, 30) : [],
        totalRoutes: routes.length,
      },
    });
  }
}
