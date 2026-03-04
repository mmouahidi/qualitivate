# Deploy / VPS update

After pushing to GitHub, update the live server so it runs the new code.

**Important:** The API runs from **compiled** code in `server/dist/`. You must **rebuild the server** after `git pull`, or the old validator (and old behavior) keeps running.

## On the VPS (SSH into 161.97.88.40)

```bash
cd /path/to/qualitivate   # your app directory (e.g. /var/www/qualitivate or similar)

git pull origin master
npm install
# Rebuild server so dist/ has the new code (required for API changes):
npm run build:server
# If you serve the client from the same app, also:
npm run build:client
# Restart the Node process so it loads the new dist/:
pm2 restart all
```

Without `npm run build:server`, the running process still uses the old `server/dist/*.js` and you'll keep seeing errors like `"notificationEmails" is not allowed`.
