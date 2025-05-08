Run:
  npm install --legacy-peer-deps \n
  npx prisma migrate deploy \n
  npx prisma migrate reset --force \n
  npx prisma db seed \n
  mkdir -p public/images/prizes \n
  chmod -R 755 public/images \n
  npm run dev
