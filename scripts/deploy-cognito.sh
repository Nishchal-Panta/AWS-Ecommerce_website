#!/bin/bash
set -e
aws cloudformation deploy \
  --template-file ~/projects/aws-ecommerce/infra/cfn/cognito.yaml \
  --stack-name ecommerce-cognito \
  --region ap-south-1

echo "Fetching outputs..."
aws cloudformation describe-stacks \
  --stack-name ecommerce-cognito \
  --query "Stacks[0].Outputs" \
  --region ap-south-1
