#!/bin/bash
set -e
R="--region ap-south-1"
ROLE_ARN="arn:aws:iam::379992420751:role/ecommerce-orders-role"

echo "Packaging migration Lambda..."
cd /tmp
mkdir -p migrate-pkg
cp migrate.js migrate-pkg/index.js
cd migrate-pkg
npm init -y > /dev/null
npm install mysql2 @aws-sdk/client-ssm --save > /dev/null
zip -r ../migrate.zip . > /dev/null
cd ..

echo "Creating migration Lambda..."
aws lambda create-function \
  --function-name ecommerce-migrate \
  --runtime nodejs20.x \
  --role $ROLE_ARN \
  --handler index.handler \
  --zip-file fileb:///tmp/migrate.zip \
  --timeout 30 \
  $R 2>/dev/null || \
aws lambda update-function-code \
  --function-name ecommerce-migrate \
  --zip-file fileb:///tmp/migrate.zip \
  $R

echo "Waiting for Lambda to be ready..."
sleep 5

echo "Running migration..."
RESULT=$(aws lambda invoke \
  --function-name ecommerce-migrate \
  --payload '{}' \
  --cli-binary-format raw-in-base64-out \
  /tmp/migrate-result.json \
  --query "StatusCode" \
  --output text \
  $R)

echo "Status: $RESULT"
cat /tmp/migrate-result.json

echo "Cleaning up migration Lambda..."
aws lambda delete-function --function-name ecommerce-migrate $R

echo "Migration complete"
