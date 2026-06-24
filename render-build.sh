#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Building MiniDrive..."

# 1. Install server dependencies
echo "Installing server dependencies..."
cd server
npm install

# 2. Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# 3. Install client dependencies
echo "Installing client dependencies..."
cd ../client
npm install

# 4. Build Vite React app
echo "Building client..."
npm run build

echo "Build completed successfully!"
