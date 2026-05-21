#!/bin/bash
set -e
R="--region ap-south-1"
ACCOUNT=379992420751
EMAIL="nishchalpanta426@gmail.com"
FUNCTIONS="ecommerce-products ecommerce-cart ecommerce-orders ecommerce-notify ecommerce-auth"

echo "Creating SNS alarm topic..."
TOPIC_ARN=$(aws sns create-topic --name ecommerce-alarms --query "TopicArn" --output text $R)
echo "Topic: $TOPIC_ARN"

echo "Subscribing email to alarms..."
aws sns subscribe \
  --topic-arn $TOPIC_ARN \
  --protocol email \
  --notification-endpoint $EMAIL \
  $R

echo ""
echo "⚠️  Skipping reserved concurrency (not needed for free tier)"
echo ""

echo "Creating Lambda error rate alarms..."
for fn in $FUNCTIONS; do
  aws cloudwatch put-metric-alarm \
    --alarm-name "${fn}-errors" \
    --alarm-description "Error rate too high for ${fn}" \
    --metric-name Errors \
    --namespace AWS/Lambda \
    --dimensions Name=FunctionName,Value=$fn \
    --statistic Sum \
    --period 60 \
    --threshold 5 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --evaluation-periods 1 \
    --alarm-actions $TOPIC_ARN \
    $R
  echo "✓ Alarm created for $fn"
done

echo ""
echo "Creating API Gateway 5xx alarm..."
API_ID="150ouvhn24"
aws cloudwatch put-metric-alarm \
  --alarm-name "api-5xx-errors" \
  --alarm-description "API Gateway 5xx errors" \
  --metric-name 5XXError \
  --namespace AWS/ApiGateway \
  --dimensions Name=ApiId,Value=$API_ID \
  --statistic Sum \
  --period 60 \
  --threshold 10 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --evaluation-periods 1 \
  --alarm-actions $TOPIC_ARN \
  $R
echo "✓ API Gateway 5xx alarm created"

echo ""
echo "Creating DynamoDB throttle alarm..."
aws cloudwatch put-metric-alarm \
  --alarm-name "dynamodb-throttles" \
  --alarm-description "DynamoDB throttling detected" \
  --metric-name ThrottledRequests \
  --namespace AWS/DynamoDB \
  --statistic Sum \
  --period 60 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --evaluation-periods 1 \
  --alarm-actions $TOPIC_ARN \
  $R
echo "✓ DynamoDB throttle alarm created"

echo ""
echo "✅ All alarms created successfully!"
echo ""
echo "📊 Listing alarms..."
aws cloudwatch describe-alarms \
  --query "MetricAlarms[*].AlarmName" \
  --output table \
  $R
