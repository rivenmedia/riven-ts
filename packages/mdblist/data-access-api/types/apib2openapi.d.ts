declare module "apib2openapi" {
  export interface Apib2SwaggerOptions {
    preferReference?: boolean;
    bearerAsApikey?: boolean;
  }

  export interface Swagger2OpenapiOptions {
    anchors?: boolean;
    direct?: boolean;
    patch?: boolean;
  }

  export interface ConvertOptions {
    apib2swaggerOptions?: Apib2SwaggerOptions;
    swagger2openapiOptions?: Swagger2OpenapiOptions;
  }

  export interface Apib2SwaggerResult {
    swagger: object;
  }

  export interface Swagger2OpenapiResult {
    openapi: object;
  }

  export function apib2swaggerConverter(
    data: string,
    options?: Apib2SwaggerOptions,
  ): Promise<Apib2SwaggerResult>;

  export function swagger2openapiConverter(
    data: object,
    options?: Swagger2OpenapiOptions,
  ): Promise<Swagger2OpenapiResult>;

  export function convert(
    data: string,
    options?: ConvertOptions,
  ): Promise<Swagger2OpenapiResult>;
}
