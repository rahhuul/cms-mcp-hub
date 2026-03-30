/**
 * Web dashboard — HTML UI for browsing tools, testing endpoints, and getting configs.
 */

import type { McpTool } from "./mcp-bridge.js";

interface ServerInfo {
  name: string;
  tools: McpTool[];
  ready: boolean;
}

export function renderDashboard(servers: ServerInfo[], baseUrl: string, apiKey: string): string {
  const totalTools = servers.reduce((sum, s) => sum + s.tools.length, 0);

  const serverCards = servers.map((s) => {
    const toolRows = s.tools.map((t) => {
      const params = (t.inputSchema as Record<string, unknown>)?.["properties"] as Record<string, unknown> | undefined;
      const paramList = params ? Object.keys(params).join(", ") : "none";
      return `<tr>
        <td><code class="tool-name">${t.name}</code></td>
        <td>${t.description}</td>
        <td><small>${paramList}</small></td>
        <td><button onclick="tryTool('${s.name}','${t.name}')" class="btn">Try</button></td>
      </tr>`;
    }).join("\n");

    return `<div class="server-card">
      <h2>${s.name} <span class="badge ${s.ready ? "badge-ok" : "badge-err"}">${s.ready ? s.tools.length + " tools" : "offline"}</span></h2>
      <table><thead><tr><th>Tool</th><th>Description</th><th>Params</th><th></th></tr></thead><tbody>${toolRows}</tbody></table>
    </div>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CMS MCP Hub Gateway</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;padding:2rem}
  h1{font-size:2rem;margin-bottom:.5rem;color:#f8fafc}
  .subtitle{color:#94a3b8;margin-bottom:2rem}
  .stats{display:flex;gap:1rem;margin-bottom:2rem;flex-wrap:wrap}
  .stat{background:#1e293b;padding:1rem 1.5rem;border-radius:8px;min-width:150px}
  .stat-value{font-size:2rem;font-weight:700;color:#38bdf8}
  .stat-label{color:#94a3b8;font-size:.85rem}
  .server-card{background:#1e293b;border-radius:12px;padding:1.5rem;margin-bottom:1.5rem}
  .server-card h2{margin-bottom:1rem;color:#f1f5f9}
  .badge{font-size:.75rem;padding:2px 8px;border-radius:99px;margin-left:8px;vertical-align:middle}
  .badge-ok{background:#065f46;color:#6ee7b7}
  .badge-err{background:#7f1d1d;color:#fca5a5}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;padding:8px;color:#94a3b8;font-size:.8rem;text-transform:uppercase;border-bottom:1px solid #334155}
  td{padding:8px;border-bottom:1px solid #1e293b;font-size:.9rem}
  code.tool-name{color:#38bdf8;background:#0f172a;padding:2px 6px;border-radius:4px;font-size:.85rem}
  .btn{background:#2563eb;color:#fff;border:none;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:.8rem}
  .btn:hover{background:#1d4ed8}
  .config-section{background:#1e293b;border-radius:12px;padding:1.5rem;margin-bottom:1.5rem}
  .config-section h2{margin-bottom:1rem}
  pre{background:#0f172a;padding:1rem;border-radius:8px;overflow-x:auto;font-size:.85rem;color:#a5f3fc}
  .tabs{display:flex;gap:4px;margin-bottom:1rem}
  .tab{padding:6px 16px;border-radius:6px;cursor:pointer;background:#334155;color:#e2e8f0;border:none;font-size:.85rem}
  .tab.active{background:#2563eb;color:#fff}
  #result{background:#0f172a;padding:1rem;border-radius:8px;margin-top:1rem;display:none;font-size:.85rem;max-height:400px;overflow:auto}
  #tryModal{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.7);z-index:100;align-items:center;justify-content:center}
  #tryModal.show{display:flex}
  .modal{background:#1e293b;border-radius:12px;padding:2rem;width:90%;max-width:600px;max-height:80vh;overflow:auto}
  .modal h3{margin-bottom:1rem}
  textarea{width:100%;background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:8px;padding:.75rem;font-family:monospace;font-size:.85rem;min-height:120px;resize:vertical}
  .modal-actions{display:flex;gap:8px;margin-top:1rem;justify-content:flex-end}
</style>
</head><body>
<h1>CMS MCP Hub Gateway</h1>
<p class="subtitle">Universal REST API for AI-powered CMS management</p>

<div class="stats">
  <div class="stat"><div class="stat-value">${totalTools}</div><div class="stat-label">Total Tools</div></div>
  <div class="stat"><div class="stat-value">${servers.length}</div><div class="stat-label">CMS Servers</div></div>
  <div class="stat"><div class="stat-value">${servers.filter((s) => s.ready).length}</div><div class="stat-label">Online</div></div>
</div>

<div class="config-section">
  <h2>Quick Setup</h2>
  <div class="tabs">
    <button class="tab active" onclick="showConfig('chatgpt')">ChatGPT</button>
    <button class="tab" onclick="showConfig('curl')">cURL</button>
    <button class="tab" onclick="showConfig('python')">Python</button>
    <button class="tab" onclick="showConfig('n8n')">n8n</button>
    <button class="tab" onclick="showConfig('openapi')">OpenAPI Spec</button>
  </div>
  <pre id="configBlock">ChatGPT Actions setup:
1. Go to ChatGPT → Create a GPT → Configure → Actions
2. Import URL: ${baseUrl}/openapi.json
3. Set Authentication: API Key, Header: X-API-Key
4. Key value: ${apiKey}
5. Save — all ${totalTools} tools are now available!</pre>
</div>

${serverCards}

<div id="tryModal" onclick="if(event.target===this)closeTry()">
  <div class="modal">
    <h3 id="tryTitle">Test Tool</h3>
    <p style="color:#94a3b8;margin-bottom:.5rem;font-size:.85rem">POST <code id="tryEndpoint"></code></p>
    <textarea id="tryBody">{}</textarea>
    <div id="result"><pre id="resultPre"></pre></div>
    <div class="modal-actions">
      <button class="btn" style="background:#334155" onclick="closeTry()">Close</button>
      <button class="btn" onclick="executeTool()">Execute</button>
    </div>
  </div>
</div>

<script>
const BASE="${baseUrl}",KEY="${apiKey}";
let curServer="",curTool="";

function showConfig(type){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  event.target.classList.add('active');
  const c=document.getElementById('configBlock');
  const configs={
    chatgpt:'ChatGPT Actions setup:\\n1. Go to ChatGPT → Create a GPT → Configure → Actions\\n2. Import URL: ${baseUrl}/openapi.json\\n3. Set Authentication: API Key, Header: X-API-Key\\n4. Key value: ${apiKey}\\n5. Save — all ${totalTools} tools are now available!',
    curl:'# List WordPress posts\\ncurl -X POST ${baseUrl}/api/wordpress/wp_list_posts \\\\\\n  -H "X-API-Key: ${apiKey}" \\\\\\n  -H "Content-Type: application/json" \\\\\\n  -d \'{"per_page": 5}\'\\n\\n# Create a WooCommerce product\\ncurl -X POST ${baseUrl}/api/woocommerce/woo_create_product \\\\\\n  -H "X-API-Key: ${apiKey}" \\\\\\n  -H "Content-Type: application/json" \\\\\\n  -d \'{"name": "Test Product", "regular_price": "29.99"}\'',
    python:'import requests\\n\\nAPI = "${baseUrl}"\\nKEY = "${apiKey}"\\nheaders = {"X-API-Key": KEY, "Content-Type": "application/json"}\\n\\n# List posts\\nres = requests.post(f"{API}/api/wordpress/wp_list_posts",\\n    json={"per_page": 5}, headers=headers)\\nprint(res.json())\\n\\n# Create product\\nres = requests.post(f"{API}/api/woocommerce/woo_create_product",\\n    json={"name": "T-Shirt", "regular_price": "19.99"},\\n    headers=headers)\\nprint(res.json())',
    n8n:'n8n HTTP Request Node:\\n- Method: POST\\n- URL: ${baseUrl}/api/wordpress/wp_list_posts\\n- Authentication: Header Auth\\n  - Name: X-API-Key\\n  - Value: ${apiKey}\\n- Body: {"per_page": 10}\\n\\nOr import the OpenAPI spec at:\\n${baseUrl}/openapi.json',
    openapi:'OpenAPI spec available at:\\n${baseUrl}/openapi.json\\n\\nImport this URL in:\\n- ChatGPT Actions\\n- Postman\\n- Swagger UI\\n- Any OpenAPI-compatible tool'
  };
  c.textContent=configs[type]||'';
}

function tryTool(server,tool){
  curServer=server;curTool=tool;
  document.getElementById('tryTitle').textContent=tool;
  document.getElementById('tryEndpoint').textContent=BASE+'/api/'+server+'/'+tool;
  document.getElementById('tryBody').value='{}';
  document.getElementById('result').style.display='none';
  document.getElementById('tryModal').classList.add('show');
}
function closeTry(){document.getElementById('tryModal').classList.remove('show')}
async function executeTool(){
  const body=document.getElementById('tryBody').value;
  const res=await fetch(BASE+'/api/'+curServer+'/'+curTool,{
    method:'POST',headers:{'X-API-Key':KEY,'Content-Type':'application/json'},body
  });
  const data=await res.json();
  document.getElementById('resultPre').textContent=JSON.stringify(data,null,2);
  document.getElementById('result').style.display='block';
}
</script>
</body></html>`;
}
