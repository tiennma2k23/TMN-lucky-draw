Run:
  npm install --legacy-peer-deps
  npx prisma migrate deploy
  npx prisma migrate reset --force
  npx prisma db seed
  mkdir -p public/images/prizes
  chmod -R 755 public/images
  npm run dev
