#!/bin/bash

# What-If Simulator Setup Script
echo "🚀 Setting up What-If Storytelling Simulator..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | sed 's/v//')
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is below required version $REQUIRED_VERSION"
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION is compatible"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. Database setup will be skipped."
    SKIP_DOCKER=true
else
    echo "✅ Docker found"
    SKIP_DOCKER=false
fi

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📄 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your configuration."
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

echo "📦 Installing shared dependencies..."
cd shared && npm install && cd ..

# Build shared package first
echo "🔨 Building shared package..."
cd shared && npm run build && cd ..

# Set up database
if [ "$SKIP_DOCKER" = false ]; then
    echo "🗄️  Setting up database..."
    cd database
    docker-compose up -d
    
    # Wait for PostgreSQL to be ready
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 10
    
    cd ..
    
    echo "🔄 Running database migrations..."
    npm run db:migrate
    
    echo "🌱 Seeding database with sample data..."
    npm run db:seed
else
    echo "⚠️  Skipping database setup. Please set up PostgreSQL manually."
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p backups

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with your configuration"
echo "2. Start the development servers with: npm run dev"
echo "3. Visit http://localhost:3000 to see the application"
echo ""
echo "Available commands:"
echo "  npm run dev          - Start all development servers"
echo "  npm run dev:frontend - Start frontend only"
echo "  npm run dev:backend  - Start backend only"
echo "  npm run test         - Run all tests"
echo "  npm run build        - Build all packages"
echo ""
