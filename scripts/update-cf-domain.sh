#!/bin/bash
set -e
R="--region ap-south-1"
CF_DOMAIN="d2bmtm5fjdmhwb.cloudfront.net"

echo "Updating SSM frontend_url..."
aws ssm put-parameter \
  --name "/ecommerce/app/frontend_url" \
  --value "https://$CF_DOMAIN" \
  --type String --overwrite $R

echo "Updating Cognito callback URLs..."
aws cognito-idp update-user-pool-client \
  --user-pool-id ap-south-1_mLsRv6Cu4 \
  --client-id jvr7ucu0jvbrf9u7g07b26k7t \
  --supported-identity-providers COGNITO \
  --allowed-o-auth-flows code \
  --allowed-o-auth-scopes email openid profile \
  --allowed-o-auth-flows-user-pool-client \
  --callback-urls "http://localhost:3000/auth/callback" "https://$CF_DOMAIN/auth/callback/" \
  --logout-urls "http://localhost:3000" "https://$CF_DOMAIN/" \
  --region ap-south-1

echo "Updating API Gateway CORS..."
aws cloudformation deploy \
  --template-file ~/projects/aws-ecommerce/template.yaml \
  --stack-name ecommerce-app \
  --capabilities CAPABILITY_IAM \
  --region ap-south-1

echo "Rebuilding frontend with production URL..."
sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://150ouvhn24.execute-api.ap-south-1.amazonaws.com/prod|" \
  ~/projects/aws-ecommerce/frontend/.env.local

cd ~/projects/aws-ecommerce/frontend
npm run build

echo "Deploying updated build to S3..."
ACCOUNT_ID=379992420751
BUCKET="ecommerce-frontend-${ACCOUNT_ID}"

aws s3 sync out/ s3://$BUCKET \
  --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "*.html" \
  --region ap-south-1

aws s3 sync out/ s3://$BUCKET \
  --delete \
  --cache-control "public,max-age=0,must-revalidate" \
  --include "*.html" \
  --region ap-south-1

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id E1SJ4GH8K5MPZO \
  --paths "/*"

echo ""
echo "========================================="
echo "Site live at: https://$CF_DOMAIN"
echo "========================================="
