# Boxsmith — Vagrantfile Generator

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
