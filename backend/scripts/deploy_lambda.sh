#!/bin/bash
# DC Benefits Finder — Lambda Deployment Script
#
# Packages the Lambda function and FAISS layer, then deploys via SAM.
#
# Prerequisites:
#   - AWS CLI configured
#   - SAM CLI installed
#   - corpus/embeddings/ populated (run build_corpus.py + build_embeddings.py)
#
# Usage:
#   ./deploy_lambda.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/.."
INFRA_DIR="$SCRIPT_DIR/../../infrastructure"

echo "=== DC Benefits Finder — Lambda Deployment ==="

# Step 1: Build Lambda layer with FAISS index
echo ""
echo "Step 1: Packaging FAISS layer..."
LAYER_DIR=$(mktemp -d)
mkdir -p "$LAYER_DIR/opt"
cp "$BACKEND_DIR/corpus/embeddings/benefits.faiss" "$LAYER_DIR/opt/"
cp "$BACKEND_DIR/corpus/embeddings/chunks_metadata.json" "$LAYER_DIR/opt/"

# Step 2: Install Lambda dependencies
echo "Step 2: Installing Lambda dependencies..."
LAMBDA_PKG=$(mktemp -d)
pip install -r "$BACKEND_DIR/lambda/requirements.txt" -t "$LAMBDA_PKG" --quiet
cp "$BACKEND_DIR/lambda/chat_handler.py" "$LAMBDA_PKG/"
cp "$BACKEND_DIR/lambda/rag_engine.py" "$LAMBDA_PKG/"

# Step 3: Deploy via SAM
echo "Step 3: Deploying with SAM..."
cd "$INFRA_DIR"
sam build
sam deploy \
    --stack-name dc-benefits-finder \
    --capabilities CAPABILITY_IAM \
    --resolve-s3 \
    --no-confirm-changeset \
    --parameter-overrides \
        "CorsOrigin=*"

echo ""
echo "=== Deployment complete ==="
echo "Run 'sam list stack-outputs --stack-name dc-benefits-finder' to see the API URL"
