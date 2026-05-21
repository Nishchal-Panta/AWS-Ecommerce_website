#!/bin/bash
set -e
read -s -p "Enter DB master password (min 8 chars): " DBPASS
echo ""
aws cloudformation deploy \
  --template-file ~/projects/aws-ecommerce/infra/cfn/rds.yaml \
  --stack-name ecommerce-rds \
  --parameter-overrides DBPassword="$DBPASS" \
  --region ap-south-1
echo "RDS deploying — this takes 5-8 minutes..."
aws cloudformation describe-stacks \
  --stack-name ecommerce-rds \
  --query "Stacks[0].StackStatus" \
  --region ap-south-1
