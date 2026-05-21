"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ses = exports.sqs = exports.ddb = void 0;
exports.getParam = getParam;
exports.getDb = getDb;
exports.response = response;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_sqs_1 = require("@aws-sdk/client-sqs");
const client_ses_1 = require("@aws-sdk/client-ses");
const client_ssm_1 = require("@aws-sdk/client-ssm");
const promise_1 = __importDefault(require("mysql2/promise"));
const REGION = process.env.AWS_REGION ?? "ap-south-1";
const ddbRaw = new client_dynamodb_1.DynamoDBClient({ region: REGION });
exports.ddb = lib_dynamodb_1.DynamoDBDocumentClient.from(ddbRaw, {
    marshallOptions: { removeUndefinedValues: true },
});
exports.sqs = new client_sqs_1.SQSClient({ region: REGION });
exports.ses = new client_ses_1.SESClient({ region: REGION });
const ssm = new client_ssm_1.SSMClient({ region: REGION });
const paramCache = new Map();
async function getParam(name) {
    if (paramCache.has(name))
        return paramCache.get(name);
    const { Parameter } = await ssm.send(new client_ssm_1.GetParameterCommand({ Name: name, WithDecryption: true }));
    const value = Parameter?.Value ?? "";
    paramCache.set(name, value);
    return value;
}
let pool = null;
async function getDb() {
    if (pool)
        return pool;
    const host = await getParam("/ecommerce/db/host");
    const user = await getParam("/ecommerce/db/user");
    const password = await getParam("/ecommerce/db/password");
    const database = await getParam("/ecommerce/db/name");
    pool = promise_1.default.createPool({
        host, user, password, database,
        waitForConnections: true,
        connectionLimit: 1,
        connectTimeout: 10000,
    });
    return pool;
}
function response(statusCode, body, headers = {}) {
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
