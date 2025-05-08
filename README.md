### 🚀 Quick Start

Run the following commands to set up and start the development server:

```bash
# Install dependencies (ignore peer dependency conflicts)
npm install --legacy-peer-deps

# Apply the database migrations
npx prisma migrate deploy

# Reset and reapply migrations (use with caution – deletes all data)
npx prisma migrate reset --force

# Seed the database with initial data
npx prisma db seed

# Create the prizes image directory and set permissions
mkdir -p public/images/prizes
chmod -R 755 public/images

# Start the development server
npm run dev
