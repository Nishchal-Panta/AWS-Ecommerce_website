#!/bin/bash
set -e
aws cloudformation deploy \
  --template-file ~/projects/aws-ecommerce/infra/cfn/iam.yaml \
  --stack-name ecommerce-iam \
  --parameter-overrides AccountId=379992420751 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-south-1
echo "Checking status..."
aws cloudformation describe-stacks \
  --stack-name ecommerce-iam \
  --query "Stacks[0].StackStatus" \
  --region ap-south-1
