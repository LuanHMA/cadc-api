import { applyDecorators, Body, Param, Query } from "@nestjs/common";
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiConflictResponse,
    ApiCookieAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiUnauthorizedResponse,
    type ApiBodyOptions,
} from "@nestjs/swagger";
import z, { type ZodObject, type ZodRawShape, type ZodType } from "zod";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";

type OpenApiSchema = Extract<ApiBodyOptions, { schema: unknown }>["schema"];
type OpenApiProperty = OpenApiSchema & { description?: string };
type ResponseSpec = ZodType | readonly [schema: ZodType, description: string];

export type ApiDocOptions = {
    summary: string;
    description?: string;
    ok?: ResponseSpec;
    created?: ResponseSpec;
    notFound?: string;
    conflict?: string;
    badRequest?: string;
    unauthorized?: string;
    cookieAuth?: string;
    protected?: boolean;
};

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

function objectProperties(schema: ZodType) {
    const json = zodToOpenApi(schema) as {
        properties?: Record<string, OpenApiProperty>;
        required?: string[];
    };

    return {
        properties: json.properties ?? {},
        required: new Set(json.required ?? []),
    };
}

function unwrapResponse(spec: ResponseSpec, fallback: string) {
    if (Array.isArray(spec)) {
        return { schema: spec[0], description: spec[1] };
    }

    return { schema: spec, description: fallback };
}

function decorateMethod(
    target: object,
    propertyKey: string | symbol | undefined,
    decorator: MethodDecorator,
) {
    if (propertyKey === undefined) {
        throw new Error("Zod parameter decorators can only be used on controller methods");
    }

    const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
    decorator(target, propertyKey, descriptor as PropertyDescriptor);
}

export function ApiZodBody(schema: ZodType) {
    return applyDecorators(ApiBody({ schema: zodToOpenApi(schema) }));
}

export function ApiZodQuery<T extends ZodRawShape>(schema: ZodObject<T>) {
    const { properties, required } = objectProperties(schema);

    return applyDecorators(
        ...Object.entries(properties).map(([name, property]) =>
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
    const property = zodToOpenApi(schema) as OpenApiProperty;

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

export function ZodBody(schema: ZodType): ParameterDecorator {
    return (target, propertyKey, parameterIndex) => {
        decorateMethod(target, propertyKey, ApiZodBody(schema));
        Body(new ZodValidationPipe(schema))(target, propertyKey, parameterIndex);
    };
}

export function ZodQuery<T extends ZodRawShape>(schema: ZodObject<T>): ParameterDecorator {
    return (target, propertyKey, parameterIndex) => {
        decorateMethod(target, propertyKey, ApiZodQuery(schema));
        Query(new ZodValidationPipe(schema))(target, propertyKey, parameterIndex);
    };
}

export function ZodParam(schema: ZodObject<ZodRawShape>): ParameterDecorator;
export function ZodParam(name: string, schema: ZodType): ParameterDecorator;
export function ZodParam(
    nameOrSchema: string | ZodObject<ZodRawShape>,
    schema?: ZodType,
): ParameterDecorator {
    return (target, propertyKey, parameterIndex) => {
        if (typeof nameOrSchema === "string") {
            decorateMethod(target, propertyKey, ApiZodParam(nameOrSchema, schema!));
            Param(nameOrSchema, new ZodValidationPipe(schema!))(target, propertyKey, parameterIndex);
            return;
        }

        const { properties } = objectProperties(nameOrSchema);

        for (const [name, property] of Object.entries(properties)) {
            decorateMethod(target, propertyKey, ApiParam({
                name,
                required: true,
                schema: property,
                description: property.description,
            }));
        }

        Param(new ZodValidationPipe(nameOrSchema))(target, propertyKey, parameterIndex);
    };
}

export function ApiDoc(options: ApiDocOptions) {
    const decorators: MethodDecorator[] = [
        ApiOperation({
            summary: options.summary,
            description: options.description,
        }),
    ];

    if (options.ok) {
        const { schema, description } = unwrapResponse(options.ok, options.summary);
        decorators.push(ApiZodOkResponse(schema, description));
    }

    if (options.created) {
        const { schema, description } = unwrapResponse(options.created, options.summary);
        decorators.push(ApiZodCreatedResponse(schema, description));
    }

    if (options.notFound) {
        decorators.push(ApiNotFoundResponse({ description: options.notFound }));
    }

    if (options.conflict) {
        decorators.push(ApiConflictResponse({ description: options.conflict }));
    }

    if (options.badRequest) {
        decorators.push(ApiBadRequestResponse({ description: options.badRequest }));
    }

    if (options.unauthorized) {
        decorators.push(ApiUnauthorizedResponse({ description: options.unauthorized }));
    }

    if (options.cookieAuth) {
        decorators.push(ApiCookieAuth(options.cookieAuth));
    }

    if (options.protected) {
        decorators.push(ApiProtected());
    }

    return applyDecorators(...decorators);
}
