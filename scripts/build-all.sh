#!/bin/bash
set -e
FUNCTIONS="products cart orders notify auth"
BASE=~/projects/aws-ecommerce/backend/functions

for fn in $FUNCTIONS; do
  echo "Building $fn..."
  cd $BASE/$fn
  npm run build
  echo "✓ $fn built"
done
echo "All functions built successfully"
