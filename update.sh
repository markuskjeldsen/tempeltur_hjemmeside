#!/bin/bash

# Navigate to the project directory
cd /root/tempeltur_hjemmeside/ || exit

# Discard local changes and reset to the latest commit from the remote repository
git reset --hard
git clean -f -d

# Pull the latest changes from Git
git pull

# Start Docker containers
docker compose up -d --build
