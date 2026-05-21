#!/bin/bash
set -e
R="--region ap-south-1"
read -s -p "Enter the same DB password you just used: " DBPASS
echo ""

ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name ecommerce-rds \
  --query "Stacks[0].Outputs[?OutputKey=='DBEndpoint'].OutputValue" \
  --output text $R)

echo "DB Endpoint: $ENDPOINT"

aws ssm put-parameter --name "/ecommerce/db/host"     --value "$ENDPOINT" --type SecureString --overwrite $R
aws ssm put-parameter --name "/ecommerce/db/user"     --value "admin"     --type SecureString --overwrite $R
aws ssm put-parameter --name "/ecommerce/db/password" --value "$DBPASS"   --type SecureString --overwrite $R
aws ssm put-parameter --name "/ecommerce/db/name"     --value "ecommerce" --type SecureString --overwrite $R

QUEUE_URL=$(aws cloudformation describe-stacks \
  --stack-name ecommerce-data \
  --query "Stacks[0].Outputs[?OutputKey=='OrdersQueueUrl'].OutputValue" \
  --output text $R)

aws ssm put-parameter --name "/ecommerce/app/orders_queue_url" --value "$QUEUE_URL"                      --type String --overwrite $R
aws ssm put-parameter --name "/ecommerce/app/ses_from_email"   --value "nishchalpanta426@gmail.com"      --type String --overwrite $R
aws ssm put-parameter --name "/ecommerce/app/frontend_url"     --value "http://localhost:3000"           --type String --overwrite $R

echo ""
echo "All SSM parameters updated. Verifying..."
aws ssm get-parameters-by-path --path "/ecommerce" --recursive --query "Parameters[*].{Name:Name}" --output table $R
