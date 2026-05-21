import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { SQSClient } from "@aws-sdk/client-sqs";
import { SESClient } from "@aws-sdk/client-ses";
import mysql from "mysql2/promise";
export declare const ddb: DynamoDBDocumentClient;
export declare const sqs: SQSClient;
export declare const ses: SESClient;
export declare function getParam(name: string): Promise<string>;
export declare function getDb(): Promise<mysql.Pool>;
export declare function response(statusCode: number, body: unknown, headers?: Record<string, string>): {
    statusCode: number;
    headers: {
        "Content-Type": string;
        "Access-Control-Allow-Origin": string;
        "Access-Control-Allow-Headers": string;
        "Access-Control-Allow-Methods": string;
    };
    body: string;
};
export type APIEvent = {
    httpMethod?: string;
    routeKey?: string;
    path?: string;
    pathParameters?: Record<string, string> | null;
    queryStringParameters?: Record<string, string> | null;
    body?: string | null;
    requestContext?: {
        authorizer?: {
            jwt?: {
                claims: Record<string, string>;
            };
        };
    };
};
