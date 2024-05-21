addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>随机生成IPv6地址</title>
      <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        input { width: 100%; padding: 10px; margin: 10px 0; }
        button { padding: 10px 20px; margin: 10px 5px; border: none; cursor: pointer; }
        .generate-btn, .convert-btn { background-color: green; color: white; }
        .output, .shell-output { display: none; white-space: pre-wrap; background-color: #f4f4f4; padding: 10px; position: relative; }
        .copy-btn { position: absolute; top: 10px; right: 10px; background-color: blue; color: white; border: none; padding: 5px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>随机生成IPv6地址</h1>
        <input type="text" id="ipv6Prefix" placeholder="IPv6地址，例如2001:475:35:3f4::6/64">
        <input type="number" id="ipCount" placeholder="IP数量">
        <input type="text" id="interfaceName" placeholder="网卡名称">
        <button class="generate-btn" onclick="generateIPs()">生成随机IPv6地址</button>
        <button class="convert-btn" onclick="convertToShell()">转换为Shell指令</button>
        <div id="outputContainer" class="output">
          <button class="copy-btn" onclick="copyToClipboard('output')">复制</button>
          <div id="output"></div>
        </div>
        <div id="shellOutputContainer" class="shell-output">
          <button class="copy-btn" onclick="copyToClipboard('shellOutput')">复制</button>
          <div id="shellOutput"></div>
        </div>
      </div>
      <script>
        function generateRandomIPv6(prefix) {
          let [networkPrefix, prefixLength] = prefix.split('/');
          let parts = networkPrefix.split(':');
          while (parts.length < 8) {
            parts.push('0000');
          }
          parts = parts.map(part => part.padStart(4, '0'));
          let network = parts.slice(0, Math.ceil(prefixLength / 16)).join(':');
          let generatedIPs = new Set();
          while (generatedIPs.size < parseInt(document.getElementById('ipCount').value)) {
            let host = '';
            for (let i = Math.ceil(prefixLength / 16); i < 8; i++) {
              host += Math.floor(Math.random() * 65536).toString(16).padStart(4, '0') + ':';
            }
            host = host.slice(0, -1);
            let fullIp = network + ':' + host + '/' + prefixLength;
            generatedIPs.add(fullIp);
          }
          return Array.from(generatedIPs);
        }

        function generateIPs() {
          const prefix = document.getElementById('ipv6Prefix').value;
          const count = document.getElementById('ipCount').value;
          if (!prefix || !count) {
            alert('请填写IPv6地址和IP数量');
            return;
          }
          const generatedIPs = generateRandomIPv6(prefix);
          document.getElementById('output').textContent = generatedIPs.join('\\n');
          document.getElementById('outputContainer').style.display = 'block';
        }

        function convertToShell() {
          const interfaceName = document.getElementById('interfaceName').value;
          if (!interfaceName) {
            alert('请填写网卡名称');
            return;
          }
          const ips = document.getElementById('output').textContent.trim().split('\\n');
          if (ips.length === 0 || ips[0] === '') {
            alert('请先生成IPv6地址');
            return;
          }
          const commands = ips.map(ip => \`sudo ip addr add \${ip.split('/')[0]} dev \${interfaceName};\`).join('\\n'); // 添加结束的标点符号
          document.getElementById('shellOutput').textContent = commands;
          document.getElementById('shellOutputContainer').style.display = 'block';
        }

        function copyToClipboard(elementId) {
          const text = document.getElementById(elementId).textContent;
          navigator.clipboard.writeText(text).then(() => {
            alert('内容已复制到剪贴板');
          }).catch(err => {
            alert('复制失败');
          });
        }
      </script>
    </body>
    </html>
  `;
  return new Response(html, {
    headers: { 'content-type': 'text/html;charset=UTF-8' },
  });
}
