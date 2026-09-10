import swaggerJsdoc from "swagger-jsdoc";
import { env } from "../config/env";

const definition: swaggerJsdoc.OAS3Definition = {
  openapi: "3.0.3",
  info: {
    title: "Luméra E-commerce API",
    version: "1.0.0",
    description:
      "Backend REST API for the Luméra e-commerce platform. Authentication uses a short-lived " +
      "JWT access token (Authorization: Bearer <token>) plus an httpOnly refresh token cookie.",
  },
  servers: [{ url: `http://localhost:${env.PORT}${env.API_PREFIX}`, description: "Local" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          message: { type: "string" },
          code: { type: "string" },
          fieldErrors: {
            type: "object",
            additionalProperties: { type: "array", items: { type: "string" } },
          },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer" },
          pageSize: { type: "integer" },
          totalItems: { type: "integer" },
          totalPages: { type: "integer" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string" },
          role: { type: "string", enum: ["admin", "seller", "customer"] },
          status: { type: "string", enum: ["active", "suspended", "pending"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "string" },
          sku: { type: "string" },
          name: { type: "string" },
          slug: { type: "string" },
          price: { type: "number" },
          compareAtPrice: { type: "number" },
          currency: { type: "string" },
          images: { type: "array", items: { type: "string" } },
          stock: { type: "integer" },
          status: { type: "string", enum: ["draft", "published", "archived"] },
        },
      },
      Order: {
        type: "object",
        properties: {
          id: { type: "string" },
          orderNumber: { type: "string" },
          status: {
            type: "string",
            enum: [
              "pending",
              "paid",
              "processing",
              "shipped",
              "delivered",
              "cancelled",
              "refunded",
            ],
          },
          total: { type: "number" },
          currency: { type: "string" },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

export const swaggerSpec = swaggerJsdoc({
  definition,
  apis: ["./src/routes/*.ts", "./dist/routes/*.js"],
});
