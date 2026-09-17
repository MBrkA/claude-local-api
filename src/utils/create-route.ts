import { Router, Request, Response, NextFunction, RequestHandler } from "express";
import { ZodType, z } from "zod";
import { RouteConfig as OpenApiRouteConfig } from "@asteasolutions/zod-to-openapi";
import { registry } from "@/config/openapi";
import { apiKeyAuth } from "@/middleware/api-key-auth";
import { validateBody, validateQuery, validateParams } from "@/middleware/validation";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

type RouteConfig<TBody = undefined, TQuery = undefined, TParams = undefined, TResponse = undefined> = {
  method: HttpMethod;
  path: string;
  summary?: string;
  description?: string;
  tags?: string[];
  body?: ZodType<TBody>;
  query?: ZodType<TQuery>;
  params?: ZodType<TParams>;
  response?: ZodType<TResponse>;
  requireAuth?: boolean;
  middleware?: RequestHandler[];
};

export type HandlerContext<TBody = undefined, TQuery = undefined, TParams = undefined> = {
  req: Request;
  res: Response;
  next: NextFunction;
  body: TBody;
  query: TQuery;
  params: TParams;
};

type Handler<TBody, TQuery, TParams, TResponse> = (
  ctx: HandlerContext<TBody, TQuery, TParams>,
) => Promise<TResponse>;

/**
 * Convert Express path to OpenAPI path
 * Example: /users/:id -> /users/{id}
 */
function toOpenApiPath(path: string): string {
  return path.replace(/:[^/]+/g, (match) => `{${match.slice(1)}}`);
}

function buildDescription(config: { description?: string; requireAuth?: boolean }): string | undefined {
  let description = config.description ?? "";
  if (config.requireAuth) {
    description += "\n\n**🔒 Authentication Required**";
  }
  return description || undefined;
}

/**
 * Register route with OpenAPI
 */
function registerOpenApiRoute<TBody, TQuery, TParams, TResponse>(
  config: RouteConfig<TBody, TQuery, TParams, TResponse>,
) {
  const openApiConfig: OpenApiRouteConfig = {
    method: config.method,
    path: toOpenApiPath(config.path),
    summary: config.summary,
    description: buildDescription(config),
    tags: config.tags ?? ["Default"],
    request: {},
    responses: {
      200: {
        description: "Successful response",
        content: config.response
          ? {
              "application/json": {
                schema: config.response,
              },
            }
          : undefined,
      },
      400: {
        description: "Validation error",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              error: z.string(),
              details: z.array(z.any()).optional(),
            }),
          },
        },
      },
      401: { description: "Unauthorized - Authentication required" },
      500: { description: "Internal server error" },
      502: { description: "Claude Code process failed" },
      504: { description: "Claude Code process timed out" },
    },
  };

  if (config.body) {
    openApiConfig.request!.body = {
      content: {
        "application/json": {
          schema: config.body,
        },
      },
      required: true,
    };
  }

  if (config.query) {
    openApiConfig.request!.query = config.query as any;
  }

  if (config.params) {
    openApiConfig.request!.params = config.params as any;
  }

  if (config.requireAuth) {
    openApiConfig.security = [{ apiKeyAuth: [] }];
  }

  try {
    registry.registerPath(openApiConfig);
  } catch (error) {
    if (error instanceof Error && !error.message.includes("already registered")) {
      console.error("Failed to register OpenAPI route:", error);
    }
  }
}

/**
 * Create the handler function
 */
function createHandler<TBody, TQuery, TParams, TResponse>(
  _config: RouteConfig<TBody, TQuery, TParams, TResponse>,
  handler: Handler<TBody, TQuery, TParams, TResponse>,
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await handler({
        req,
        res,
        next,
        body: req.body as TBody,
        query: req.query as TQuery,
        params: req.params as TParams,
      });

      // Streaming handlers write to `res` themselves and end the response;
      // only auto-send JSON for handlers that just return a value.
      if (!res.headersSent) {
        res.json(result);
      }
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Create route with automatic middleware and OpenAPI registration
 */
function createRoute<TBody = undefined, TQuery = undefined, TParams = undefined, TResponse = unknown>(
  router: Router,
  config: RouteConfig<TBody, TQuery, TParams, TResponse>,
  handlers: Handler<TBody, TQuery, TParams, TResponse>[],
  basePath?: string,
): void {
  const openApiConfig = basePath ? { ...config, path: `${basePath}${config.path}` } : config;
  registerOpenApiRoute(openApiConfig);

  const middleware: RequestHandler[] = [];

  if (config.requireAuth) middleware.push(apiKeyAuth);
  if (config.body) middleware.push(validateBody(config.body));
  if (config.query) middleware.push(validateQuery(config.query));
  if (config.params) middleware.push(validateParams(config.params));
  if (config.middleware) middleware.push(...config.middleware);

  const routeHandlers = handlers.map((handler) => createHandler(config, handler));

  router[config.method](config.path, ...middleware, ...routeHandlers);
}

/**
 * Create a route builder with a base path, so OpenAPI docs show the full path
 * (e.g. basePath '/v1' + path '/health' -> documented as '/v1/health').
 */
export function createRouteBuilder(router: Router, basePath: string = "") {
  return function <TBody = undefined, TQuery = undefined, TParams = undefined, TResponse = unknown>(
    config: RouteConfig<TBody, TQuery, TParams, TResponse>,
    ...handlers: Handler<TBody, TQuery, TParams, TResponse>[]
  ): void {
    createRoute(router, config, handlers, basePath);
  };
}
