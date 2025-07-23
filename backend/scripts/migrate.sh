#!/bin/bash

# Luxshare Interview Registration - Migration Script
# This script helps migrate between different Google Cloud accounts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to backup data from old account
backup_old_account() {
    local OLD_DB_HOST=$1
    local OLD_DB_USER=$2
    local OLD_DB_NAME=$3
    local BACKUP_FILE=$4
    
    print_info "Backing up data from old account..."
    
    # Create backup directory
    mkdir -p backups
    
    # Export data
    mysqldump -h "$OLD_DB_HOST" -u "$OLD_DB_USER" -p "$OLD_DB_NAME" > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        print_status "Backup completed: $BACKUP_FILE"
    else
        print_error "Backup failed"
        exit 1
    fi
}

# Function to setup new account
setup_new_account() {
    local NEW_PROJECT_ID=$1
    local NEW_VM_NAME=$2
    local NEW_ZONE=$3
    
    print_info "Setting up new Google Cloud account..."
    
    # Set new project
    gcloud config set project "$NEW_PROJECT_ID"
    
    # Create new VM if it doesn't exist
    if ! gcloud compute instances describe "$NEW_VM_NAME" --zone="$NEW_ZONE" &> /dev/null; then
        print_warning "Creating new VM instance..."
        gcloud compute instances create "$NEW_VM_NAME" \
            --zone="$NEW_ZONE" \
            --machine-type=e2-micro \
            --image-family=debian-11 \
            --image-project=debian-cloud \
            --tags=http-server,https-server
    fi
    
    # Create Cloud SQL instance
    print_info "Creating Cloud SQL instance..."
    gcloud sql instances create luxshare-db-new \
        --database-version=MYSQL_8_0 \
        --tier=db-f1-micro \
        --region=asia-southeast1 \
        --root-password=temp-password-123
    
    # Create database
    gcloud sql databases create luxshare_db --instance=luxshare-db-new
    
    # Create user
    gcloud sql users create luxshare_user \
        --instance=luxshare-db-new \
        --password=your-new-password
    
    print_status "New account setup completed"
}

# Function to restore data to new account
restore_new_account() {
    local NEW_DB_HOST=$1
    local NEW_DB_USER=$2
    local NEW_DB_NAME=$3
    local BACKUP_FILE=$4
    
    print_info "Restoring data to new account..."
    
    # Import data
    mysql -h "$NEW_DB_HOST" -u "$NEW_DB_USER" -p "$NEW_DB_NAME" < "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        print_status "Data restoration completed"
    else
        print_error "Data restoration failed"
        exit 1
    fi
}

# Function to update application configuration
update_config() {
    local NEW_DB_HOST=$1
    local NEW_DB_USER=$2
    local NEW_DB_PASSWORD=$3
    local NEW_VM_NAME=$4
    local NEW_ZONE=$5
    
    print_info "Updating application configuration..."
    
    # Create new .env file
    cat > .env << EOF
# Database Configuration (New Google Cloud SQL)
DB_HOST=$NEW_DB_HOST
DB_USER=$NEW_DB_USER
DB_PASSWORD=$NEW_DB_PASSWORD
DB_NAME=luxshare_db

# Server Configuration
PORT=3000
NODE_ENV=production
EOF
    
    # Upload to new VM
    gcloud compute scp --recurse ./backend "$NEW_VM_NAME":~/ --zone="$NEW_ZONE"
    
    # Restart application on new VM
    gcloud compute ssh "$NEW_VM_NAME" --zone="$NEW_ZONE" --command="
        cd ~/backend
        npm install
        pm2 delete luxshare-api 2>/dev/null || true
        pm2 start api-server.js --name 'luxshare-api'
        pm2 save
    "
    
    print_status "Configuration updated"
}

# Main migration function
migrate_account() {
    print_info "Starting migration process..."
    
    # Get old account details
    echo "Enter old account details:"
    read -p "Old DB Host: " OLD_DB_HOST
    read -p "Old DB User: " OLD_DB_USER
    read -p "Old DB Name: " OLD_DB_NAME
    
    # Get new account details
    echo "Enter new account details:"
    read -p "New Project ID: " NEW_PROJECT_ID
    read -p "New VM Name: " NEW_VM_NAME
    read -p "New Zone: " NEW_ZONE
    read -p "New DB Password: " NEW_DB_PASSWORD
    
    # Generate backup filename
    BACKUP_FILE="backups/luxshare_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Step 1: Backup old data
    backup_old_account "$OLD_DB_HOST" "$OLD_DB_USER" "$OLD_DB_NAME" "$BACKUP_FILE"
    
    # Step 2: Setup new account
    setup_new_account "$NEW_PROJECT_ID" "$NEW_VM_NAME" "$NEW_ZONE"
    
    # Get new DB host
    NEW_DB_HOST=$(gcloud sql instances describe luxshare-db-new --format="value(connectionName)")
    
    # Step 3: Restore data
    restore_new_account "$NEW_DB_HOST" "luxshare_user" "luxshare_db" "$BACKUP_FILE"
    
    # Step 4: Update configuration
    update_config "$NEW_DB_HOST" "luxshare_user" "$NEW_DB_PASSWORD" "$NEW_VM_NAME" "$NEW_ZONE"
    
    # Get new VM IP
    NEW_VM_IP=$(gcloud compute instances describe "$NEW_VM_NAME" --zone="$NEW_ZONE" --format="value(networkInterfaces[0].accessConfigs[0].natIP)")
    
    print_status "Migration completed successfully!"
    echo -e "${GREEN}🌐 New application URL: http://$NEW_VM_IP${NC}"
    echo -e "${GREEN}🔗 Health check: http://$NEW_VM_IP/api/health${NC}"
    echo -e "${GREEN}🗄️  Database test: http://$NEW_VM_IP/api/test-db${NC}"
}

# Show usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  migrate    - Migrate to new Google Cloud account"
    echo "  backup     - Backup current data only"
    echo "  restore    - Restore data to existing account"
    echo "  help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 migrate    # Full migration to new account"
    echo "  $0 backup     # Backup current data"
    echo "  $0 restore    # Restore from backup"
}

# Main script
case "$1" in
    "migrate")
        migrate_account
        ;;
    "backup")
        echo "Enter backup details:"
        read -p "DB Host: " DB_HOST
        read -p "DB User: " DB_USER
        read -p "DB Name: " DB_NAME
        BACKUP_FILE="backups/luxshare_backup_$(date +%Y%m%d_%H%M%S).sql"
        backup_old_account "$DB_HOST" "$DB_USER" "$DB_NAME" "$BACKUP_FILE"
        ;;
    "restore")
        echo "Enter restore details:"
        read -p "DB Host: " DB_HOST
        read -p "DB User: " DB_USER
        read -p "DB Name: " DB_NAME
        read -p "Backup File: " BACKUP_FILE
        restore_new_account "$DB_HOST" "$DB_USER" "$DB_NAME" "$BACKUP_FILE"
        ;;
    "help"|*)
        show_usage
        ;;
esac 