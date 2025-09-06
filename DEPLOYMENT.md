# SynergySphere Deployment Guide

This guide provides step-by-step instructions for deploying the SynergySphere application. The backend will be deployed to an AWS Ubuntu server, and the frontend will be deployed to Netlify.

## Table of Contents
1. [Backend Deployment (AWS Ubuntu)](#backend-deployment-aws-ubuntu)
   - [Prerequisites](#prerequisites)
   - [Server Setup](#server-setup)
   - [Deployment Steps](#deployment-steps)
   - [Setting up PM2](#setting-up-pm2)
   - [Configuring Nginx](#configuring-nginx)
   - [Setting up SSL with Let's Encrypt](#setting-up-ssl-with-lets-encrypt)
   - [Environment Variables](#environment-variables)
   - [Database Backups](#database-backups)

2. [Frontend Deployment (Netlify)](#frontend-deployment-netlify)
   - [Prerequisites](#prerequisites-1)
   - [Build Configuration](#build-configuration)
   - [Environment Variables](#environment-variables-1)
   - [Deployment Steps](#deployment-steps-1)
   - [Custom Domain Setup](#custom-domain-setup)

3. [CI/CD Pipeline](#cicd-pipeline)
   - [Backend CI/CD](#backend-cicd)
   - [Frontend CI/CD](#frontend-cicd)

## Backend Deployment (AWS Ubuntu)

### Prerequisites
- AWS account with EC2 access
- Ubuntu 20.04/22.04 server instance
- Domain name (for SSL)
- Basic knowledge of Linux commands

### Server Setup

1. **Connect to your Ubuntu server**
   ```bash
   ssh -i /path/to/your-key.pem ubuntu@your-server-ip
   ```

2. **Update and upgrade packages**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Install required dependencies**
   ```bash
   sudo apt install -y nodejs npm nginx git postgresql postgresql-contrib
   sudo npm install -g pm2
   ```

4. **Install and configure PostgreSQL**
   ```bash
   sudo -u postgres createuser --interactive
   sudo -u postgres createdb synergysphere
   ```

### Deployment Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/synergysphere.git
   cd synergysphere/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the backend directory:
   ```env
   NODE_ENV=production
   PORT=5001
   DATABASE_URL="postgresql://username:password@localhost:5432/synergysphere?schema=public"
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRES_IN=1h
   REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
   REFRESH_TOKEN_EXPIRES_IN=7d
   FRONTEND_URL=https://your-frontend-url.com
   ```

### Setting up PM2

1. **Start the application with PM2**
   ```bash
   npm run build
   pm2 start dist/index.js --name "synergysphere-api"
   ```

2. **Configure PM2 to start on boot**
   ```bash
   pm2 startup
   pm2 save
   ```

### Configuring Nginx

1. **Create an Nginx configuration file**
   ```bash
   sudo nano /etc/nginx/sites-available/synergysphere
   ```

   Add the following configuration:
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:5001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

2. **Enable the site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/synergysphere /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Setting up SSL with Let's Encrypt

1. **Install Certbot**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```

2. **Obtain and install SSL certificate**
   ```bash
   sudo certbot --nginx -d api.yourdomain.com
   ```

3. **Set up automatic renewal**
   ```bash
   sudo certbot renew --dry-run
   ```

### Environment Variables

Make sure to set up the following environment variables in your production environment:

- `NODE_ENV`: Set to "production"
- `PORT`: The port your backend will run on (e.g., 5001)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT token signing
- `JWT_EXPIRES_IN`: JWT expiration time
- `REFRESH_TOKEN_SECRET`: Secret for refresh tokens
- `REFRESH_TOKEN_EXPIRES_IN`: Refresh token expiration time
- `FRONTEND_URL`: URL of your frontend application

### Database Backups

1. **Set up automated backups**
   ```bash
   sudo mkdir -p /backups/synergysphere
   ```

2. **Create a backup script**
   ```bash
   sudo nano /usr/local/bin/backup-db.sh
   ```

   Add the following content:
   ```bash
   #!/bin/bash
   DATE=$(date +%Y%m%d%H%M%S)
   BACKUP_DIR="/backups/synergysphere"
   FILENAME="synergysphere_$DATE.sql"
   
   sudo -u postgres pg_dump synergysphere > "$BACKUP_DIR/$FILENAME"
   
   # Keep only the last 7 days of backups
   find "$BACKUP_DIR" -name "synergysphere_*.sql" -type f -mtime +7 -delete
   ```

3. **Make the script executable**
   ```bash
   sudo chmod +x /usr/local/bin/backup-db.sh
   ```

4. **Set up a cron job**
   ```bash
   sudo crontab -e
   ```
   
   Add the following line to run the backup daily at 2 AM:
   ```
   0 2 * * * /usr/local/bin/backup-db.sh
   ```

## Frontend Deployment (Netlify)

### Prerequisites
- Netlify account
- GitHub/GitLab/Bitbucket repository with frontend code
- Domain name (optional)

### Build Configuration

1. **Update API endpoint**
   Ensure your frontend is configured to use the production API endpoint in your environment variables:
   ```env
   VITE_API_BASE_URL=https://api.yourdomain.com
   ```

2. **Build the application**
   ```bash
   cd synergysphere
   npm install
   npm run build
   ```

### Deployment Steps

1. **Connect your repository**
   - Log in to your Netlify account
   - Click on "Sites" and then "Import an existing project"
   - Connect to your Git provider and select the repository

2. **Configure build settings**
   - Build command: `npm run build`
   - Publish directory: `synergysphere/dist`
   - Add environment variables:
     - `VITE_API_BASE_URL`: `https://api.yourdomain.com`
     - Any other frontend environment variables

3. **Deploy the site**
   - Click "Deploy site"
   - Netlify will automatically deploy your site and provide a URL

### Custom Domain Setup

1. **Add a custom domain**
   - Go to "Domain settings" in your Netlify site
   - Click "Add custom domain" and follow the instructions
   - Update your DNS settings to point to Netlify's servers

2. **Set up HTTPS**
   - Netlify automatically provisions SSL certificates via Let's Encrypt
   - Go to "Domain management" > "HTTPS" to verify the certificate

## CI/CD Pipeline

### Backend CI/CD

1. **Set up GitHub Actions**
   Create a `.github/workflows/deploy.yml` file in your backend directory:
   ```yaml
   name: Deploy to AWS

   on:
     push:
       branches: [ main ]
     pull_request:
       branches: [ main ]

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Install Node.js
           uses: actions/setup-node@v2
           with:
             node-version: '18'
         - name: Install Dependencies
           run: npm ci
         - name: Run Tests
           run: npm test
         - name: Deploy to AWS
           uses: appleboy/ssh-action@master
           with:
             host: ${{ secrets.AWS_HOST }}
             username: ${{ secrets.AWS_USERNAME }}
             key: ${{ secrets.AWS_SSH_KEY }}
             script: |
               cd /path/to/synergysphere/backend
               git pull origin main
               npm ci --production
               npm run build
               pm2 restart synergysphere-api
   ```

### Frontend CI/CD

Netlify automatically deploys changes when you push to your connected repository. For more control, you can configure deploy previews and branch deploys in the Netlify dashboard.

## Conclusion

Your SynergySphere application is now deployed with a production-ready setup. The backend is running on AWS with Nginx and PM2, while the frontend is hosted on Netlify with automatic HTTPS. The CI/CD pipeline ensures smooth updates to both the frontend and backend.

For additional security, consider:
- Setting up a WAF (Web Application Firewall)
- Implementing rate limiting
- Setting up monitoring and alerts
- Regular security audits
