#!/bin/bash
set -e
ACCOUNT_ID=379992420751
BUCKET="ecommerce-frontend-${ACCOUNT_ID}"
REGION="ap-south-1"

echo "Creating CloudFront Origin Access Control..."
OAC_ID=$(aws cloudfront create-origin-access-control \
  --origin-access-control-config \
    "Name=ecommerce-oac,Description=OAC for ecommerce,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3" \
  --query "OriginAccessControl.Id" \
  --output text 2>/dev/null || \
  aws cloudfront list-origin-access-controls \
    --query "OriginAccessControlList.Items[?Name=='ecommerce-oac'].Id" \
    --output text)

echo "OAC ID: $OAC_ID"

BUCKET_DOMAIN="${BUCKET}.s3.${REGION}.amazonaws.com"

echo "Creating CloudFront distribution..."
DIST_ID=$(aws cloudfront create-distribution \
  --distribution-config "{
    \"CallerReference\": \"ecommerce-$(date +%s)\",
    \"Comment\": \"ecommerce frontend\",
    \"DefaultRootObject\": \"index.html\",
    \"Origins\": {
      \"Quantity\": 1,
      \"Items\": [{
        \"Id\": \"S3Origin\",
        \"DomainName\": \"${BUCKET_DOMAIN}\",
        \"S3OriginConfig\": {\"OriginAccessIdentity\": \"\"},
        \"OriginAccessControlId\": \"${OAC_ID}\"
      }]
    },
    \"DefaultCacheBehavior\": {
      \"TargetOriginId\": \"S3Origin\",
      \"ViewerProtocolPolicy\": \"redirect-to-https\",
      \"CachePolicyId\": \"658327ea-f89d-4fab-a63d-7e88639e58f6\",
      \"Compress\": true,
      \"AllowedMethods\": {
        \"Quantity\": 2,
        \"Items\": [\"GET\", \"HEAD\"]
      }
    },
    \"CustomErrorResponses\": {
      \"Quantity\": 1,
      \"Items\": [{
        \"ErrorCode\": 404,
        \"ResponsePagePath\": \"/404.html\",
        \"ResponseCode\": \"404\",
        \"ErrorCachingMinTTL\": 0
      }]
    },
    \"Enabled\": true,
    \"PriceClass\": \"PriceClass_All\"
  }" \
  --query "Distribution.Id" \
  --output text)

echo "Distribution ID: $DIST_ID"

echo "Waiting for distribution to deploy (3-5 min)..."
aws cloudfront wait distribution-deployed --id $DIST_ID

DOMAIN=$(aws cloudfront get-distribution \
  --id $DIST_ID \
  --query "Distribution.DomainName" \
  --output text)

echo ""
echo "CloudFront domain: https://$DOMAIN"
echo "DIST_ID=$DIST_ID" > ~/projects/aws-ecommerce/.cloudfront-env
echo "CF_DOMAIN=$DOMAIN" >> ~/projects/aws-ecommerce/.cloudfront-env

