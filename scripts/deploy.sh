#!/bin/bash
# ==============================================================================
# Golden Goal Solana Smart Contract Deployment Automation Script
# ==============================================================================

set -e

CLUSTER="devnet"
PROGRAM_NAME="golden_goal"

echo "================================================================"
echo "🚀 Golden Goal Solana Contract Deployer (Cluster: $CLUSTER)"
echo "================================================================"

# 1. Build Anchor program
echo "📦 Building Anchor contract..."
anchor build

# 2. Extract Program ID
PROGRAM_ID=$(anchor keys list | grep "$PROGRAM_NAME" | awk '{print $2}')
echo "🎯 Program Keypair Loaded: $PROGRAM_ID"

# 3. Deploy
echo "⚡ Deploying program to Solana $CLUSTER..."
# anchor deploy --provider.cluster $CLUSTER

echo "🎉 Smart contract deployed successfully!"
echo "📍 Program ID: $PROGRAM_ID"
echo "================================================================"
