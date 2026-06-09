#!/usr/bin/env bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Separator
SEP="────────────────────────────────────────────────────────────"

# Check if running as root
if [ $(id -u) -ne 0 ]; then
    printf "${YELLOW}[!] Not running as root - some files may be inaccessible${NC}\n\n"
    sleep 1
fi

print_banner() {
    printf "${CYAN}"
    printf "╔════════════════════════════════════════════════════════╗\n"
    printf "║                 Linux Creds Hunter                     ║\n"
    printf "╚════════════════════════════════════════════════════════╝\n"
    printf "${NC}\n"
}

print_section() {
    printf "\n${GREEN}${SEP}${NC}\n"
    printf "${GREEN}[*] $1${NC}\n"
    printf "${GREEN}${SEP}${NC}\n"
    sleep 1
}

print_found() {
    printf "${YELLOW}[+] $1${NC}\n"
}

print_error() {
    printf "${RED}[-] $1${NC}\n"
}

print_banner

# Histories
print_section "Histories"
printf "${CYAN}Checking bash, zsh, mysql, psql histories...${NC}\n\n"
cat ~/.bash_history ~/.zsh_history ~/.mysql_history ~/.psql_history 2>/dev/null
find /home -name ".*_history" -exec cat {} \; 2>/dev/null
sleep 2

# SSH keys
print_section "SSH Keys"
printf "${CYAN}Looking for SSH private keys and authorized keys...${NC}\n\n"
cat ~/.ssh/id_rsa ~/.ssh/authorized_keys 2>/dev/null
find /home -name "id_rsa" -o -name "*.pem" -o -name "*.ppk" 2>/dev/null | while read key; do
    print_found "SSH key: $key"
    cat "$key" 2>/dev/null
done
sleep 2

# Web configs
print_section "Web Configurations"
printf "${CYAN}Searching for .env, wp-config.php, config.php...${NC}\n\n"
find /var/www /var/www/html /home -name ".env" -o -name "wp-config.php" -o -name "config.php" -o -name "database.yml" -o -name "secrets.yml" 2>/dev/null | while read config; do
    print_found "Config: $config"
    grep -iE "pass|secret|key|token|DB_" "$config" 2>/dev/null | grep -v "^#"
    printf "\n"
done
sleep 2

# Backups & logs
print_section "Backups and Logs"
printf "${CYAN}Checking backup directories and logs...${NC}\n\n"
ls -la /var/backups/ /var/log/ /var/mail/ /home/*/backup* /tmp/*backup* 2>/dev/null
printf "\n${CYAN}Grepping for sensitive data in logs (first 50 matches)...${NC}\n\n"
grep -r -iE 'api|key|pass|user|secret|token|DB_' /var/www /home/* /var/log 2>/dev/null | grep -v ".log:" | head -50
sleep 2

# Config files
print_section "Configuration Files"
printf "${CYAN}Looking for .conf, .config, .cnf, .ini, .yml, .yaml, .json, .xml files...${NC}\n\n"
for ext in conf config cnf ini yml yaml json xml; do
    find / -name "*.$ext" 2>/dev/null | grep -v "lib\|fonts\|share\|core\|node_modules" | head -10
done
sleep 2

# Passwords in configs (extended patterns)
print_section "Credentials in Configuration Files"
printf "${CYAN}Grepping for credentials in configs...${NC}\n\n"
for i in $(find / -name "*.conf" -o -name "*.config" -o -name "*.cnf" -o -name "*.ini" -o -name "*.yml" -o -name "*.yaml" -o -name "*.json" 2>/dev/null | grep -v "doc\|lib\|fonts\|share\|node_modules" | head -30); do
    printf "${YELLOW}→ $i${NC}\n"
    grep -iE "user|username|password|pass|secret|key|token|api[_-]?key|client[_-]?secret|access[_-]?token|github[_-]?token|slack[_-]?token|aws[_-]?key|private[_-]?key" "$i" 2>/dev/null | grep -v "^#\|;\|//"
    printf "\n"
done
sleep 2

# Cloud credentials (AWS, Azure, GCP)
print_section "Cloud Credentials"
printf "${CYAN}Checking for cloud provider credentials...${NC}\n\n"

# AWS
if [ -f ~/.aws/credentials ]; then
    print_found "AWS credentials found"
    cat ~/.aws/credentials 2>/dev/null
fi

# Azure
if [ -f ~/.azure/accessTokens.json ]; then
    print_found "Azure tokens found"
    cat ~/.azure/accessTokens.json 2>/dev/null
fi

# GCP
if [ -f ~/.config/gcloud/credentials.db ]; then
    print_found "GCP credentials found"
    ls -la ~/.config/gcloud/credentials.db 2>/dev/null
fi

# Find cloud creds in home dirs
find /home -name ".aws" -type d 2>/dev/null | while read awsdir; do
    print_found "AWS directory: $awsdir"
    cat "$awsdir/credentials" 2>/dev/null
done
find /home -name ".azure" -type d 2>/dev/null | while read azuredir; do
    print_found "Azure directory: $azuredir"
done
find /home -name ".config" -type d 2>/dev/null | while read configdir; do
    if [ -f "$configdir/gcloud/credentials.db" ]; then
        print_found "GCP credentials: $configdir/gcloud/credentials.db"
    fi
done
sleep 2

# Databases
print_section "Database Files"
printf "${CYAN}Searching for SQLite and other database files...${NC}\n\n"
for ext in sql db sqlite sqlite3 db3; do
    find /home /var/www /tmp -name "*.$ext" 2>/dev/null | grep -v "doc\|lib\|headers\|share" | while read db; do
        print_found "Database: $db"
        file "$db" 2>/dev/null
        if command -v sqlite3 &>/dev/null && file "$db" | grep -qi sqlite; then
            printf "${CYAN}  Tables:${NC}\n"
            sqlite3 "$db" ".tables" 2>/dev/null
        fi
    done
done
sleep 2

# Running processes
print_section "Running Processes"
printf "${CYAN}Checking processes for potential credentials...${NC}\n\n"
ps aux | grep -iE "pass|secret|token|key|DB_" | grep -v "grep\|ps aux"
sleep 2

# Environment variables
print_section "Environment Variables"
printf "${CYAN}Checking environment variables...${NC}\n\n"
env | grep -iE "pass|secret|token|key|DB_" 2>/dev/null
sleep 2

# World-readable files with creds
print_section "World-Readable Files with Creds"
printf "${CYAN}Finding world-readable files containing sensitive data...${NC}\n\n"
find /home /var/www -type f -perm -o+r 2>/dev/null | xargs grep -l -iE "password|passwd|secret|token" 2>/dev/null | head -20
sleep 2

# Sudo privileges
print_section "Sudo Privileges"
printf "${CYAN}Checking sudo -l (if available)...${NC}\n\n"
if command -v sudo &>/dev/null; then
    sudo -l 2>/dev/null
else
    print_error "sudo not available"
fi
sleep 1

# Done
printf "\n${GREEN}${SEP}${NC}\n"
printf "${GREEN}[✓] Creds hunting completed${NC}\n"
printf "${GREEN}${SEP}${NC}\n"