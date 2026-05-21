#!/bin/bash
set -e
BASE=~/projects/aws-ecommerce/backend/functions

# Fix all handlers — cast requestContext to any for authorizer access
for fn in products cart orders auth; do
  sed -i 's/event\.requestContext\.authorizer/\(event\.requestContext as any\)\.authorizer/g' $BASE/$fn/src/handler.ts
  echo "Fixed $fn"
done
echo "All handlers patched"
