#!/bin/bash
set -e
TABLE="ecommerce-products"
R="--region ap-south-1"

echo "Seeding products..."

aws dynamodb put-item --table-name $TABLE $R --item '{"id":{"S":"prod-001"},"name":{"S":"Wireless Noise-Cancelling Headphones"},"description":{"S":"Premium over-ear headphones with 30hr battery life and active noise cancellation."},"price":{"N":"79.99"},"category":{"S":"Electronics"},"imageUrl":{"S":"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"},"stock":{"N":"50"},"active":{"BOOL":true},"createdAt":{"S":"2026-01-01T00:00:00.000Z"},"updatedAt":{"S":"2026-01-01T00:00:00.000Z"}}'

aws dynamodb put-item --table-name $TABLE $R --item '{"id":{"S":"prod-002"},"name":{"S":"Mechanical Keyboard"},"description":{"S":"Compact TKL mechanical keyboard with RGB backlight and tactile switches."},"price":{"N":"49.99"},"category":{"S":"Electronics"},"imageUrl":{"S":"https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400"},"stock":{"N":"30"},"active":{"BOOL":true},"createdAt":{"S":"2026-01-01T00:00:00.000Z"},"updatedAt":{"S":"2026-01-01T00:00:00.000Z"}}'

aws dynamodb put-item --table-name $TABLE $R --item '{"id":{"S":"prod-003"},"name":{"S":"Running Shoes"},"description":{"S":"Lightweight breathable running shoes with cushioned sole, perfect for daily runs."},"price":{"N":"59.99"},"category":{"S":"Sports"},"imageUrl":{"S":"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"},"stock":{"N":"100"},"active":{"BOOL":true},"createdAt":{"S":"2026-01-01T00:00:00.000Z"},"updatedAt":{"S":"2026-01-01T00:00:00.000Z"}}'

aws dynamodb put-item --table-name $TABLE $R --item '{"id":{"S":"prod-004"},"name":{"S":"Stainless Steel Water Bottle"},"description":{"S":"1L insulated water bottle keeps drinks cold 24hrs or hot 12hrs."},"price":{"N":"24.99"},"category":{"S":"Sports"},"imageUrl":{"S":"https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400"},"stock":{"N":"200"},"active":{"BOOL":true},"createdAt":{"S":"2026-01-01T00:00:00.000Z"},"updatedAt":{"S":"2026-01-01T00:00:00.000Z"}}'

aws dynamodb put-item --table-name $TABLE $R --item '{"id":{"S":"prod-005"},"name":{"S":"Minimalist Leather Wallet"},"description":{"S":"Slim genuine leather wallet with RFID blocking and 6 card slots."},"price":{"N":"19.99"},"category":{"S":"Accessories"},"imageUrl":{"S":"https://images.unsplash.com/photo-1627123424574-724758594e93?w=400"},"stock":{"N":"150"},"active":{"BOOL":true},"createdAt":{"S":"2026-01-01T00:00:00.000Z"},"updatedAt":{"S":"2026-01-01T00:00:00.000Z"}}'

aws dynamodb put-item --table-name $TABLE $R --item '{"id":{"S":"prod-006"},"name":{"S":"Desk Plant Monstera"},"description":{"S":"Easy-care indoor Monstera plant in a ceramic pot. Great for home offices."},"price":{"N":"14.99"},"category":{"S":"Home"},"imageUrl":{"S":"https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400"},"stock":{"N":"75"},"active":{"BOOL":true},"createdAt":{"S":"2026-01-01T00:00:00.000Z"},"updatedAt":{"S":"2026-01-01T00:00:00.000Z"}}'

echo "Verifying count..."
aws dynamodb scan --table-name $TABLE --select COUNT $R --query "Count"
