#!/bin/bash
set -e
FUNCTIONS="products cart orders notify auth"
BASE=~/projects/aws-ecommerce/backend/functions
SHARED=~/projects/aws-ecommerce/backend/layers/shared/nodejs

for fn in $FUNCTIONS; do
  echo "Fixing $fn..."
  cd $BASE/$fn

  # Install AWS SDK deps locally for type resolution during build
  npm install --save-dev \
    @aws-sdk/client-dynamodb \
    @aws-sdk/lib-dynamodb \
    @aws-sdk/client-sqs \
    @aws-sdk/client-ses \
    @aws-sdk/client-ssm \
    @aws-sdk/client-s3 \
    mysql2

  # Overwrite tsconfig with path alias for /opt/nodejs/index
  cat > tsconfig.json << TEOF
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "paths": {
      "/opt/nodejs/index": ["${SHARED}/index.ts"]
    },
    "baseUrl": "."
  },
  "include": ["src/**/*"]
}
TEOF

  echo "Done $fn"
done
echo "All functions fixed"
