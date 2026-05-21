#!/bin/bash
set -e
DIST_ID="E1SJ4GH8K5MPZO"

FUNCTION_ARN=$(aws cloudfront list-functions \
  --query "FunctionList.Items[?Name=='ecommerce-router'].FunctionMetadata.FunctionARN | [0]" \
  --output text)

echo "Using Function ARN: $FUNCTION_ARN"

aws cloudfront get-distribution-config --id $DIST_ID > /tmp/dist-full.json
ETAG=$(python3 -c "import sys,json; d=json.load(open('/tmp/dist-full.json')); print(d['ETag'])")
python3 -c "import sys,json; d=json.load(open('/tmp/dist-full.json')); print(json.dumps(d['DistributionConfig']))" > /tmp/dist-config.json

python3 << PYEOF
import json
fn_arn = "${FUNCTION_ARN}"
with open('/tmp/dist-config.json') as f:
    config = json.load(f)
config['DefaultCacheBehavior']['FunctionAssociations'] = {
    "Quantity": 1,
    "Items": [{"FunctionARN": fn_arn, "EventType": "viewer-request"}]
}
with open('/tmp/dist-config-updated.json', 'w') as f:
    json.dump(config, f)
print("Config written with ARN:", fn_arn)
PYEOF

aws cloudfront update-distribution \
  --id $DIST_ID \
  --distribution-config file:///tmp/dist-config-updated.json \
  --if-match $ETAG \
  --query "Distribution.Status" \
  --output text

echo "Waiting for distribution to deploy (3-5 min)..."
aws cloudfront wait distribution-deployed --id $DIST_ID

echo "Testing subpages..."
curl -s -o /dev/null -w "home: %{http_code}\n" https://d2bmtm5fjdmhwb.cloudfront.net/
curl -s -o /dev/null -w "products: %{http_code}\n" https://d2bmtm5fjdmhwb.cloudfront.net/products/
curl -s -o /dev/null -w "cart: %{http_code}\n" https://d2bmtm5fjdmhwb.cloudfront.net/cart/
curl -s -o /dev/null -w "login: %{http_code}\n" https://d2bmtm5fjdmhwb.cloudfront.net/auth/login/
