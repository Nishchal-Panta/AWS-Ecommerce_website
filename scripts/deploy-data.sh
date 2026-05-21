#!/bin/bash
set -e
aws cloudformation deploy \
  --template-file ~/projects/aws-ecommerce/infra/cfn/data.yaml \
  --stack-name ecommerce-data \
  --parameter-overrides AccountId=379992420751 \
  --region ap-south-1
echo "Fetching outputs..."
aws cloudformation describe-stacks \
  --stack-name ecommerce-data \
  --query "Stacks[0].Outputs" \
  --region ap-south-1
