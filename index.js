import express from "express";
import fetch from "node-fetch";
import https from "node:https";

const app = express();
const PORT = process.env.PORT || 3000;

// Büyük dosyalarda bağlantı kopmasın diye keep-alive
const httpsAgent = new https.Agent({ keepAlive: true });

app.get("/status", (_, res) => {
  res.type("text/plain").send("ok");
});

app.get("/", async (req, res) => {
  const raw = req.query.url;
  if (!raw) return res.status(400).send("Missing ?url=");

  // url paramı encode/encode değil — ikisini de tolere et
  let target = raw;
  try { target = decodeURIComponent(raw); } catch (_) {}

  try {
    const response = await fetch(target, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/pdf",
        "Referer": "https://www.resmigazete.gov.tr/",
      },
      redirect: "follow",
      // Büyük PDF’ler için süreyi artır
      timeout: 120000, // 120 sn
      agent: httpsAgent,
    });

    if (!response.ok) {
      return res.status(response.status).send(`Fetch failed: ${response.status}`);
    }

    // PDF’i stream olarak doğrudan ilet
    res.setHeader("Content-Type", "application/pdf");
    response.body.pipe(res);
    response.body.on("error", () => {
      try { res.end(); } catch {}
    });
  } catch (err) {
    res.status(500).send("Proxy error: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log("RG proxy running on port " + PORT);
});
