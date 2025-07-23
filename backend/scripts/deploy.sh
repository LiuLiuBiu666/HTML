#!/bin/bash

# Luxshare Interview Registration - Deploy Script
# This script deploys the backend to Google Cloud

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="luxshare-interview-backend"
VM_NAME="luxshare-server"
ZONE="asia-southeast1-a"
REGION="asia-southeast1"

echo -e "${BLUE}🚀 Starting deployment to Google Cloud...${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_warning "You are not authenticated with gcloud. Please run: gcloud auth login"
    gcloud auth login
fi

# Set project
print_status "Setting project..."
gcloud config set project $PROJECT_NAME

# Check if VM exists
if ! gcloud compute instances describe $VM_NAME --zone=$ZONE &> /dev/null; then
    print_warning "VM instance does not exist. Creating new VM..."
    
    # Create VM instance
    gcloud compute instances create $VM_NAME \
        --zone=$ZONE \
        --machine-type=e2-micro \
        --image-family=debian-11 \
        --image-project=debian-cloud \
        --tags=http-server,https-server \
        --metadata=startup-script='#! /bin/bash
        # Install Node.js
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
        
        # Install PM2
        sudo npm install -g pm2
        
        # Install MySQL client
        sudo apt-get install -y mysql-client
        
        # Install Nginx
        sudo apt-get install -y nginx
        
        # Start Nginx
        sudo systemctl start nginx
        sudo systemctl enable nginx'
    
    print_status "VM instance created successfully"
    
    # Wait for VM to be ready
    print_status "Waiting for VM to be ready..."
    sleep 30
fi

# Create firewall rules if they don't exist
print_status "Setting up firewall rules..."

# HTTP
gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --target-tags=http-server \
    --source-ranges=0.0.0.0/0 \
    --description="Allow HTTP traffic" 2>/dev/null || print_warning "HTTP firewall rule already exists"

# HTTPS
gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --target-tags=https-server \
    --source-ranges=0.0.0.0/0 \
    --description="Allow HTTPS traffic" 2>/dev/null || print_warning "HTTPS firewall rule already exists"

# API
gcloud compute firewall-rules create allow-api \
    --allow tcp:3000 \
    --target-tags=http-server \
    --source-ranges=0.0.0.0/0 \
    --description="Allow API traffic" 2>/dev/null || print_warning "API firewall rule already exists"

# Upload code to VM
print_status "Uploading code to VM..."
gcloud compute scp --recurse ./backend $VM_NAME:~/ --zone=$ZONE

# SSH into VM and setup application
print_status "Setting up application on VM..."
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
    cd ~/backend
    
    # Install dependencies
    npm install
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        echo 'Creating .env file...'
        cp .env.example .env
        echo 'Please edit .env file with your database credentials'
    fi
    
    # Setup PM2
    pm2 delete luxshare-api 2>/dev/null || true
    pm2 start api-server.js --name 'luxshare-api'
    pm2 save
    pm2 startup
"

# Setup Nginx configuration
print_status "Setting up Nginx configuration..."
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
    sudo tee /etc/nginx/sites-available/luxshare > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    # Enable site
    sudo ln -sf /etc/nginx/sites-available/luxshare /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload Nginx
    sudo nginx -t
    sudo systemctl reload nginx
"

# Get VM external IP
EXTERNAL_IP=$(gcloud compute instances describe $VM_NAME --zone=$ZONE --format="value(networkInterfaces[0].accessConfigs[0].natIP)")

print_status "Deployment completed successfully!"
echo -e "${GREEN}🌐 Your application is now running at:${NC}"
echo -e "${BLUE}   http://$EXTERNAL_IP${NC}"
echo -e "${BLUE}   API Health Check: http://$EXTERNAL_IP/api/health${NC}"
echo -e "${BLUE}   Database Test: http://$EXTERNAL_IP/api/test-db${NC}"

echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Edit .env file on VM with your database credentials"
echo "2. Setup SSL certificate with Let's Encrypt"
echo "3. Configure your domain name"
echo "4. Test the application"

echo -e "${YELLOW}🔧 Useful commands:${NC}"
echo "SSH to VM: gcloud compute ssh $VM_NAME --zone=$ZONE"
echo "View logs: pm2 logs luxshare-api"
echo "Restart app: pm2 restart luxshare-api"
echo "View Nginx logs: sudo tail -f /var/log/nginx/access.log" 