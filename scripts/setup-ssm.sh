#!/bin/bash
set -e
R="--region ap-south-1"
put() { aws ssm put-parameter --name "$1" --value "$2" --type "$3" --overwrite $R; }

put "/ecommerce/db/host"            "placeholder" SecureString
put "/ecommerce/db/user"            "placeholder" SecureString
put "/ecommerce/db/password"        "placeholder" SecureString
put "/ecommerce/db/name"            "ecommerce"   SecureString
put "/ecommerce/app/frontend_url"   "placeholder" String
put "/ecommerce/app/ses_from_email" "placeholder" String
put "/ecommerce/app/orders_queue_url" "placeholder" String

echo "All SSM parameters set. Listing..."
aws ssm get-parameters-by-path \
  --path "/ecommerce" \
  --recursive \
  --query "Parameters[*].Name" \
  --region ap-south-1
