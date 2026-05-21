import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { SQSClient } from "@aws-sdk/client-sqs";
import { SESClient } from "@aws-sdk/client-ses";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import * as mysql from "mysql2/promise";

const REGION = process.env.AWS_REGION ?? "ap-south-1";

const ddbRaw = new DynamoDBClient({ region: REGION });
export const ddb = DynamoDBDocumentClient.from(ddbRaw, {
  marshallOptions: { removeUndefinedValues: true },
});

export const sqs = new SQSClient({ region: REGION });
export const ses = new SESClient({ region: REGION });
const ssm = new SSMClient({ region: REGION });

const paramCache = new Map<string, string>();
export async function getParam(name: string): Promise<string> {
  if (paramCache.has(name)) return paramCache.get(name)!;
  const { Parameter } = await ssm.send(
    new GetParameterCommand({ Name: name, WithDecryption: true })
  );
  const value = Parameter?.Value ?? "";
  paramCache.set(name, value);
  return value;
}

let pool: mysql.Pool | null = null;
export async function getDb(): Promise<mysql.Pool> {
  if (pool) return pool;
  const host     = await getParam("/ecommerce/db/host");
  const user     = await getParam("/ecommerce/db/user");
  const password = await getParam("/ecommerce/db/password");
  const database = await getParam("/ecommerce/db/name");
  pool = mysql.createPool({
    host, user, password, database,
    waitForConnections: true,
    connectionLimit: 1,
    connectTimeout: 10000,
  });
  return pool;
}

export function response(
  statusCode: number,
  body: unknown,
  headers: Record<string, string> = {}
) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": process.env.FRONTEND_URL ?? "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

export type APIEvent = {
  httpMethod?: string;
  routeKey?: string;
  path?: string;
  pathParameters?: Record<string, string> | null;
  queryStringParameters?: Record<string, string> | null;
  body?: string | null;
  requestContext?: {
    authorizer?: {
      jwt?: { claims: Record<string, string> };
    };
  };
};
