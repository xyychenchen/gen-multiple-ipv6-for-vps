#!/bin/bash

# 获取所有外网 IPv6 地址
ipv6_addresses=$(ip -6 addr | grep "inet6" | awk '{print $2}' | cut -d'/' -f1 | grep -v "::1" | grep -E -v "^fe80|^fd|^fc")

# 统计外网 IPv6 地址数量
count=$(echo "$ipv6_addresses" | wc -l)
echo "共检测到 $count 个外网 IPv6 地址"

# 询问用户希望端口从多少开始，默认是 30000
read -p "请输入起始端口（默认 30000）: " start_port
start_port=${start_port:-30000}

# 询问用户是否希望设置用户名和密码
read -p "是否希望设置用户名和密码（yes/no，默认 no）: " use_auth
use_auth=${use_auth:-no}

# 如果用户选择设置用户名和密码
if [ "$use_auth" == "yes" ]; then
  read -p "请输入用户名: " username
  read -sp "请输入密码: " password
  echo
else
  # 生成随机用户名和密码
  generate_random_string() {
    length=$1
    tr -dc 'A-Za-z0-9!@#$%^&*()_+{}|:<>?~' < /dev/urandom | head -c $length
  }

  username=$(generate_random_string 8)
  password=$(generate_random_string 16)
fi

# 生成入站配置
echo '[' > inbound.json
idx=0
for ip in $ipv6_addresses; do
  idx=$((idx + 1))
  port=$((start_port + idx - 1))

  if [ $idx -gt 1 ]; then
    echo ',' >> inbound.json
  fi

  cat <<EOL >> inbound.json
  {
    "remark": "$port",
    "port": $port,
    "protocol": "socks",
    "settings": {
      "auth": "password",
      "accounts": [
        {
          "user": "$username",
          "pass": "$password"
        }
      ],
      "udp": true,
      "ip": "$ip"
    },
    "tag": "$port",
    "sniffing": {
      "enabled": true,
      "destOverride": [
        "http",
        "tls",
        "quic",
        "fakedns"
      ]
    },
    "clientStats": []
  }
EOL
done
echo ']' >> inbound.json

# 生成路由配置
echo '[' > routing.json
idx=0
for ip in $ipv6_addresses; do
  idx=$((idx + 1))
  if [ $idx -gt 1 ]; then
    echo ',' >> routing.json
  fi
  cat <<EOL >> routing.json
  {
    "type": "field",
    "inboundTag": [
      "$((start_port + idx - 1))"
    ],
    "outboundTag": "$((start_port + idx - 1))"
  }
EOL
done
echo ']' >> routing.json

# 生成出站配置
echo '[' > outbound.json
idx=0
for ip in $ipv6_addresses; do
  idx=$((idx + 1))
  port=$((start_port + idx - 1))

  if [ $idx -gt 1 ]; then
    echo ',' >> outbound.json
  fi

  cat <<EOL >> outbound.json
  {
    "tag": "$port",
    "protocol": "freedom",
    "settings": {
      "domainStrategy": "UseIPv6"
    },
    "sendThrough": "$ip"
  }
EOL
done
echo ']' >> outbound.json

echo "共检测到 $count 个外网 IPv6 地址，端口号从 $start_port 到 $((start_port + count - 1))"
echo "您的用户名是 $username，密码是 $password"
echo "您生成的三个JSON文件分别在以下路径:"
echo "入站配置文件：$(pwd)/inbound.json"
echo "路由配置文件：$(pwd)/routing.json"
echo "出站配置文件：$(pwd)/outbound.json"
echo "请把对应的JSON代码拷贝到xui面板的xray设置中，即可完成配置"
