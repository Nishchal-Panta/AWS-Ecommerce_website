#!/bin/bash
set -e
FUNCTIONS="products cart orders notify auth"
BASE=~/projects/aws-ecommerce/backend/functions
SHARED=~/projects/aws-ecommerce/backend/layers/shared/nodejs

for fn in $FUNCTIONS; do
  echo "=== Resetting $fn ==="
  cd $BASE/$fn

  # Clean dist
  rm -rf dist

  # Write package.json
  cat > package.json << PEOF
{
  "name": "@ecommerce/${fn}",
  "version": "1.0.0",
  "main": "dist/handler.js",
  "scripts": { "build": "tsc" },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/aws-lambda": "^8.10.0",
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/lib-dynamodb": "^3.0.0",
    "@aws-sdk/client-sqs": "^3.0.0",
    "@aws-sdk/client-ses": "^3.0.0",
    "@aws-sdk/client-ssm": "^3.0.0",
    "@aws-sdk/client-s3": "^3.0.0",
    "mysql2": "^3.0.0"
  }
}
PEOF

  # Write tsconfig.json — no rootDir, explicit include
  cat > tsconfig.json << TEOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "outDir": "dist",
    "declaration": true,
    "sourceMap": false,
    "baseUrl": "src",
    "paths": {
      "/opt/nodejs/index": ["${SHARED}/index.ts"]
    }
  },
  "include": ["src/**/*", "${SHARED}/index.ts"],
  "exclude": ["node_modules", "dist"]
}
TEOF

  npm install
  echo "Done $fn"
done
echo "All functions reset"
