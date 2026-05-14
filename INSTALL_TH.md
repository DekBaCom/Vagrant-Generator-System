# คู่มือการติดตั้งและตั้งค่า Vagrant

> **Boxsmith — Vagrantfile Generator**
> คู่มือฉบับภาษาไทย สำหรับนักพัฒนา, DevOps, และ QA ที่ต้องการสร้าง Virtual Machine ด้วย Vagrant อย่างรวดเร็ว

---

## สารบัญ

1. [ข้อกำหนดของระบบ](#1-ข้อกำหนดของระบบ)
2. [ติดตั้ง Hypervisor](#2-ติดตั้ง-hypervisor)
   - [VirtualBox (แนะนำ)](#virtualbox-แนะนำ)
   - [Hyper-V (Windows)](#hyper-v-windows)
3. [ติดตั้ง Vagrant](#3-ติดตั้ง-vagrant)
   - [Windows](#windows)
   - [macOS](#macos)
   - [Linux](#linux)
4. [ใช้งาน Boxsmith](#4-ใช้งาน-boxsmith)
5. [คำสั่ง Vagrant พื้นฐาน](#5-คำสั่ง-vagrant-พื้นฐาน)
6. [Solution: AD DS + Windows Client (2 VMs)](#6-solution-ad-ds--windows-client-2-vms)
7. [Solution: AD DS + 2 Windows Clients (3 VMs)](#7-solution-ad-ds--2-windows-clients-3-vms)
8. [Solution: WS2025 AD + DHCP + Win11 (4 VMs)](#8-solution-ws2025-ad--dhcp--win11-4-vms)
9. [Template: Windows 11 Desktop](#9-template-windows-11-desktop)
10. [แก้ปัญหาที่พบบ่อย](#10-แก้ปัญหาที่พบบ่อย)

---

## 1. ข้อกำหนดของระบบ

| รายการ | ขั้นต่ำ | แนะนำ |
|---|---|---|
| OS | Windows 10 / macOS 12 / Ubuntu 20.04 | Windows 11 / macOS 14 / Ubuntu 22.04 |
| RAM | 8 GB | 16 GB ขึ้นไป |
| พื้นที่ดิสก์ | 20 GB | 50 GB ขึ้นไป (SSD) |
| CPU | 4 core + Virtualization (VT-x/AMD-V) | 8 core |
| Network | อินเทอร์เน็ตสำหรับดาวน์โหลด Box | — |

> **หมายเหตุ:** ต้องเปิดใช้งาน **Hardware Virtualization (VT-x / AMD-V)** ใน BIOS/UEFI

### ตรวจสอบ Virtualization บน Windows

เปิด Task Manager → แท็บ **Performance** → CPU → ดูที่ **Virtualization: Enabled**

---

## 2. ติดตั้ง Hypervisor

Vagrant ต้องการ Hypervisor สำหรับรัน Virtual Machine เลือกอย่างใดอย่างหนึ่ง

### VirtualBox (แนะนำ)

ฟรี รองรับ Windows / macOS / Linux

1. ดาวน์โหลดจาก [virtualbox.org/wiki/Downloads](https://www.virtualbox.org/wiki/Downloads)
2. เลือก Platform Package ที่ตรงกับ OS ของคุณ
3. รันไฟล์ติดตั้งและทำตามขั้นตอน
4. รีสตาร์ทเครื่องหลังติดตั้ง

**ตรวจสอบการติดตั้ง:**
```bash
VBoxManage --version
# ตัวอย่าง: 7.0.14r161095
```

---

### Hyper-V (Windows)

Hyper-V มาพร้อม Windows 10/11 Pro, Enterprise, Education และ Windows Server

**เปิดใช้งาน Hyper-V ผ่าน PowerShell** (Run as Administrator):

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
# รีสตาร์ทเครื่องเมื่อระบบถาม
```

**หรือเปิดผ่าน GUI:**
1. กด `Win + R` → พิมพ์ `optionalfeatures` → Enter
2. ติ๊กถูก **Hyper-V** → OK → รีสตาร์ท

> **ข้อควรระวัง:** Hyper-V และ VirtualBox ไม่สามารถทำงานพร้อมกันบนระบบเดียวกันได้ในบางกรณี
> หากใช้ Windows 11 build 22H2 ขึ้นไป สามารถรันทั้งสองพร้อมกันได้

**ตรวจสอบ Hyper-V:**
```powershell
Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V
# Status : Enabled
```

---

## 3. ติดตั้ง Vagrant

### Windows

1. เข้าไปที่ [developer.hashicorp.com/vagrant/downloads](https://developer.hashicorp.com/vagrant/downloads)
2. ดาวน์โหลด **Windows AMD64** (`.msi`)
3. ดับเบิลคลิกไฟล์ `.msi` และทำตามขั้นตอน
4. **รีสตาร์ท Terminal** (หรือรีบูตเครื่อง)
5. ตรวจสอบ:

```powershell
vagrant --version
# Vagrant 2.4.x
```

---

### macOS

**วิธีที่ 1 — Homebrew (แนะนำ):**

```bash
brew tap hashicorp/tap
brew install hashicorp/tap/vagrant
vagrant --version
```

**วิธีที่ 2 — ดาวน์โหลด DMG:**
1. ดาวน์โหลด `.dmg` จากหน้า HashiCorp downloads
2. เปิดไฟล์และลากไปยัง Applications (หรือรันตัวติดตั้ง)
3. ตรวจสอบ:

```bash
vagrant --version
```

---

### Linux

#### Debian / Ubuntu

```bash
# เพิ่ม HashiCorp GPG key
wget -O- https://apt.releases.hashicorp.com/gpg \
  | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg

# เพิ่ม Repository
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] \
  https://apt.releases.hashicorp.com $(lsb_release -cs) main" \
  | sudo tee /etc/apt/sources.list.d/hashicorp.list

# ติดตั้ง
sudo apt update && sudo apt install vagrant -y
vagrant --version
```

#### RHEL / CentOS / Rocky Linux / AlmaLinux

```bash
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://rpm.releases.hashicorp.com/RHEL/hashicorp.repo
sudo yum install vagrant -y
vagrant --version
```

---

## 4. ใช้งาน Boxsmith

**Boxsmith** คือเว็บแอปสำหรับสร้าง Vagrantfile ด้วย UI แบบ Visual

🌐 **[https://dekbacom.github.io/Vagrant-Generator-System/](https://dekbacom.github.io/Vagrant-Generator-System/)**

### ขั้นตอนการใช้งาน

```
┌─────────────────────────────────────────────────────────────────┐
│  1. เปิด Boxsmith ใน Browser                                     │
│  2. เลือก Template จาก Rail ด้านซ้าย                             │
│     (Web Server / Database / Docker / Active Directory / etc.)   │
│  3. ปรับแต่งค่าต่างๆ ในฟอร์มกลาง                                 │
│     - OS Box, Provider, CPU/RAM, Network, Port Forwarding        │
│     - Synced Folder, Provisioners                                │
│  4. ดู Preview Vagrantfile แบบ Real-time ทางขวา                  │
│  5. กด Download หรือ Ctrl+D เพื่อดาวน์โหลดไฟล์                  │
└─────────────────────────────────────────────────────────────────┘
```

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+D` / `⌘D` | Download Vagrantfile |

---

## 5. คำสั่ง Vagrant พื้นฐาน

หลังจากดาวน์โหลด Vagrantfile แล้ว ทำตามขั้นตอนนี้:

```bash
# สร้างโฟลเดอร์และวาง Vagrantfile
mkdir my-vm
cd my-vm
# (copy Vagrantfile มาวางในโฟลเดอร์นี้)

# เริ่มสร้าง VM (ดาวน์โหลด Box ในครั้งแรก)
vagrant up

# SSH เข้า VM (สำหรับ Linux/macOS guest)
vagrant ssh

# เชื่อมต่อผ่าน RDP (สำหรับ Windows guest)
vagrant rdp

# ดูสถานะ VM
vagrant status

# หยุด VM (ไม่ลบข้อมูล)
vagrant halt

# รีสตาร์ท VM
vagrant reload

# Provision ใหม่โดยไม่ต้องสร้าง VM ใหม่
vagrant provision

# ลบ VM ทิ้ง
vagrant destroy

# ดูรายการ VM ทั้งหมดในระบบ
vagrant global-status
```

### จัดการ Vagrant Boxes

```bash
# ดูรายการ Box ที่ดาวน์โหลดไว้แล้ว
vagrant box list

# เพิ่ม Box ล่วงหน้า
vagrant box add ubuntu/jammy64

# ลบ Box
vagrant box remove ubuntu/jammy64

# อัปเดต Box เป็นเวอร์ชันล่าสุด
vagrant box update
```

---

## 6. Solution: AD DS + Windows Client (2 VMs)

Solution นี้สร้าง **2 VM** พร้อมกัน:

| VM | Role | OS | IP |
|---|---|---|---|
| `dc-01` | Domain Controller | Windows Server 2022 | 192.168.56.70 |
| `win-client` | Windows 10 Client | Windows 10 | 192.168.56.71 |

### ข้อกำหนดก่อนเริ่ม

- ✅ Windows 10/11 Pro หรือ Windows Server (Host)
- ✅ เปิด **Hyper-V** แล้ว (ดูหัวข้อ 2)
- ✅ ติดตั้ง **Vagrant** แล้ว
- ✅ RAM อย่างน้อย **16 GB** (DC ใช้ 8 GB + Client ใช้ 4 GB)
- ✅ พื้นที่ดิสก์อย่างน้อย **25 GB** สำหรับ Windows boxes

### ขั้นตอนที่ 1 — สร้าง Vagrantfile

1. เปิด Boxsmith ที่ [https://dekbacom.github.io/Vagrant-Generator-System/](https://dekbacom.github.io/Vagrant-Generator-System/)
2. เลือก Template **"AD DS + Windows Client"** จาก Rail ซ้าย (อยู่ใต้ส่วน Solutions)
3. กด **Download** เพื่อดาวน์โหลด `Vagrantfile`

### ขั้นตอนที่ 2 — รัน Solution

```powershell
# สร้างโฟลเดอร์
mkdir C:\vagrant-lab
cd C:\vagrant-lab

# วาง Vagrantfile ที่ดาวน์โหลดมา แล้วรัน
vagrant up

# หรือสร้างทีละ VM
vagrant up dc-01        # สร้าง Domain Controller ก่อน
vagrant up win-client   # แล้วสร้าง Client
```

> **หมายเหตุ:** DC จะใช้เวลาประมาณ 10–20 นาทีในการ provision และ reboot หลัง AD install เสร็จ

### ขั้นตอนที่ 3 — ตรวจสอบ Domain Controller

```powershell
# เชื่อมต่อเข้า DC
vagrant rdp dc-01

# ใน DC VM — ตรวจสอบ AD DS
Get-ADDomain
Get-ADDomainController
Get-Service ADWS, NTDS, DNS | Select Name, Status
```

**ผลลัพธ์ที่ถูกต้อง:**
```
Name  Status
----  ------
ADWS  Running
NTDS  Running
DNS   Running
```

### ขั้นตอนที่ 4 — ตรวจสอบ Windows Client

```powershell
# เชื่อมต่อเข้า Client
vagrant rdp win-client

# ใน Client VM — ตรวจสอบว่า join domain สำเร็จ
(Get-WmiObject Win32_ComputerSystem).Domain
# ผลลัพธ์: lab.local
```

### โครงสร้าง Network

```
Host Machine
    │
    ├─ Hyper-V Virtual Switch
    │       │
    │       ├─ dc-01 (192.168.56.70)      ← Domain Controller
    │       │   ├─ AD DS / DNS
    │       │   └─ LDAP :389, LDAPS :636
    │       │
    │       └─ win-client (192.168.56.71) ← Windows 10 (joined to lab.local)
    │
    Port Forwarding:
    ├─ localhost:13389 → dc-01:3389       (RDP to DC)
    ├─ localhost:10389 → dc-01:389        (LDAP)
    ├─ localhost:10636 → dc-01:636        (LDAPS)
    └─ localhost:13390 → win-client:3389  (RDP to Client)
```

### ข้อมูล Domain (Default)

| รายการ | ค่า |
|---|---|
| Domain Name | `lab.local` |
| NetBIOS Name | `LAB` |
| Administrator | `LAB\Administrator` |
| Safe Mode Password | `P@ssword123!` |
| DC IP | `192.168.56.70` |
| Client IP | `192.168.56.71` |

> ⚠️ **เปลี่ยน Password** ทันทีหลังติดตั้ง อย่า commit Vagrantfile ที่มี Password จริงขึ้น Git

> 💡 ต้องการ **2 Client** พร้อมกันเลย? ดูหัวข้อ [7. Solution: AD DS + 2 Windows Clients](#7-solution-ad-ds--2-windows-clients-3-vms)

---

## 7. Solution: AD DS + 2 Windows Clients (3 VMs)

Solution นี้สร้าง **3 VM** พร้อมกัน — เหมาะสำหรับทดสอบ Group Policy, User Management และ Domain Services ในสภาพแวดล้อมจำลองที่สมจริงกว่า

| VM | Role | OS | IP | RDP Port (Host) |
|---|---|---|---|---|
| `dc-01` | Domain Controller | Windows Server 2022 | 192.168.56.70 | 13389 |
| `win-client-1` | Windows 10 Client 1 | Windows 10 | 192.168.56.71 | 13390 |
| `win-client-2` | Windows 10 Client 2 | Windows 10 | 192.168.56.72 | 13391 |

### ข้อกำหนดก่อนเริ่ม

- ✅ Windows 10/11 Pro หรือ Windows Server (Host)
- ✅ เปิด **Hyper-V** แล้ว (ดูหัวข้อ 2)
- ✅ ติดตั้ง **Vagrant** แล้ว
- ✅ RAM อย่างน้อย **20 GB** (DC 8 GB + Client-1 4 GB + Client-2 4 GB + Host ~4 GB)
- ✅ พื้นที่ดิสก์อย่างน้อย **40 GB** (WS2022 ~9 GB + Win10 ×2 ~7 GB ×2 + overhead)

### ขั้นตอนที่ 1 — สร้าง Vagrantfile

1. เปิด Boxsmith ที่ [https://dekbacom.github.io/Vagrant-Generator-System/](https://dekbacom.github.io/Vagrant-Generator-System/)
2. เลือก Template **"AD DS + 2 Windows Clients"** จาก Rail ซ้าย (ใต้หัวข้อ **Solutions**)
3. กด **Download** เพื่อดาวน์โหลด `Vagrantfile`

### ขั้นตอนที่ 2 — รัน Solution

```powershell
# สร้างโฟลเดอร์
mkdir C:\vagrant-lab-3vm
cd C:\vagrant-lab-3vm

# วาง Vagrantfile ที่ดาวน์โหลดมา แล้วรันทั้งหมดพร้อมกัน
vagrant up

# หรือสร้างตามลำดับ (แนะนำ — DC ต้องพร้อมก่อน Client join)
vagrant up dc-01
vagrant up win-client-1
vagrant up win-client-2
```

> **หมายเหตุ:** DC ใช้เวลา **10–20 นาที** สำหรับ provision และ reboot  
> Client แต่ละเครื่องใช้เวลา **5–10 นาที** สำหรับ join domain และ reboot

### ขั้นตอนที่ 3 — ตรวจสอบ Domain Controller

```powershell
vagrant rdp dc-01

# ใน DC VM
Get-ADDomain
Get-ADDomainController
Get-Service ADWS, NTDS, DNS | Select Name, Status

# ดูรายการ Computer ที่ join domain แล้ว
Get-ADComputer -Filter * | Select Name, DNSHostName
```

**ผลลัพธ์ที่ถูกต้อง (หลัง Client ทั้งสองเครื่อง join แล้ว):**
```
Name          DNSHostName
----          -----------
DC-01         dc-01.lab.local
WIN-CLIENT-1  win-client-1.lab.local
WIN-CLIENT-2  win-client-2.lab.local
```

### ขั้นตอนที่ 4 — ตรวจสอบ Windows Clients

```powershell
# Client 1
vagrant rdp win-client-1
(Get-WmiObject Win32_ComputerSystem).Domain   # lab.local
$env:COMPUTERNAME                              # WIN-CLIENT-1

# Client 2
vagrant rdp win-client-2
(Get-WmiObject Win32_ComputerSystem).Domain   # lab.local
$env:COMPUTERNAME                              # WIN-CLIENT-2
```

### โครงสร้าง Network

```
Host Machine (Windows + Hyper-V)
    │
    ├─ Hyper-V Virtual Switch (192.168.56.0/24)
    │       │
    │       ├─ dc-01          (192.168.56.70)  ← Domain Controller
    │       │   ├─ AD DS, DNS, LDAP
    │       │   └─ Port: 3389, 389, 636
    │       │
    │       ├─ win-client-1   (192.168.56.71)  ← Windows 10 (joined lab.local)
    │       │   └─ Port: 3389
    │       │
    │       └─ win-client-2   (192.168.56.72)  ← Windows 10 (joined lab.local)
    │           └─ Port: 3389
    │
    Port Forwarding (Host → Guest):
    ├─ localhost:13389 → dc-01:3389         (RDP to DC)
    ├─ localhost:10389 → dc-01:389          (LDAP)
    ├─ localhost:10636 → dc-01:636          (LDAPS)
    ├─ localhost:13390 → win-client-1:3389  (RDP to Client 1)
    └─ localhost:13391 → win-client-2:3389  (RDP to Client 2)
```

### ข้อมูล Domain (Default)

| รายการ | ค่า |
|---|---|
| Domain Name | `lab.local` |
| NetBIOS Name | `LAB` |
| Administrator | `LAB\Administrator` |
| Safe Mode Password | `P@ssword123!` |
| DC IP | `192.168.56.70` |
| Client 1 IP | `192.168.56.71` |
| Client 2 IP | `192.168.56.72` |

> ⚠️ **เปลี่ยน Password** ทันทีหลังติดตั้ง อย่า commit Vagrantfile ที่มี Password จริงขึ้น Git

### คำสั่งจัดการ Multi-VM

```powershell
# ดูสถานะ VM ทั้งหมด
vagrant status

# หยุดเฉพาะ Client
vagrant halt win-client-1 win-client-2

# หยุด VM ทั้งหมด
vagrant halt

# รีสตาร์ท Client เครื่องที่ 2 พร้อม provision ใหม่
vagrant reload win-client-2 --provision

# ลบ VM ทั้งหมด
vagrant destroy -f

# ลบเฉพาะ Client
vagrant destroy win-client-1 win-client-2 -f
```

### สิ่งที่ทำได้เพิ่มเติมใน Lab นี้

| Use Case | คำอธิบาย |
|---|---|
| Group Policy | สร้าง GPO บน DC และ apply กับ Client ทั้งสองเครื่อง |
| User Management | สร้าง AD User แล้ว login เข้า Client ด้วย Domain Account |
| File Server | เพิ่ม File Server role บน DC และ map network drive จาก Client |
| DNS Testing | ทดสอบ name resolution ระหว่าง VM ด้วยชื่อ hostname |
| LDAP Integration | ทดสอบ LDAP query จาก Client ไปยัง DC ผ่าน port 389 |

---

## 8. Solution: WS2025 AD + DHCP + Win11 (4 VMs)

Solution นี้สร้าง **4 VM** พร้อมกันบน **Windows Server 2025** — เหมาะสำหรับ Lab ที่ต้องการทดสอบ DHCP, DNS, Group Policy และ Domain Services ในระดับ Enterprise

| VM | Role | OS | IP | RDP Port (Host) |
|---|---|---|---|---|
| `dc-01` | Domain Controller (AD DS + DNS) | Windows Server 2025 | 192.168.56.80 | 13389 |
| `dhcp-01` | DHCP Server | Windows Server 2025 | 192.168.56.81 | 13392 |
| `win11-client-1` | Windows 11 Pro Client 1 | Windows 11 Pro | 192.168.56.82 | 13390 |
| `win11-client-2` | Windows 11 Pro Client 2 | Windows 11 Pro | 192.168.56.83 | 13391 |

### ข้อกำหนดก่อนเริ่ม

- ✅ Windows 10/11 Pro หรือ Windows Server (Host)
- ✅ เปิด **Hyper-V** แล้ว (ดูหัวข้อ 2)
- ✅ ติดตั้ง **Vagrant** แล้ว
- ✅ RAM อย่างน้อย **24 GB** (DC 8 GB + DHCP 4 GB + Client × 2 = 4 GB × 2 + Host ~4 GB)
- ✅ พื้นที่ดิสก์อย่างน้อย **50 GB** (WS2025 ~9 GB × 2 + Win11 ~8 GB × 2 + overhead)

### ขั้นตอนที่ 1 — สร้าง Vagrantfile

1. เปิด Boxsmith ที่ [https://dekbacom.github.io/Vagrant-Generator-System/](https://dekbacom.github.io/Vagrant-Generator-System/)
2. เลือก Template **"WS2025 AD + DHCP + Win11"** จาก Rail ซ้าย (ใต้หัวข้อ **Solutions**)
3. คลิกแต่ละ VM เพื่อปรับแต่งค่า (CPU, RAM, IP, Ports) ได้ตามต้องการ
4. กด **Download** เพื่อดาวน์โหลด `Vagrantfile`

### ขั้นตอนที่ 2 — รัน Solution

```powershell
# สร้างโฟลเดอร์
mkdir C:\vagrant-ws2025-lab
cd C:\vagrant-ws2025-lab

# วาง Vagrantfile ที่ดาวน์โหลดมา แล้วรัน DC ก่อน
vagrant up dc-01

# รอ DC reboot เสร็จสมบูรณ์ (~15–20 นาที) แล้วค่อยสร้างที่เหลือ
vagrant up dhcp-01
vagrant up win11-client-1
vagrant up win11-client-2

# หรือรันทั้งหมดพร้อมกัน (Vagrant จะรัน DC ก่อนตามลำดับใน Vagrantfile)
vagrant up
```

> **หมายเหตุ:** DC ต้องพร้อมก่อน เพราะ `dhcp-01` และ `win11-client` ต้อง join domain

### ขั้นตอนที่ 3 — ตรวจสอบ Domain Controller

```powershell
vagrant rdp dc-01

# ใน dc-01 VM
Get-ADDomain
Get-ADDomainController
Get-Service ADWS, NTDS, DNS | Select Name, Status

# ดูรายการ Computer ทั้งหมดที่ join domain
Get-ADComputer -Filter * | Select Name, DNSHostName
```

**ผลลัพธ์ที่ถูกต้อง (หลัง VM ทั้งหมดพร้อม):**
```
Name             DNSHostName
----             -----------
DC-01            dc-01.lab.local
DHCP-01          dhcp-01.lab.local
WIN11-CLIENT-1   win11-client-1.lab.local
WIN11-CLIENT-2   win11-client-2.lab.local
```

### ขั้นตอนที่ 4 — ตรวจสอบ DHCP Server

```powershell
vagrant rdp dhcp-01

# ใน dhcp-01 VM — ตรวจสอบ DHCP service
Get-Service DHCPServer | Select Name, Status

# ดู DHCP Scope ที่ตั้งค่าไว้
Get-DhcpServerv4Scope

# ดู IP Lease ที่แจกไปแล้ว
Get-DhcpServerv4Lease -ScopeId 192.168.56.0

# ตรวจสอบว่า DHCP ถูก Authorize ใน AD แล้ว
Get-DhcpServerInDC
```

**ผลลัพธ์ที่ถูกต้อง:**
```
ScopeId        Name       State  StartRange       EndRange
-------        ----       -----  ----------       --------
192.168.56.0   Lab Scope  Active 192.168.56.100   192.168.56.200
```

### ขั้นตอนที่ 5 — ตรวจสอบ Windows 11 Clients

```powershell
# Client 1
vagrant rdp win11-client-1

# ใน win11-client-1 VM
(Get-WmiObject Win32_ComputerSystem).Domain   # lab.local
$env:COMPUTERNAME                              # WIN11-CLIENT-1
ipconfig /all                                  # ดู IP ที่ได้รับจาก DHCP

# Client 2
vagrant rdp win11-client-2
(Get-WmiObject Win32_ComputerSystem).Domain   # lab.local
```

### โครงสร้าง Network

```
Host Machine (Windows + Hyper-V)
    │
    ├─ Hyper-V Virtual Switch (192.168.56.0/24)
    │       │
    │       ├─ dc-01          (192.168.56.80)  ← Domain Controller
    │       │   ├─ AD DS, DNS
    │       │   └─ Port: 3389, 389, 636
    │       │
    │       ├─ dhcp-01        (192.168.56.81)  ← DHCP Server (joined lab.local)
    │       │   ├─ DHCP Scope: 192.168.56.100–200
    │       │   └─ Port: 3389
    │       │
    │       ├─ win11-client-1 (192.168.56.82)  ← Windows 11 Pro (joined lab.local)
    │       │   └─ Port: 3389
    │       │
    │       └─ win11-client-2 (192.168.56.83)  ← Windows 11 Pro (joined lab.local)
    │           └─ Port: 3389
    │
    Port Forwarding (Host → Guest):
    ├─ localhost:13389 → dc-01:3389           (RDP to DC)
    ├─ localhost:10389 → dc-01:389            (LDAP)
    ├─ localhost:10636 → dc-01:636            (LDAPS)
    ├─ localhost:13392 → dhcp-01:3389         (RDP to DHCP Server)
    ├─ localhost:13390 → win11-client-1:3389  (RDP to Client 1)
    └─ localhost:13391 → win11-client-2:3389  (RDP to Client 2)
```

### ข้อมูล Domain (Default)

| รายการ | ค่า |
|---|---|
| Domain Name | `lab.local` |
| NetBIOS Name | `LAB` |
| Administrator | `LAB\Administrator` |
| Safe Mode Password | `P@ssword123!` |
| DC IP | `192.168.56.80` |
| DHCP Server IP | `192.168.56.81` |
| Client 1 IP | `192.168.56.82` |
| Client 2 IP | `192.168.56.83` |
| DHCP Scope | `192.168.56.100 – 192.168.56.200` |
| DNS Server | `192.168.56.80` |

> ⚠️ **เปลี่ยน Password** ทันทีหลังติดตั้ง อย่า commit Vagrantfile ที่มี Password จริงขึ้น Git

### คำสั่งจัดการ Multi-VM

```powershell
# ดูสถานะ VM ทั้งหมด
vagrant status

# หยุดเฉพาะ Client ทั้งสอง
vagrant halt win11-client-1 win11-client-2

# หยุด VM ทั้งหมด
vagrant halt

# รีสตาร์ท DHCP Server พร้อม provision ใหม่
vagrant reload dhcp-01 --provision

# ลบ VM ทั้งหมด
vagrant destroy -f

# ลบเฉพาะ Client
vagrant destroy win11-client-1 win11-client-2 -f
```

### สิ่งที่ทำได้เพิ่มเติมใน Lab นี้

| Use Case | คำอธิบาย |
|---|---|
| DHCP Management | บริหาร IP Scope, Exclusion, Reservation ผ่าน DHCP Server |
| DNS Testing | ทดสอบ name resolution ด้วย `nslookup` และ `Resolve-DnsName` |
| Group Policy | สร้าง GPO บน DC แล้ว apply กับ Client และ DHCP Server |
| User Management | สร้าง AD User แล้ว login เข้า Windows 11 ด้วย Domain Account |
| WS2025 Features | ทดสอบฟีเจอร์ใหม่ของ Windows Server 2025 เช่น SMB compression, Storage QoS |
| LDAP Integration | ทดสอบ LDAP query จาก Client ผ่าน port 389/636 ไปยัง DC |

---

## 9. Template: Windows 11 Desktop

Template นี้สร้าง **Windows 11 Pro** VM เครื่องเดียว — เหมาะสำหรับ dev/test บน desktop environment, ทดสอบ software บน Windows 11, หรือเตรียม environment ก่อน join domain

| รายการ | ค่า |
|---|---|
| OS | Windows 11 Pro |
| Box | `gusztavvargadr/windows-11` |
| Provider | Hyper-V |
| CPU / RAM | 2 vCPU / 4 GB (ปรับได้) |
| Private IP | 192.168.56.90 |
| RDP (Host → Guest) | localhost:13393 → VM:3389 |
| Synced Folder | SMB (`.` → `C:\vagrant`) |

### ข้อกำหนดก่อนเริ่ม

- ✅ Windows 10/11 Pro หรือ Windows Server (Host)
- ✅ เปิด **Hyper-V** แล้ว (ดูหัวข้อ 2)
- ✅ ติดตั้ง **Vagrant** แล้ว
- ✅ RAM อย่างน้อย **8 GB** (VM ใช้ 4 GB + Host ~4 GB)
- ✅ พื้นที่ดิสก์อย่างน้อย **20 GB** (Windows 11 box ~8 GB)

### ขั้นตอนการใช้งาน

**ขั้นตอนที่ 1 — สร้าง Vagrantfile**

1. เปิด Boxsmith ที่ [https://dekbacom.github.io/Vagrant-Generator-System/](https://dekbacom.github.io/Vagrant-Generator-System/)
2. เลือก Template **"Windows 11 Desktop"** จาก Rail ด้านซ้าย
3. ปรับแต่งค่าตามต้องการ เช่น เพิ่ม CPU/RAM, เปลี่ยน IP, เพิ่ม provisioner
4. กด **Download** เพื่อดาวน์โหลด `Vagrantfile`

**ขั้นตอนที่ 2 — รัน VM**

```powershell
mkdir C:\vagrant-win11
cd C:\vagrant-win11
# วาง Vagrantfile ที่ดาวน์โหลดมา แล้วรัน
vagrant up
```

> **หมายเหตุ:** การดาวน์โหลด Box ครั้งแรกใช้เวลานาน (~8 GB) — ดาวน์โหลดครั้งเดียวและนำกลับมาใช้ใหม่ได้

**ขั้นตอนที่ 3 — เชื่อมต่อผ่าน RDP**

```powershell
# เชื่อมต่อผ่าน Vagrant (เปิด Remote Desktop Connection อัตโนมัติ)
vagrant rdp

# หรือเชื่อมต่อด้วยตนเองผ่าน Remote Desktop Connection
# Host: localhost  Port: 13393
# Username: vagrant  Password: vagrant
```

**ขั้นตอนที่ 4 — ตรวจสอบสถานะ VM**

```powershell
# ดูสถานะ
vagrant status

# รีสตาร์ท
vagrant reload

# หยุด VM
vagrant halt

# ลบ VM
vagrant destroy
```

### ตัวอย่าง Use Case

| Use Case | คำอธิบาย |
|---|---|
| Software Testing | ทดสอบ installer / application บน Windows 11 ที่สะอาดทุกครั้ง |
| UI Automation | รัน Selenium / Playwright test บน Windows browser |
| Dev Environment | ตั้งค่า development tools บน Windows แบบ reproducible |
| Domain Client | ใช้ join domain ภายหลัง โดยเพิ่ม provisioner `Join Active Directory Domain` |
| Snapshot Testing | ทดสอบ registry, group policy, software install ในสภาพแวดล้อมที่แยกออกมา |

### เพิ่ม Provisioner (ตัวอย่าง)

หากต้องการ install software เพิ่มเติม สามารถเพิ่ม provisioner ใน Boxsmith ก่อน download หรือแก้ไข Vagrantfile โดยตรง:

```ruby
config.vm.provision "shell", inline: <<-SHELL
  # ติดตั้ง Chocolatey package manager
  Set-ExecutionPolicy Bypass -Scope Process -Force
  [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
  iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

  # ติดตั้ง tools ผ่าน Chocolatey
  choco install -y googlechrome vscode git
SHELL
```

> ⚠️ Windows 11 ต้องใช้ **Hyper-V** เท่านั้น — ไม่รองรับ VirtualBox เนื่องจาก TPM/Secure Boot requirement

---

## 10. แก้ปัญหาที่พบบ่อย

### ❌ `vagrant up` ล้มเหลว — "VT-x is not available"

**สาเหตุ:** Hardware Virtualization ยังไม่ได้เปิด

**วิธีแก้:**
1. รีสตาร์ทเครื่องแล้วเข้า BIOS/UEFI
2. ค้นหา option ที่ชื่อ **Intel VT-x**, **AMD-V**, หรือ **SVM Mode**
3. เปลี่ยนเป็น **Enabled** แล้ว Save & Exit

---

### ❌ Hyper-V กับ VirtualBox ขัดแย้งกัน

**สาเหตุ:** Windows เปิด Hyper-V Hypervisor อยู่ ทำให้ VirtualBox ทำงานไม่ได้

**วิธีแก้ (ปิด Hyper-V ชั่วคราว):**
```powershell
# ปิด Hyper-V (ต้องรีบูต)
bcdedit /set hypervisorlaunchtype off
# รีบูตเครื่อง จากนั้นใช้ VirtualBox ได้ปกติ

# เปิด Hyper-V กลับมา (ต้องรีบูต)
bcdedit /set hypervisorlaunchtype auto
```

---

### ❌ Vagrant Box ดาวน์โหลดช้า / หมดเวลา

**วิธีแก้:**
```bash
# ดาวน์โหลด Box ล่วงหน้าและเพิ่มด้วยตนเอง
vagrant box add ubuntu/jammy64 --provider virtualbox

# หรือใช้ mirror โดย set environment variable
# Windows PowerShell:
$env:VAGRANT_SERVER_URL="https://vagrantcloud.com"
```

---

### ❌ `vagrant ssh` บน Windows ไม่ทำงาน

**วิธีแก้:** ติดตั้ง **Git for Windows** ซึ่งมี OpenSSH มาด้วย

```powershell
# ติดตั้งผ่าน winget
winget install Git.Git

# หรือดาวน์โหลดจาก https://git-scm.com/download/win
```

---

### ❌ Windows VM ไม่ยอม Join Domain

**สาเหตุ:** DC ยังไม่ reboot เสร็จหลัง AD install

**วิธีแก้:**
```powershell
# รอ DC reboot เสร็จก่อน แล้วค่อย provision client ใหม่
vagrant reload dc-01 --provision
vagrant provision win-client
```

---

### ❌ Port ชนกัน (Port already in use)

**วิธีแก้:** แก้ไข `host:` port ใน Vagrantfile

```ruby
# เปลี่ยนจาก
config.vm.network "forwarded_port", guest: 80, host: 8080
# เป็น
config.vm.network "forwarded_port", guest: 80, host: 8180
```

---

## ลิงก์ที่เป็นประโยชน์

| ทรัพยากร | URL |
|---|---|
| Vagrant Documentation | [developer.hashicorp.com/vagrant/docs](https://developer.hashicorp.com/vagrant/docs) |
| Vagrant Cloud (Box repository) | [app.vagrantup.com/boxes/search](https://app.vagrantup.com/boxes/search) |
| VirtualBox Download | [virtualbox.org/wiki/Downloads](https://www.virtualbox.org/wiki/Downloads) |
| Boxsmith Web App | [dekbacom.github.io/Vagrant-Generator-System](https://dekbacom.github.io/Vagrant-Generator-System/) |
