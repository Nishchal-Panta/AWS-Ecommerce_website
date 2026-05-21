#!/bin/bash
set -e
cd ~/projects/aws-ecommerce

echo "Building SAM..."
sam build

echo "Deploying SAM..."
sam deploy \
  --stack-name ecommerce-app \
  --region ap-south-1 \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --no-confirm-changeset

echo "Fetching API URL..."
aws cloudformation describe-stacks \
  --stack-name ecommerce-app \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text \
  --region ap-south-1
