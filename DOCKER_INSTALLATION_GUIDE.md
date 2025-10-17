# 🐳 Docker Installation Guide

Complete guide for installing Docker and Docker Compose on all major operating systems.

---

## 📋 Table of Contents

1. [Ubuntu/Debian](#ubuntudebian)
2. [CentOS/RHEL/Fedora](#centosrhelfedora)
3. [macOS](#macos)
4. [Windows](#windows)
5. [Verification](#verification)
6. [Post-Installation Setup](#post-installation-setup)
7. [Troubleshooting](#troubleshooting)

---

## Ubuntu/Debian

### Quick Install (Recommended)

```bash
# Update package index
sudo apt update

# Install Docker using official script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (optional, for non-root access)
sudo usermod -aG docker $USER

# Logout and login again for group changes to take effect
```

### Manual Install (Ubuntu 22.04/24.04)

```bash
# Remove old versions (if any)
sudo apt remove docker docker-engine docker.io containerd runc

# Update package index
sudo apt update

# Install prerequisites
sudo apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
```

### Debian-Specific

For Debian, use the same steps but replace the repository setup with:

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

---

## CentOS/RHEL/Fedora

### CentOS/RHEL 8/9

```bash
# Remove old versions
sudo yum remove docker \
    docker-client \
    docker-client-latest \
    docker-common \
    docker-latest \
    docker-latest-logrotate \
    docker-logrotate \
    docker-engine

# Install yum-utils
sudo yum install -y yum-utils

# Add Docker repository
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
```

### Fedora

```bash
# Remove old versions
sudo dnf remove docker \
    docker-client \
    docker-client-latest \
    docker-common \
    docker-latest \
    docker-latest-logrotate \
    docker-logrotate \
    docker-engine

# Install dnf-plugins-core
sudo dnf -y install dnf-plugins-core

# Add Docker repository
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo

# Install Docker
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
```

---

## macOS

### Option 1: Docker Desktop (Recommended)

1. **Download Docker Desktop:**
   - Visit: https://www.docker.com/products/docker-desktop
   - Download for Mac (Intel or Apple Silicon)

2. **Install:**
   - Open the downloaded `.dmg` file
   - Drag Docker to Applications folder
   - Launch Docker from Applications

3. **Verify:**
   ```bash
   docker --version
   docker compose version
   ```

### Option 2: Homebrew

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Docker
brew install --cask docker

# Launch Docker Desktop from Applications
# Or use:
open /Applications/Docker.app
```

### Configuration

After installation:
1. Open Docker Desktop
2. Go to Settings/Preferences
3. Configure resources (CPU, Memory, Disk)
4. Enable Kubernetes (optional)

---

## Windows

### Option 1: Docker Desktop (Recommended)

1. **Prerequisites:**
   - Windows 10 64-bit: Pro, Enterprise, or Education (Build 19041 or higher)
   - OR Windows 11 64-bit
   - WSL 2 feature enabled

2. **Enable WSL 2:**
   ```powershell
   # Run in PowerShell as Administrator
   wsl --install
   
   # Or manually:
   dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
   dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
   
   # Restart computer
   
   # Set WSL 2 as default
   wsl --set-default-version 2
   ```

3. **Download and Install Docker Desktop:**
   - Visit: https://www.docker.com/products/docker-desktop
   - Download for Windows
   - Run installer
   - Follow installation wizard
   - Restart computer when prompted

4. **Configure WSL 2 Backend:**
   - Open Docker Desktop
   - Go to Settings → General
   - Check "Use WSL 2 based engine"
   - Apply & Restart

5. **Verify:**
   ```powershell
   docker --version
   docker compose version
   ```

### Option 2: Windows Server

For Windows Server 2019/2022:

```powershell
# Run in PowerShell as Administrator

# Install Docker
Install-Module -Name DockerMsftProvider -Force
Install-Package -Name docker -ProviderName DockerMsftProvider -Force

# Start Docker service
Start-Service docker

# Set to start automatically
Set-Service -Name docker -StartupType Automatic

# Verify
docker version
```

---

## Verification

### Check Docker Installation

```bash
# Check Docker version
docker --version
# Expected output: Docker version 24.x.x, build xxxxx

# Check Docker Compose version
docker compose version
# Expected output: Docker Compose version v2.x.x

# Run test container
docker run hello-world
# Should download and run successfully

# Check Docker info
docker info
# Shows system-wide information
```

### Check Docker Service Status

**Linux:**
```bash
sudo systemctl status docker
# Should show "active (running)"
```

**macOS/Windows:**
- Docker Desktop should show "Running" in system tray

---

## Post-Installation Setup

### 1. Non-Root Access (Linux)

**Add user to docker group:**
```bash
# Add current user
sudo usermod -aG docker $USER

# Verify group membership
groups $USER

# Apply changes (logout/login or)
newgrp docker

# Test without sudo
docker run hello-world
```

### 2. Configure Docker Daemon

**Create/edit daemon configuration:**
```bash
sudo nano /etc/docker/daemon.json
```

**Basic configuration:**
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "default-address-pools": [
    {
      "base": "172.17.0.0/16",
      "size": 24
    }
  ]
}
```

**Restart Docker:**
```bash
sudo systemctl restart docker
```

### 3. Enable Docker at Boot

**Linux:**
```bash
sudo systemctl enable docker
sudo systemctl enable containerd
```

### 4. Configure Resource Limits (Docker Desktop)

**macOS/Windows:**
1. Open Docker Desktop
2. Settings → Resources
3. Set CPU, Memory, Swap, Disk limits
4. Apply & Restart

### 5. Install Docker Compose (if not included)

**For older Docker versions:**
```bash
# Download latest version
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker-compose --version
```

---

## Troubleshooting

### Permission Denied Error

**Problem:**
```bash
docker: Got permission denied while trying to connect to the Docker daemon socket
```

**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again, or
newgrp docker

# If still not working, check socket permissions
sudo chmod 666 /var/run/docker.sock
```

### Docker Service Not Starting

**Linux:**
```bash
# Check service status
sudo systemctl status docker

# Check logs
sudo journalctl -u docker.service

# Restart service
sudo systemctl restart docker

# If fails, check daemon config
sudo dockerd --debug
```

### WSL 2 Issues (Windows)

**Problem:** WSL 2 installation failed or Docker can't use WSL 2

**Solution:**
```powershell
# Update WSL
wsl --update

# Check WSL version
wsl --list --verbose

# Set default to WSL 2
wsl --set-default-version 2

# Install Ubuntu distribution
wsl --install -d Ubuntu-22.04
```

### Port Already in Use

**Problem:** Container port conflicts

**Solution:**
```bash
# Find process using port
sudo lsof -i :8080
# or
sudo netstat -tulpn | grep :8080

# Stop conflicting service or use different port
docker run -p 8081:8080 myimage
```

### Disk Space Issues

**Check disk usage:**
```bash
docker system df
```

**Clean up:**
```bash
# Remove unused containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a --volumes
```

### Network Issues

**Reset Docker networks:**
```bash
# Remove all custom networks
docker network prune

# Restart Docker
sudo systemctl restart docker
```

### Cannot Connect to Docker Daemon

**macOS/Windows:**
- Ensure Docker Desktop is running
- Check system tray for Docker icon
- Restart Docker Desktop

**Linux:**
```bash
# Start Docker service
sudo systemctl start docker

# Check if socket exists
ls -la /var/run/docker.sock

# Check Docker daemon
ps aux | grep docker
```

---

## Quick Install Scripts

### Ubuntu/Debian One-Liner

```bash
curl -fsSL https://get.docker.com | sudo sh && sudo usermod -aG docker $USER && echo "Logout and login again to use Docker without sudo"
```

### CentOS/RHEL One-Liner

```bash
sudo yum install -y yum-utils && sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo && sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin && sudo systemctl start docker && sudo systemctl enable docker && sudo usermod -aG docker $USER
```

### Fedora One-Liner

```bash
sudo dnf -y install dnf-plugins-core && sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo && sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin && sudo systemctl start docker && sudo systemctl enable docker && sudo usermod -aG docker $USER
```

---

## Version-Specific Notes

### Docker Engine Versions

- **24.x** - Latest stable (recommended)
- **23.x** - Previous stable
- **20.10.x** - Older LTS

### Docker Compose Versions

- **v2.x** - Plugin version (recommended) - `docker compose`
- **v1.x** - Standalone version (deprecated) - `docker-compose`

**To use v2 syntax:**
```bash
# Old (v1)
docker-compose up

# New (v2)
docker compose up
```

---

## Additional Tools

### Portainer (Docker GUI)

```bash
# Create volume
docker volume create portainer_data

# Run Portainer
docker run -d \
  -p 9000:9000 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest

# Access at: http://localhost:9000
```

### Lazydocker (Terminal UI)

```bash
# Install
curl https://raw.githubusercontent.com/jesseduffield/lazydocker/master/scripts/install_update_linux.sh | bash

# Run
lazydocker
```

---

## Security Best Practices

### 1. Keep Docker Updated

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade docker-ce

# CentOS/RHEL
sudo yum update docker-ce
```

### 2. Use Rootless Mode (Advanced)

```bash
# Install rootless Docker
dockerd-rootless-setuptool.sh install

# Set socket path
export DOCKER_HOST=unix://$XDG_RUNTIME_DIR/docker.sock
```

### 3. Enable Content Trust

```bash
export DOCKER_CONTENT_TRUST=1
```

### 4. Scan Images for Vulnerabilities

```bash
docker scan myimage:latest
```

---

## Uninstallation

### Ubuntu/Debian

```bash
# Stop Docker
sudo systemctl stop docker

# Remove Docker packages
sudo apt purge docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Remove data
sudo rm -rf /var/lib/docker
sudo rm -rf /var/lib/containerd

# Remove group
sudo groupdel docker
```

### CentOS/RHEL/Fedora

```bash
# Stop Docker
sudo systemctl stop docker

# Remove packages
sudo yum remove docker-ce docker-ce-cli containerd.io

# Remove data
sudo rm -rf /var/lib/docker
sudo rm -rf /var/lib/containerd
```

### macOS

1. Open Docker Desktop
2. Click Docker icon in menu bar
3. Select "Troubleshoot" → "Uninstall"
4. Or delete from Applications folder

### Windows

1. Open Settings → Apps
2. Find Docker Desktop
3. Click Uninstall
4. Or use Control Panel → Uninstall a program

---

## Next Steps

After installing Docker:

1. ✅ Verify installation: `docker --version`
2. ✅ Test with hello-world: `docker run hello-world`
3. ✅ Configure non-root access (Linux)
4. ✅ Deploy Asset Management System:
   - See [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)
   - Or [CLOUD_DEPLOYMENT_GUIDE.md](CLOUD_DEPLOYMENT_GUIDE.md)

---

## Quick Reference

```bash
# Check version
docker --version
docker compose version

# Test installation
docker run hello-world

# Check service (Linux)
sudo systemctl status docker

# View containers
docker ps

# View images
docker images

# Clean up
docker system prune -a

# Get help
docker --help
docker compose --help
```

---

## Related Documentation

- **[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)** - Deploy with Docker Compose
- **[CLOUD_DEPLOYMENT_GUIDE.md](CLOUD_DEPLOYMENT_GUIDE.md)** - Cloud platform deployment
- **[DEPLOYMENT_QUICK_REFERENCE.md](DEPLOYMENT_QUICK_REFERENCE.md)** - Fast deployment guide

---

**🐳 Docker installation complete! Ready to deploy your application.**
