# Boxsmith — Vagrantfile Generator

> 📖 **คู่มือภาษาไทย:** [INSTALL_TH.md](INSTALL_TH.md) — คู่มือการติดตั้ง Vagrant และตั้งค่า Solution Active Directory ฉบับสมบูรณ์

A self-service web app that generates Vagrant configuration files through a visual UI.  
Pick a template, customize the spec, and download a ready-to-use `Vagrantfile` — no manual coding required.

## Live Demo

**[https://dekbacom.github.io/Vagrant-Generator-System/](https://dekbacom.github.io/Vagrant-Generator-System/)**

---

## How to Use

1. Open Boxsmith in your browser
2. Pick a **Template** from the left rail (Web Server, Database, Docker Host, Active Directory DC, etc.)
3. Customize: OS box, provider, CPU/RAM, network, port forwards, provisioners
4. The **Vagrantfile** preview on the right updates in real-time
5. Click **Download** (or press `Ctrl+D` / `⌘D`) to save the file
6. Place the `Vagrantfile` in a folder and run `vagrant up`

---

## Installing Vagrant

### Step 1 — Install a Hypervisor (Provider)

Vagrant needs a hypervisor to create VMs. Choose one:

#### VirtualBox — free, works on Windows / macOS / Linux

Download from **[virtualbox.org/wiki/Downloads](https://www.virtualbox.org/wiki/Downloads)**

#### Hyper-V — built into Windows 10/11 Pro and Server

Enable via PowerShell (run as Administrator):
```powershell
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
# Restart when prompted
```

#### VMware Desktop

Requires VMware Workstation Pro or Fusion **plus** the
[Vagrant VMware Utility](https://developer.hashicorp.com/vagrant/docs/providers/vmware/vagrant-vmware-utility).

---

### Step 2 — Install Vagrant

#### Windows

1. Download the `.msi` from **[developer.hashicorp.com/vagrant/downloads](https://developer.hashicorp.com/vagrant/downloads)**
2. Run the installer and follow the wizard
3. Restart your terminal (or reboot)
4. Confirm: `vagrant --version`

#### macOS (Homebrew)

```bash
brew tap hashicorp/tap
brew install hashicorp/tap/vagrant
vagrant --version
```

Or download the `.dmg` from the HashiCorp downloads page.

#### Linux — Debian / Ubuntu

```bash
wget -O- https://apt.releases.hashicorp.com/gpg \
  | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] \
  https://apt.releases.hashicorp.com $(lsb_release -cs) main" \
  | sudo tee /etc/apt/sources.list.d/hashicorp.list

sudo apt update && sudo apt install vagrant
vagrant --version
```

#### Linux — RHEL / CentOS / Rocky Linux

```bash
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://rpm.releases.hashicorp.com/RHEL/hashicorp.repo
sudo yum install vagrant
vagrant --version
```

---

### Step 3 — Start Your VM

```bash
# Create a working directory and copy your Vagrantfile into it
mkdir my-vm && cd my-vm

# Start the VM (downloads the box on first run)
vagrant up

# SSH into the VM (Linux / macOS guests)
vagrant ssh

# Stop the VM without destroying it
vagrant halt

# Destroy the VM completely
vagrant destroy
```

---

## Templates

| Template | OS | Provider | vCPU | RAM | Default Ports |
|---|---|---|---|---|---|
| Basic Blank VM | Ubuntu 22.04 | VirtualBox | 2 | 2 GB | — |
| Web Server | Ubuntu 22.04 | VirtualBox | 2 | 2 GB | 80→8080, 443→8443 |
| Database Server | Ubuntu 22.04 | VirtualBox | 4 | 4 GB | 5432→15432 |
| Docker Host | Ubuntu 24.04 | VirtualBox | 4 | 8 GB | 2375→12375 |
| CI Runner | Debian 12 | VirtualBox | 6 | 8 GB | — |
| Windows Test Bench | Windows Server 2022 | Hyper-V | 4 | 8 GB | 3389→13389 |
| **Active Directory DC** | Windows Server 2022 | Hyper-V | 4 | 8 GB | 3389, 389, 636 |
| **AD DS + Windows Client** ⭐ | WS2022 + Win10 (2 VMs) | Hyper-V | 4+2 | 8+4 GB | 3389×2, 389, 636 |
| **AD DS + 2 Windows Clients** ⭐ | WS2022 + Win10 × 2 (3 VMs) | Hyper-V | 4+2+2 | 8+4+4 GB | 3389×3, 389, 636 |
| **WS2025 AD + DHCP + Win11** ⭐ | WS2025 × 2 + Win11 × 2 (4 VMs) | Hyper-V | 4+2+2+2 | 8+4+4+4 GB | 3389×4, 389, 636 |

---

## Active Directory Provisioner

The **Active Directory Domain Services** provisioner automates the full DC promotion on a Windows Server 2022 guest.

### What it does

| Step | Action |
|---|---|
| 1 | Installs the `AD-Domain-Services` Windows Feature with management tools |
| 2 | Imports the `ADDSDeployment` PowerShell module |
| 3 | Promotes the server to a Domain Controller for domain `lab.local` |
| 4 | Configures integrated DNS |

### Requirements

- Use the **Active Directory DC** template (Windows Server 2022 + Hyper-V)
- Host machine must have **Hyper-V enabled**
- Minimum **4 vCPU / 8 GB RAM** on the host

### Generated Vagrantfile snippet

```ruby
config.vm.provision "shell", name: "Active Directory Domain Services", inline: <<-SHELL
    Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools
    Import-Module ADDSDeployment
    Install-ADDSForest -DomainName "lab.local" -DomainNetbiosName "LAB" `
      -InstallDns:$true -Force:$true `
      -SafeModeAdministratorPassword (ConvertTo-SecureString "P@ssword123!" -AsPlainText -Force)
  SHELL
```

> **Security:** Change the `SafeModeAdministratorPassword` before using in any shared or production environment. Boxsmith never bakes credentials permanently — customize the downloaded file before committing it to version control.

### Verify AD after `vagrant up`

```powershell
# Inside the VM (vagrant rdp or vagrant powershell)
Get-ADDomain
Get-Service ADWS, NTDS, DNS
```

### Join another VM to the domain

Add the following network and provisioner to a second VM's `Vagrantfile`:

```ruby
config.vm.provision "shell", inline: <<-SHELL
    $pass = ConvertTo-SecureString "vagrant" -AsPlainText -Force
    $cred = New-Object System.Management.Automation.PSCredential("LAB\\vagrant", $pass)
    Add-Computer -DomainName "lab.local" -Credential $cred -Restart -Force
  SHELL
```

---

## AD DS + 2 Windows Clients Solution

The **AD DS + 2 Windows Clients** solution template generates a ready-to-use multi-VM `Vagrantfile` with:

- **dc-01** — Windows Server 2022 Domain Controller (promotes to `lab.local`)
- **win-client-1** — Windows 10 client, auto-joins domain after DC is ready
- **win-client-2** — Windows 10 client, auto-joins domain after DC is ready

### Network layout

| VM | Private IP | RDP (host) | Notes |
|---|---|---|---|
| dc-01 | 192.168.56.70 | 13389 | LDAP 10389, LDAPS 10636 |
| win-client-1 | 192.168.56.71 | 13390 | — |
| win-client-2 | 192.168.56.72 | 13391 | — |

### Requirements

- **Hyper-V** enabled on the host (Windows 10/11 Pro or Server)
- At least **20 GB RAM** free on the host (DC: 8 GB, each client: 4 GB)
- At least **80 GB** free disk space

### Usage

```bash
# Start all three VMs (DC provisions first, clients join after DC reboots)
vagrant up

# Connect to the Domain Controller
vagrant rdp dc-01

# Connect to a Windows client
vagrant rdp win-client-1
vagrant rdp win-client-2

# Verify AD inside dc-01
Get-ADDomain
Get-ADComputer -Filter *

# Stop / destroy
vagrant halt
vagrant destroy
```

> **Security:** The generated `Vagrantfile` uses placeholder credentials. Change all passwords before committing to version control. Never store real credentials in source control.

---

## WS2025 AD + DHCP + Win11 Solution

The **WS2025 AD + DHCP + Win11** solution provisions a complete Windows Server 2025 lab with:

- **dc-01** — Windows Server 2025 Domain Controller (AD DS + DNS, domain `lab.local`)
- **dhcp-01** — Windows Server 2025 DHCP Server (joins domain, serves `192.168.56.100–200`)
- **win11-client-1** — Windows 11 Pro, auto-joins `lab.local`
- **win11-client-2** — Windows 11 Pro, auto-joins `lab.local`

### Network layout

| VM | Private IP | RDP (host) | Notes |
|---|---|---|---|
| dc-01 | 192.168.56.80 | 13389 | LDAP 10389, LDAPS 10636 |
| dhcp-01 | 192.168.56.81 | 13392 | DHCP scope 56.100–56.200 |
| win11-client-1 | 192.168.56.82 | 13390 | — |
| win11-client-2 | 192.168.56.83 | 13391 | — |

### Requirements

- **Hyper-V** enabled (Windows 10/11 Pro or Server)
- At least **20 GB RAM** free (DC: 8 GB, others: 4 GB each)

### Usage

```bash
vagrant up

# Connect
vagrant rdp dc-01
vagrant rdp dhcp-01
vagrant rdp win11-client-1

# Verify DHCP inside dc-01 or dhcp-01
Get-DhcpServerv4Scope
Get-DhcpServerv4Lease -ScopeId 192.168.56.0
```

> **Security:** Change all passwords before committing the downloaded Vagrantfile to version control.

---

## Provisioners Reference

| Provisioner | Platform | What it installs |
|---|---|---|
| Update package index | Linux | `apt-get update && upgrade` |
| Install Docker Engine | Linux | Docker CE + adds vagrant user to docker group |
| Install nginx | Linux | nginx, enabled on boot |
| Install Node.js 20 LTS | Linux | NodeSource Node.js 20 |
| Install PostgreSQL 16 | Linux | PostgreSQL 16, enabled on boot |
| Install Redis | Linux | Redis server, enabled on boot |
| Install git + build tools | Linux | git, build-essential |
| Enable UFW firewall | Linux | UFW with ports 22 and 80 open |
| **Active Directory DS** | **Windows** | AD DS role, DNS, promotes to DC |

---

## Features

- Real-time Vagrantfile preview with Ruby syntax highlighting
- Diff-flash animation highlights changed lines as you type
- 7 starter templates covering common dev/ops use cases
- Inline validation (hostname regex, port range, IP format, CPU/RAM bounds)
- Download writes a proper `Vagrantfile` (no extension) via browser Blob API
- Copy to clipboard button
- `Ctrl+D` / `⌘D` keyboard shortcut for download
- Tweaks panel: dark/light theme, accent colors (amber/ember/mint/iris), preview position, density
- Fully client-side — no backend, no data collection, works offline after first load

## Phase 2 Roadmap

- Save & share template links
- Ansible Playbook provisioner integration
- Cloud provider support (Azure, AWS via Vagrant plugins)
- Live Vagrant Cloud API box search
