#!/usr/bin/env bash
# Script: Backend Infrastructure Deployment
# Purpose: Deploy backend infrastructure for the coding workshop
# Usage: ./deploy-backend.sh [aws|local]
# Default: aws

set -e

# Usage helper
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    echo "Usage: $0 [aws|local]"
    echo "Deploy backend infrastructure for the coding workshop"
    echo ""
    echo "Arguments:"
    echo "  aws             Deploy to AWS (default)"
    echo "  local           Deploy to LocalStack for development"
    echo ""
    echo "Options:"
    echo "  -h, --help      Show this help message"
    echo ""
    echo "Requirements:"
    echo "  - terraform installed"
    echo "  - ENVIRONMENT.config file (auto-created for AWS)"
    echo ""
    echo "Examples:"
    echo "  $0              # Deploy to AWS"
    echo "  $0 aws          # Deploy to AWS"
    echo "  $0 local        # Deploy to LocalStack"
    exit 0
fi

echo "===================================="
echo "Coding Workshop - Backend Deployment"
echo "===================================="
echo ""

# Set up PATH and AWS region
export PATH="$HOME/.local/bin:$PATH"
export AWS_REGION=${AWS_REGION:-us-east-1}

# Verify required dependencies
terraform --version > /dev/null 2>&1 || { echo "ERROR: 'terraform' is missing. Aborting..."; exit 1; }

# Resolve script directory and project root paths
SCRIPT_DIR="$(cd "$(dirname "$0")" > /dev/null 2>&1 || exit 1; pwd -P)"
PROJECT_ROOT="$(cd $SCRIPT_DIR/.. > /dev/null 2>&1 || exit 1; pwd -P)"

# Define configuration file paths
ENVIRONMENT_CONFIG="$PROJECT_ROOT/ENVIRONMENT.config"
INFRA_DIR="$PROJECT_ROOT/infra"
ENVIRONMENT=${1:-"aws"}

echo "INFO: Deploying infrastructure..."
echo "INFO: Environment - $ENVIRONMENT"

# Install Node.js service dependencies before Terraform packaging so Lambda bundles
# can resolve shared runtime modules from @workshop/backend-common.
shopt -s nullglob
COMMON_SRC="$PROJECT_ROOT/packages/backend-common"
if [ -f "$COMMON_SRC/package.json" ]; then
    echo "INFO: Installing shared backend-common dependencies..."
    npm install --prefix "$COMMON_SRC" --omit=dev --silent 2>/dev/null || true
    # Remove heavy prisma engines to keep package size small
    rm -rf "$COMMON_SRC/node_modules/@prisma/engines"
    rm -rf "$COMMON_SRC/node_modules/prisma"
    rm -rf "$COMMON_SRC/node_modules/.bin"
    rm -rf "$COMMON_SRC/node_modules/.prisma/client/query_engine-*"
fi
for pkg in "$PROJECT_ROOT"/backend/*/package.json; do
    svc_dir="$(dirname "$pkg")"
    echo "INFO: Installing npm dependencies for $(basename "$svc_dir")..."
    rm -rf "$svc_dir/node_modules"
    npm install --prefix "$svc_dir" --omit=dev --silent 2>/dev/null || true
    common_module="$svc_dir/node_modules/@workshop/backend-common"
    if [ -L "$common_module" ] || [ -d "$common_module" ]; then
        rm -rf "$common_module"
    fi
    mkdir -p "$(dirname "$common_module")"
    cp -R "$PROJECT_ROOT/packages/backend-common" "$common_module"
    npm install --prefix "$svc_dir" --no-save --silent pg 2>/dev/null || true
done
shopt -u nullglob

# Change to infrastructure directory
cd "$INFRA_DIR"

# AWS Deployment Configuration
if [ "$ENVIRONMENT" = "aws" ]; then
    echo "INFO: Using AWS deployment (terraform)..."

    # Setup participant if config is missing
    $SCRIPT_DIR/setup-participant.sh

    # Load participant-specific configuration if available
    if [ -f "$ENVIRONMENT_CONFIG" ]; then
        echo "INFO: Loading participant environment configuration..."
        source $ENVIRONMENT_CONFIG
    else
        echo "WARNING: $ENVIRONMENT_CONFIG is missing"
    fi
else
    # Local development configuration — override credentials for LocalStack
    export AWS_ENDPOINT_URL="http://localhost:4566"
    export AWS_ENDPOINT_URL_S3="http://s3.localhost.localstack.cloud:4566"
    export AWS_ACCESS_KEY_ID=test
    export AWS_SECRET_ACCESS_KEY=test
    export AWS_REGION=us-east-1
    unset AWS_SESSION_TOKEN

    BUCKET_NAME="coding-workshop-tfstate-${PARTICIPANT_ID:-abcd1234}"
    if ! aws s3 ls | grep -q "$BUCKET_NAME"; then
        aws s3 mb "s3://$BUCKET_NAME"
    fi
fi

# Initialize Terraform with backend configuration
PARTICIPANT_ID=${PARTICIPANT_ID:-"abcd1234"}
if [ "$ENVIRONMENT" = "local" ] || [ -n "$PARTICIPANT_ID" ]; then
    echo "INFO: Using custom backend configuration..."
    terraform init -reconfigure -backend-config="bucket=coding-workshop-tfstate-${PARTICIPANT_ID}" -backend-config="region=${AWS_REGION:-us-east-1}"
else
    echo "WARNING: No backend.config found. Using default backend configuration."
    echo "INFO: For multi-participant workshops, run: ./bin/setup-participant.sh"
    terraform init -reconfigure
fi

# Apply Terraform configuration automatically
terraform apply -auto-approve
echo "INFO: Infrastructure deployment complete!"

# Display API endpoint
if [ -n "$API_BASE_URL" ]; then
    echo ""
    echo "API Base URL: $API_BASE_URL"
fi
if [ -n "$API_ENDPOINTS" ]; then
    echo ""
    echo "API Endpoints: $API_ENDPOINTS"
fi
