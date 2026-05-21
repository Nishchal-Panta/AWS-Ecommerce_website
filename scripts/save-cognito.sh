#!/bin/bash

set -e

R="--region ap-south-1"

# Static Cognito values from CloudFormation outputs

USER_POOL_ID="ap-south-1_mLsRv6Cu4"

CLIENT_ID="jvr7ucu0jvbrf9u7g07b26k7t"

DOMAIN="https://ecommerce-nishchal.auth.ap-south-1.amazoncognito.com"

echo "User Pool ID : $USER_POOL_ID"

echo "Client ID    : $CLIENT_ID"

echo "Domain       : $DOMAIN"

# Save to SSM

aws ssm put-parameter \
  --name "/ecommerce/cognito/user_pool_id" \
  --value "$USER_POOL_ID" \
  --type String \
  --overwrite $R

aws ssm put-parameter \
  --name "/ecommerce/cognito/client_id" \
  --value "$CLIENT_ID" \
  --type String \
  --overwrite $R

aws ssm put-parameter \
  --name "/ecommerce/cognito/domain" \
  --value "$DOMAIN" \
  --type String \
  --overwrite $R

# Write .env.local for Next.js frontend

cat > ~/projects/aws-ecommerce/frontend/.env.local << ENVEOF
NEXT_PUBLIC_COGNITO_REGION=ap-south-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=$USER_POOL_ID
NEXT_PUBLIC_COGNITO_CLIENT_ID=$CLIENT_ID
NEXT_PUBLIC_COGNITO_DOMAIN=$DOMAIN
NEXT_PUBLIC_API_URL=placeholder
ENVEOF

echo "SSM updated and frontend/.env.local written"

