#!/bin/bash
set -e
FUNCTIONS="products cart orders notify auth"
BASE=~/projects/aws-ecommerce/backend/functions
SHARED=/home/nishchal/projects/aws-ecommerce/backend/layers/shared/nodejs

for fn in $FUNCTIONS; do
  echo "Fixing $fn..."
  rm -rf $BASE/$fn/dist
  cat > $BASE/$fn/tsconfig.json << TEOF
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
    "baseUrl": ".",
    "paths": {
      "/opt/nodejs/index": ["${SHARED}/index.ts"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
TEOF
  echo "Done $fn"
done
echo "All tsconfigs fixed"
