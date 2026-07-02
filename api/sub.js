import yaml from "js-yaml";

export default async function handler(req, res) {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).send("missing url");
    }

    // 1️⃣ 请求远程 YAML（关键：加浏览器伪装头）
    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
        "Accept": "text/html,application/json,text/plain,*/*",
        "Referer": "https://www.google.com/",
      },
    });

    if (!resp.ok) {
      throw new Error(`Fetch failed: ${resp.status}`);
    }

    const text = await resp.text();

    // 2️⃣ 解析 YAML
    const data = yaml.load(text);

    if (!data?.proxies) {
      return res.status(400).send("no proxies found");
    }

    // 3️⃣ 过滤 anytls
    const nodes = data.proxies
      .filter(p => p.type === "anytls")
      .map(p => {
        const name = encodeURIComponent(p.name || "node");
        const sni = p.sni || "www.baidu.com";
        const insecure = p.insecure ? 1 : 0;

        return `anytls://${p.uuid}@${p.server}:${p.port}/?insecure=${insecure}&sni=${sni}#${name}`;
      });

    if (nodes.length === 0) {
      return res.status(400).send("no anytls nodes");
    }

    // 4️⃣ Base64 输出订阅
    const base64 = Buffer.from(nodes.join("\n")).toString("base64");

    res.setHeader("Content-Type", "text/plain");
    res.status(200).send(base64);

  } catch (err) {
    res.status(500).send("error: " + err.message);
  }
}
