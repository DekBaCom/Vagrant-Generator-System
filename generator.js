// Vagrantfile generator engine. Pure functions: state in, ruby source out.
// Highlights diff regions by returning per-line metadata.

(function () {
  const PROVIDER_KEY = {
    virtualbox: 'virtualbox',
    hyperv: 'hyperv',
    vmware_desktop: 'vmware_desktop',
    libvirt: 'libvirt',
  };

  const PROVIDER_LABEL = {
    virtualbox: 'VirtualBox',
    hyperv: 'Hyper-V',
    vmware_desktop: 'VMware Desktop',
    libvirt: 'libvirt',
  };

  // Note these are illustrative; in production we'd hit Vagrant Cloud API.
  const OS_BOXES = [
    { id: 'ubuntu/jammy64',     label: 'Ubuntu 22.04 LTS (Jammy)',   family: 'linux',   arch: 'x86_64', size: '614 MB' },
    { id: 'ubuntu/noble64',     label: 'Ubuntu 24.04 LTS (Noble)',   family: 'linux',   arch: 'x86_64', size: '702 MB' },
    { id: 'ubuntu/focal64',     label: 'Ubuntu 20.04 LTS (Focal)',   family: 'linux',   arch: 'x86_64', size: '589 MB' },
    { id: 'debian/bookworm64',  label: 'Debian 12 (Bookworm)',       family: 'linux',   arch: 'x86_64', size: '438 MB' },
    { id: 'rockylinux/9',       label: 'Rocky Linux 9',              family: 'linux',   arch: 'x86_64', size: '912 MB' },
    { id: 'almalinux/9',        label: 'AlmaLinux 9',                family: 'linux',   arch: 'x86_64', size: '894 MB' },
    { id: 'centos/stream9',     label: 'CentOS Stream 9',            family: 'linux',   arch: 'x86_64', size: '1.1 GB' },
    { id: 'fedora/40-cloud',    label: 'Fedora 40 Cloud',            family: 'linux',   arch: 'x86_64', size: '524 MB' },
    { id: 'archlinux/archlinux',label: 'Arch Linux (rolling)',       family: 'linux',   arch: 'x86_64', size: '798 MB' },
    { id: 'gusztavvargadr/windows-server-2022', label: 'Windows Server 2022', family: 'windows', arch: 'x86_64', size: '8.4 GB' },
    { id: 'gusztavvargadr/windows-server-2025', label: 'Windows Server 2025', family: 'windows', arch: 'x86_64', size: '9.1 GB' },
    { id: 'gusztavvargadr/windows-10',          label: 'Windows 10',          family: 'windows', arch: 'x86_64', size: '6.9 GB' },
    { id: 'gusztavvargadr/windows-11',          label: 'Windows 11 Pro',      family: 'windows', arch: 'x86_64', size: '8.2 GB' },
  ];

  const PROVISIONERS = {
    update:           { id: 'update',           label: 'Update package index',              platform: 'linux',   inline: 'apt-get update && apt-get upgrade -y' },
    docker:           { id: 'docker',           label: 'Install Docker Engine',             platform: 'linux',   inline: "curl -fsSL https://get.docker.com | sh && usermod -aG docker vagrant" },
    nginx:            { id: 'nginx',            label: 'Install nginx',                     platform: 'linux',   inline: 'apt-get install -y nginx && systemctl enable --now nginx' },
    nodejs:           { id: 'nodejs',           label: 'Install Node.js 20 LTS',            platform: 'linux',   inline: 'curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs' },
    postgres:         { id: 'postgres',         label: 'Install PostgreSQL 16',             platform: 'linux',   inline: 'apt-get install -y postgresql-16 && systemctl enable --now postgresql' },
    redis:            { id: 'redis',            label: 'Install Redis',                     platform: 'linux',   inline: 'apt-get install -y redis-server && systemctl enable --now redis-server' },
    git:              { id: 'git',              label: 'Install git + build tools',         platform: 'linux',   inline: 'apt-get install -y git build-essential' },
    firewall:         { id: 'firewall',         label: 'Enable UFW firewall',               platform: 'linux',   inline: 'ufw --force enable && ufw allow 22 && ufw allow 80' },
    active_directory: {
      id: 'active_directory',
      label: 'Active Directory Domain Services',
      platform: 'windows',
      inline: 'Install-WindowsFeature AD-Domain-Services; Install-ADDSForest -DomainName "lab.local"',
      script: [
        'Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools',
        'Import-Module ADDSDeployment',
        'Install-ADDSForest -DomainName "lab.local" -DomainNetbiosName "LAB" `',
        '  -InstallDns:$true -Force:$true `',
        '  -SafeModeAdministratorPassword (ConvertTo-SecureString "P@ssword123!" -AsPlainText -Force)',
      ],
    },
    join_domain: {
      id: 'join_domain',
      label: 'Join Active Directory Domain',
      platform: 'windows',
      inline: 'Add-Computer -DomainName "lab.local" -Credential $cred -Restart -Force',
      script: [
        '$pass = ConvertTo-SecureString "P@ssword123!" -AsPlainText -Force',
        '$cred = New-Object System.Management.Automation.PSCredential("LAB\\Administrator", $pass)',
        'Add-Computer -DomainName "lab.local" -Credential $cred -Restart -Force',
      ],
    },
    dhcp_server: {
      id: 'dhcp_server',
      label: 'Install DHCP Server',
      platform: 'windows',
      inline: 'Install-WindowsFeature DHCP -IncludeManagementTools',
      script: [
        'Install-WindowsFeature -Name DHCP -IncludeManagementTools',
        'Add-DhcpServerv4Scope -Name "Lab Scope" `',
        '  -StartRange 192.168.56.100 -EndRange 192.168.56.200 `',
        '  -SubnetMask 255.255.255.0',
        'Set-DhcpServerv4OptionValue `',
        '  -DnsServer 192.168.56.80 -DnsDomain "lab.local" -Router 192.168.56.1',
        'Add-DhcpServerInDC -DnsName "dc-01.lab.local" -IPAddress 192.168.56.80',
      ],
    },
  };

  const TEMPLATES = {
    blank: {
      id: 'blank',
      name: 'Basic Blank VM',
      tagline: 'Minimal starting point',
      glyph: '▢',
      defaults: {
        hostname: 'dev-box',
        box: 'ubuntu/jammy64',
        provider: 'virtualbox',
        cpus: 2, memory: 2048,
        privateIp: '192.168.56.10',
        publicNetwork: false,
        forwards: [],
        sync: { host: '.', guest: '/vagrant', type: 'default' },
        provisioners: [],
      },
    },
    web: {
      id: 'web',
      name: 'Web Server',
      tagline: 'nginx + Node.js + ports 80/443',
      glyph: '◵',
      defaults: {
        hostname: 'web-01',
        box: 'ubuntu/jammy64',
        provider: 'virtualbox',
        cpus: 2, memory: 2048,
        privateIp: '192.168.56.20',
        publicNetwork: false,
        forwards: [
          { guest: 80,  host: 8080, protocol: 'tcp' },
          { guest: 443, host: 8443, protocol: 'tcp' },
        ],
        sync: { host: './app', guest: '/var/www/app', type: 'default' },
        provisioners: ['update', 'nginx', 'nodejs'],
      },
    },
    db: {
      id: 'db',
      name: 'Database Server',
      tagline: 'PostgreSQL 16, isolated network',
      glyph: '◰',
      defaults: {
        hostname: 'db-01',
        box: 'ubuntu/jammy64',
        provider: 'virtualbox',
        cpus: 4, memory: 4096,
        privateIp: '192.168.56.30',
        publicNetwork: false,
        forwards: [{ guest: 5432, host: 15432, protocol: 'tcp' }],
        sync: { host: './sql', guest: '/srv/sql', type: 'default' },
        provisioners: ['update', 'postgres', 'firewall'],
      },
    },
    docker: {
      id: 'docker',
      name: 'Docker Host',
      tagline: 'Docker Engine, ready for containers',
      glyph: '◨',
      defaults: {
        hostname: 'docker-host',
        box: 'ubuntu/noble64',
        provider: 'virtualbox',
        cpus: 4, memory: 8192,
        privateIp: '192.168.56.40',
        publicNetwork: false,
        forwards: [{ guest: 2375, host: 12375, protocol: 'tcp' }],
        sync: { host: './stacks', guest: '/opt/stacks', type: 'default' },
        provisioners: ['update', 'docker', 'git'],
      },
    },
    ci: {
      id: 'ci',
      name: 'CI Runner',
      tagline: 'Beefy box for build/test',
      glyph: '◧',
      defaults: {
        hostname: 'ci-runner',
        box: 'debian/bookworm64',
        provider: 'virtualbox',
        cpus: 6, memory: 8192,
        privateIp: '192.168.56.50',
        publicNetwork: true,
        forwards: [],
        sync: { host: '.', guest: '/workspace', type: 'rsync' },
        provisioners: ['update', 'docker', 'nodejs', 'git'],
      },
    },
    win: {
      id: 'win',
      name: 'Windows Test Bench',
      tagline: 'Windows Server 2022 + RDP',
      glyph: '◫',
      defaults: {
        hostname: 'win-test',
        box: 'gusztavvargadr/windows-server-2022',
        provider: 'hyperv',
        cpus: 4, memory: 8192,
        privateIp: '192.168.56.60',
        publicNetwork: false,
        forwards: [{ guest: 3389, host: 13389, protocol: 'tcp' }],
        sync: { host: '.', guest: 'C:\\vagrant', type: 'smb' },
        provisioners: [],
      },
    },
    win11: {
      id: 'win11',
      name: 'Windows 11 Desktop',
      tagline: 'Windows 11 Pro, RDP-ready dev/test desktop',
      glyph: '◩',
      defaults: {
        hostname: 'win11-desk',
        box: 'gusztavvargadr/windows-11',
        provider: 'hyperv',
        cpus: 2, memory: 4096,
        privateIp: '192.168.56.90',
        publicNetwork: false,
        forwards: [{ guest: 3389, host: 13393, protocol: 'tcp' }],
        sync: { host: '.', guest: 'C:\\vagrant', type: 'smb' },
        provisioners: [],
      },
    },
    ad: {
      id: 'ad',
      name: 'Active Directory DC',
      tagline: 'Windows Server 2022, AD DS, DNS',
      glyph: '⊟',
      defaults: {
        hostname: 'dc-01',
        box: 'gusztavvargadr/windows-server-2022',
        provider: 'hyperv',
        cpus: 4, memory: 8192,
        privateIp: '192.168.56.70',
        publicNetwork: false,
        forwards: [
          { guest: 3389, host: 13389, protocol: 'tcp' },
          { guest: 389,  host: 10389, protocol: 'tcp' },
          { guest: 636,  host: 10636, protocol: 'tcp' },
        ],
        sync: { host: '.', guest: 'C:\\vagrant', type: 'smb' },
        provisioners: ['active_directory'],
      },
    },
    adds_2clients: {
      id: 'adds_2clients',
      name: 'AD DS + 2 Windows Clients',
      tagline: '1 Domain Controller + 2 joined Windows 10 clients',
      glyph: '⊞',
      solution: true,
      vms: [
        {
          name: 'dc-01',
          role: 'Domain Controller',
          box: 'gusztavvargadr/windows-server-2022',
          provider: 'hyperv',
          cpus: 4, memory: 8192,
          privateIp: '192.168.56.70',
          publicNetwork: false,
          forwards: [
            { guest: 3389, host: 13389, protocol: 'tcp' },
            { guest: 389,  host: 10389, protocol: 'tcp' },
            { guest: 636,  host: 10636, protocol: 'tcp' },
          ],
          sync: { host: '.', guest: 'C:\\vagrant', type: 'smb' },
          provisioners: ['active_directory'],
        },
        {
          name: 'win-client-1',
          role: 'Windows 10 Client 1',
          box: 'gusztavvargadr/windows-10',
          provider: 'hyperv',
          cpus: 2, memory: 4096,
          privateIp: '192.168.56.71',
          publicNetwork: false,
          forwards: [{ guest: 3389, host: 13390, protocol: 'tcp' }],
          sync: { host: '.', guest: 'C:\\vagrant', type: 'smb' },
          provisioners: ['join_domain'],
        },
        {
          name: 'win-client-2',
          role: 'Windows 10 Client 2',
          box: 'gusztavvargadr/windows-10',
          provider: 'hyperv',
          cpus: 2, memory: 4096,
          privateIp: '192.168.56.72',
          publicNetwork: false,
          forwards: [{ guest: 3389, host: 13391, protocol: 'tcp' }],
          sync: { host: '.', guest: 'C:\\vagrant', type: 'smb' },
          provisioners: ['join_domain'],
        },
      ],
    },
    ws2025_lab: {
      id: 'ws2025_lab',
      name: 'WS2025 AD + DHCP + Win11',
      tagline: 'DC (AD DS/DNS) + DHCP Server + 2 Windows 11 Pro clients',
      glyph: '⊡',
      solution: true,
      vms: [
        {
          name: 'dc-01',
          role: 'Domain Controller (AD DS + DNS)',
          box: 'gusztavvargadr/windows-server-2025',
          provider: 'hyperv',
          cpus: 4, memory: 8192,
          privateIp: '192.168.56.80',
          publicNetwork: false,
          forwards: [
            { guest: 3389, host: 13389, protocol: 'tcp' },
            { guest: 389,  host: 10389, protocol: 'tcp' },
            { guest: 636,  host: 10636, protocol: 'tcp' },
          ],
          sync: { host: '.', guest: 'C:\\vagrant', type: 'smb' },
          provisioners: ['active_directory'],
        },
        {
          name: 'dhcp-01',
          role: 'DHCP Server',
          box: 'gusztavvargadr/windows-server-2025',
          provider: 'hyperv',
          cpus: 2, memory: 4096,
          privateIp: '192.168.56.81',
          publicNetwork: false,
          forwards: [{ guest: 3389, host: 13392, protocol: 'tcp' }],
          sync: { host: '.', guest: 'C:\\vagrant', type: 'smb' },
          provisioners: ['join_domain', 'dhcp_server'],
        },
        {
          name: 'win11-client-1',
          role: 'Windows 11 Pro Client 1',
          box: 'gusztavvargadr/windows-11',
          provider: 'hyperv',
          cpus: 2, memory: 4096,
          privateIp: '192.168.56.82',
          publicNetwork: false,
          forwards: [{ guest: 3389, host: 13390, protocol: 'tcp' }],
          sync: { host: '.', guest: 'C:\\vagrant', type: 'smb' },
          provisioners: ['join_domain'],
        },
        {
          name: 'win11-client-2',
          role: 'Windows 11 Pro Client 2',
          box: 'gusztavvargadr/windows-11',
          provider: 'hyperv',
          cpus: 2, memory: 4096,
          privateIp: '192.168.56.83',
          publicNetwork: false,
          forwards: [{ guest: 3389, host: 13391, protocol: 'tcp' }],
          sync: { host: '.', guest: 'C:\\vagrant', type: 'smb' },
          provisioners: ['join_domain'],
        },
      ],
    },
    adds_client: {
      id: 'adds_client',
      name: 'AD DS + Windows Client',
      tagline: 'Domain Controller + joined Windows 10 client',
      glyph: '⊠',
      solution: true,
      vms: [
        {
          name: 'dc-01',
          role: 'Domain Controller',
          box: 'gusztavvargadr/windows-server-2022',
          provider: 'hyperv',
          cpus: 4, memory: 8192,
          privateIp: '192.168.56.70',
          publicNetwork: false,
          forwards: [
            { guest: 3389, host: 13389, protocol: 'tcp' },
            { guest: 389,  host: 10389, protocol: 'tcp' },
            { guest: 636,  host: 10636, protocol: 'tcp' },
          ],
          sync: { host: '.', guest: 'C:\\vagrant', type: 'smb' },
          provisioners: ['active_directory'],
        },
        {
          name: 'win-client',
          role: 'Windows 10 Client',
          box: 'gusztavvargadr/windows-10',
          provider: 'hyperv',
          cpus: 2, memory: 4096,
          privateIp: '192.168.56.71',
          publicNetwork: false,
          forwards: [{ guest: 3389, host: 13390, protocol: 'tcp' }],
          sync: { host: '.', guest: 'C:\\vagrant', type: 'smb' },
          provisioners: ['join_domain'],
        },
      ],
    },
  };

  // ── generation ──────────────────────────────────────────────────────────
  function rubyStr(s) {
    return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  }

  function generate(cfg) {
    const L = []; // { text, kind, key }
    const push = (text, kind = 'code', key = null) => L.push({ text, kind, key });

    push('# -*- mode: ruby -*-', 'comment');
    push('# vi: set ft=ruby :', 'comment');
    push('# Generated by Boxsmith · ' + new Date().toISOString().slice(0, 10), 'comment');
    push('');
    push('Vagrant.configure("2") do |config|', 'code');
    push('  # ── Box ─────────────────────────────────────────────', 'comment');
    push(`  config.vm.box = ${rubyStr(cfg.box)}`, 'code', 'box');
    push(`  config.vm.hostname = ${rubyStr(cfg.hostname)}`, 'code', 'hostname');
    push('');

    // network
    push('  # ── Network ─────────────────────────────────────────', 'comment');
    if (cfg.privateIp) {
      push(`  config.vm.network "private_network", ip: ${rubyStr(cfg.privateIp)}`, 'code', 'privateIp');
    }
    if (cfg.publicNetwork) {
      push('  config.vm.network "public_network"', 'code', 'publicNetwork');
    }
    (cfg.forwards || []).forEach((fw, i) => {
      push(
        `  config.vm.network "forwarded_port", guest: ${fw.guest}, host: ${fw.host}` +
          (fw.protocol && fw.protocol !== 'tcp' ? `, protocol: ${rubyStr(fw.protocol)}` : ''),
        'code',
        `forward-${i}`
      );
    });
    push('');

    // sync
    if (cfg.sync && cfg.sync.host && cfg.sync.guest) {
      push('  # ── Synced folder ──────────────────────────────────', 'comment');
      let line = `  config.vm.synced_folder ${rubyStr(cfg.sync.host)}, ${rubyStr(cfg.sync.guest)}`;
      if (cfg.sync.type && cfg.sync.type !== 'default') line += `, type: ${rubyStr(cfg.sync.type)}`;
      push(line, 'code', 'sync');
      push('');
    }

    // provider
    push('  # ── Provider ───────────────────────────────────────', 'comment');
    push(`  config.vm.provider ${rubyStr(cfg.provider)} do |v|`, 'code', 'provider');
    if (cfg.provider === 'virtualbox' || cfg.provider === 'vmware_desktop' || cfg.provider === 'libvirt') {
      push(`    v.name = ${rubyStr(cfg.hostname)}`, 'code', 'hostname');
      push(`    v.cpus = ${cfg.cpus}`, 'code', 'cpus');
      push(`    v.memory = ${cfg.memory}`, 'code', 'memory');
    } else if (cfg.provider === 'hyperv') {
      push(`    v.vmname = ${rubyStr(cfg.hostname)}`, 'code', 'hostname');
      push(`    v.cpus = ${cfg.cpus}`, 'code', 'cpus');
      push(`    v.memory = ${cfg.memory}`, 'code', 'memory');
    }
    push('  end', 'code');
    push('');

    // provisioning
    const provs = (cfg.provisioners || []).map((id) => PROVISIONERS[id]).filter(Boolean);
    if (provs.length) {
      push('  # ── Provisioning ───────────────────────────────────', 'comment');
      provs.forEach((p, i) => {
        const scriptLines = p.script || [p.inline];
        push(
          `  config.vm.provision "shell", name: ${rubyStr(p.label)}, inline: <<-SHELL`,
          'code',
          `prov-${i}`
        );
        scriptLines.forEach((line) => push(`    ${line}`, 'code', `prov-${i}`));
        push('  SHELL', 'code', `prov-${i}`);
        if (i < provs.length - 1) push('');
      });
      push('');
    }

    push('end', 'code');

    return L;
  }

  function linesToString(lines) {
    return lines.map((l) => l.text).join('\n');
  }

  // Token-level highlighter for Ruby-ish content.
  function tokenize(text) {
    const tokens = [];
    const RE =
      /(#.*$)|("(?:[^"\\]|\\.)*")|(:[a-z_]+)|(\b\d+\.\d+\.\d+\.\d+\b)|(\b\d+\b)|(\b(?:do|end|config|Vagrant|configure|true|false|nil|name)\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|([^\s\w]+)/gmi;
    let m;
    while ((m = RE.exec(text)) !== null) {
      if (m[1]) tokens.push({ t: 'c', v: m[1] });
      else if (m[2]) tokens.push({ t: 's', v: m[2] });
      else if (m[3]) tokens.push({ t: 'sym', v: m[3] });
      else if (m[4]) tokens.push({ t: 'ip', v: m[4] });
      else if (m[5]) tokens.push({ t: 'n', v: m[5] });
      else if (m[6]) tokens.push({ t: 'kw', v: m[6] });
      else if (m[7]) tokens.push({ t: 'id', v: m[7] });
      else if (m[8]) tokens.push({ t: 'w', v: m[8] });
      else if (m[9]) tokens.push({ t: 'p', v: m[9] });
    }
    return tokens;
  }

  // ── multi-VM solution generator ─────────────────────────────────────────
  function generateSolution(tmpl, customVms) {
    const vms = customVms || tmpl.vms;
    const L = [];
    const push = (text, kind = 'code', key = null) => L.push({ text, kind, key });

    push('# -*- mode: ruby -*-', 'comment');
    push('# vi: set ft=ruby :', 'comment');
    push('# Generated by Boxsmith · ' + new Date().toISOString().slice(0, 10), 'comment');
    push(`# Solution: ${tmpl.name}`, 'comment');
    push('');
    push('Vagrant.configure("2") do |config|', 'code');

    vms.forEach((vm, vi) => {
      push(`  # ── ${vm.role} (${vm.name}) ${'─'.repeat(Math.max(0, 36 - vm.role.length - vm.name.length))}`, 'comment');
      push(`  config.vm.define ${rubyStr(vm.name)} do |m|`, 'code', `vm${vi}`);
      push(`    m.vm.box = ${rubyStr(vm.box)}`, 'code', `vm${vi}-box`);
      push(`    m.vm.hostname = ${rubyStr(vm.name)}`, 'code', `vm${vi}-host`);
      push('');

      push('    # ── Network ─────────────────────────────────────────', 'comment');
      if (vm.privateIp) {
        push(`    m.vm.network "private_network", ip: ${rubyStr(vm.privateIp)}`, 'code', `vm${vi}-ip`);
      }
      if (vm.publicNetwork) {
        push('    m.vm.network "public_network"', 'code', `vm${vi}-pub`);
      }
      (vm.forwards || []).forEach((fw, i) => {
        push(
          `    m.vm.network "forwarded_port", guest: ${fw.guest}, host: ${fw.host}` +
            (fw.protocol && fw.protocol !== 'tcp' ? `, protocol: ${rubyStr(fw.protocol)}` : ''),
          'code', `vm${vi}-fw${i}`
        );
      });
      push('');

      if (vm.sync && vm.sync.host && vm.sync.guest) {
        push('    # ── Synced folder ──────────────────────────────────', 'comment');
        let line = `    m.vm.synced_folder ${rubyStr(vm.sync.host)}, ${rubyStr(vm.sync.guest)}`;
        if (vm.sync.type && vm.sync.type !== 'default') line += `, type: ${rubyStr(vm.sync.type)}`;
        push(line, 'code', `vm${vi}-sync`);
        push('');
      }

      push('    # ── Provider ───────────────────────────────────────', 'comment');
      push(`    m.vm.provider ${rubyStr(vm.provider)} do |v|`, 'code', `vm${vi}-prov`);
      if (vm.provider === 'hyperv') {
        push(`      v.vmname = ${rubyStr(vm.name)}`, 'code', `vm${vi}-prov`);
      } else {
        push(`      v.name = ${rubyStr(vm.name)}`, 'code', `vm${vi}-prov`);
      }
      push(`      v.cpus = ${vm.cpus}`, 'code', `vm${vi}-cpus`);
      push(`      v.memory = ${vm.memory}`, 'code', `vm${vi}-mem`);
      push('    end', 'code');
      push('');

      const provs = (vm.provisioners || []).map((id) => PROVISIONERS[id]).filter(Boolean);
      if (provs.length) {
        push('    # ── Provisioning ───────────────────────────────────', 'comment');
        provs.forEach((p, pi) => {
          const scriptLines = p.script || [p.inline];
          push(`    m.vm.provision "shell", name: ${rubyStr(p.label)}, inline: <<-SHELL`, 'code', `vm${vi}-prov${pi}`);
          scriptLines.forEach((line) => push(`      ${line}`, 'code', `vm${vi}-prov${pi}`));
          push('    SHELL', 'code', `vm${vi}-prov${pi}`);
          if (pi < provs.length - 1) push('');
        });
        push('');
      }

      push('  end', 'code');
      if (vi < vms.length - 1) push('');
    });

    push('end', 'code');
    return L;
  }

  // ── validation ──────────────────────────────────────────────────────────
  function validate(cfg) {
    const errs = {};
    if (!cfg.hostname || !/^[a-z0-9][a-z0-9-]{0,62}$/i.test(cfg.hostname))
      errs.hostname = 'lowercase letters, digits, and dashes; up to 63 chars';
    if (!cfg.box) errs.box = 'pick a box';
    const cpus = Number(cfg.cpus);
    if (!Number.isFinite(cpus) || cpus < 1 || cpus > 32) errs.cpus = '1–32';
    const mem = Number(cfg.memory);
    if (!Number.isFinite(mem) || mem < 512 || mem > 65536) errs.memory = '512–65536 MB';
    if (cfg.privateIp && !/^(\d{1,3}\.){3}\d{1,3}$/.test(cfg.privateIp))
      errs.privateIp = 'IPv4 address required';
    (cfg.forwards || []).forEach((fw, i) => {
      if (fw.guest < 1 || fw.guest > 65535) errs[`fw-${i}-g`] = 'port 1–65535';
      if (fw.host < 1 || fw.host > 65535) errs[`fw-${i}-h`] = 'port 1–65535';
    });
    return errs;
  }

  window.Boxsmith = {
    OS_BOXES,
    PROVIDER_KEY,
    PROVIDER_LABEL,
    PROVISIONERS,
    TEMPLATES,
    generate,
    generateSolution,
    linesToString,
    tokenize,
    validate,
  };
})();
