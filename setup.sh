#!/bin/bash
set -e

echo "🚀 Setting up SynergySphere project..."

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd synergysphere
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd ../backend
npm install

# Set up environment variables
echo "🔧 Setting up environment variables..."
cp .env.example .env

# Set up the database
echo "💾 Setting up the database..."
npx prisma migrate dev --name init

# Generate Prisma client
echo "⚙️  Generating Prisma client..."
npx prisma generate

echo "✨ Setup complete!"
echo "To start the backend server: cd backend && npm run dev"
echo "To start the frontend: cd synergysphere && npm run dev"
