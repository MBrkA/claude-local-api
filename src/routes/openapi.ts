import { Router, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { generateOpenApiDocument } from "@/config/openapi";

const router = Router();

/**
 * Generate OpenAPI document
 */
const openApiDocument = generateOpenApiDocument();

/**
 * Serve OpenAPI JSON spec
 */
router.get("/openapi.json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(openApiDocument);
});

/**
 * Serve Swagger UI
 */
router.use(
  "/",
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Claude Local API Docs",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      syntaxHighlight: {
        theme: "monokai",
      },
    },
  }),
);

export default router;
