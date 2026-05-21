#!/bin/bash
set -e
source ~/projects/aws-ecommerce/.cloudfront-env
ACCOUNT_ID=379992420751
BUCKET="ecommerce-frontend-${ACCOUNT_ID}"
REGION="ap-south-1"

DIST_ARN="arn:aws:cloudfront::${ACCOUNT_ID}:distribution/${DIST_ID}"

aws s3api put-bucket-policy \
  --bucket $BUCKET \
  --region $REGION \
  --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Sid\": \"AllowCloudFrontOAC\",
      \"Effect\": \"Allow\",
      \"Principal\": {
        \"Service\": \"cloudfront.amazonaws.com\"
      },
      \"Action\": \"s3:GetObject\",
      \"Resource\": \"arn:aws:s3:::${BUCKET}/*\",
      \"Condition\": {
        \"StringEquals\": {
          \"AWS:SourceArn\": \"${DIST_ARN}\"
        }
      }
    }]
  }"

echo "Bucket policy set"
echo "Your site: https://$CF_DOMAIN"
