#!/bin/bash
set -e
aws cloudformation deploy \
  --template-file ~/projects/aws-ecommerce/infra/cfn/vpc.yaml \
  --stack-name ecommerce-vpc \
  --region ap-south-1
echo "Done. Checking status..."
aws cloudformation describe-stacks \
  --stack-name ecommerce-vpc \
  --query "Stacks[0].StackStatus" \
  --region ap-south-1
