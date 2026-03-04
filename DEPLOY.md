# Deploy / VPS update

After pushing to GitHub, update the live server so it runs the new code:

```bash
# On the VPS (e.g. SSH into 161.97.88.40)
cd /path/to/qualitivate   # your app directory

git pull origin master
npm install
npm run build              # if you build client + server
# Restart the Node process (e.g. PM2):
pm2 restart all
# or: systemctl restart your-app-service
```

If the backend is not restarted, the old API (e.g. survey update validation) keeps running and you'll still see errors like `"notificationEmails" is not allowed`.
