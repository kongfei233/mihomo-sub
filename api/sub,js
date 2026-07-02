import axios from "axios";
import yaml from "js-yaml";

export default async function handler(req, res) {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).send("missing url");
    }

    // 1️⃣ 拉取 YAML
    const resp = await axios.get(url);
    const data = yaml.load(resp.data);

    if (!data.proxies) {
      return res.status(400).send("no proxies found");
    }

    // 2️⃣ 过滤 anytls
    const nodes = data.proxies
      .filter(p => p.type === "anytls")
      .map(p => {
        const name = encodeURIComponent(p.name || "node");
        const sni = p.sni || "www.baidu.com";
        const insecure = p.insecure ? 1 : 0;

        return `anytls://${p.uuid}@${p.server}:${p.port}/?insecure=${insecure}&sni=${sni}#${name}`;
      });

    // 3️⃣ Base64
    const base64 = Buffer.from(nodes.join("\n")).toString("base64");

    // 4️⃣ 返回
    res.setHeader("Content-Type", "text/plain");
    res.status(200).send(base64);

  } catch (err) {
    res.status(500).send("error: " + err.message);
  }
}
