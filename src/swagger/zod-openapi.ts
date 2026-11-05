import { applyDecorators } from "@nestjs/common";
import {
    ApiBody,
    ApiCookieAuth,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiUnauthorizedResponse,
    ApiBearerAuth,
    type ApiBodyOptions,
} from "@nestjs/swagger";
import z, { type ZodObject, type ZodRawShape, type ZodType } from "zod";

type OpenApiSchema = Extract<ApiBodyOptions, { schema: unknown }>["schema"];

function cleanSchema(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(cleanSchema);
    }

    if (!value || typeof value !== "object") {
        return value;
    }

    const record = { ...(value as Record<string, unknown>) };

    if (record.maximum === Number.MAX_SAFE_INTEGER) {
        delete record.maximum;
    }

    for (const key of Object.keys(record)) {
        record[key] = cleanSchema(record[key]);
    }

    return record;
}

export function zodToOpenApi(schema: ZodType): OpenApiSchema {
    return cleanSchema(z.toJSONSchema(schema, {
        target: "openapi-3.0",
        io: "input",
    })) as OpenApiSchema;
}

export function ApiZodBody(schema: ZodType) {
    return applyDecorators(ApiBody({ schema: zodToOpenApi(schema) }));
}

export function ApiZodQuery<T extends ZodRawShape>(schema: ZodObject<T>) {
    const json = zodToOpenApi(schema) as {
        properties?: Record<string, OpenApiSchema & { description?: string }>;
        required?: string[];
    };
    const required = new Set(json.required ?? []);

    return applyDecorators(
        ...Object.entries(json.properties ?? {}).map(([name, property]) =>
            ApiQuery({
                name,
                required: required.has(name),
                schema: property,
                description: property.description,
            }),
        ),
    );
}

export function ApiZodParam(name: string, schema: ZodType) {
    const property = zodToOpenApi(schema) as OpenApiSchema & { description?: string };

    return applyDecorators(ApiParam({
        name,
        required: true,
        schema: property,
        description: property.description,
    }));
}

export function ApiZodOkResponse(schema: ZodType, description: string) {
    return applyDecorators(ApiResponse({
        status: 200,
        description,
        schema: zodToOpenApi(schema),
    }));
}

export function ApiZodCreatedResponse(schema: ZodType, description: string) {
    return applyDecorators(ApiResponse({
        status: 201,
        description,
        schema: zodToOpenApi(schema),
    }));
}

export function ApiProtected() {
    return applyDecorators(
        ApiBearerAuth(),
        ApiCookieAuth("access_token"),
        ApiUnauthorizedResponse({
            description: "Token de acesso ausente, inválido ou sessão encerrada",
        }),
    );
}
