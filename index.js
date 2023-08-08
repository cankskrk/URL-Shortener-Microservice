require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const cors = require("cors");
const app = express();

const dns = require("dns");
const urlParser = require("url");

// Basic Configuration
const PORT = process.env.PORT;

// Mongodb Operations
const { MongoClient } = require("mongodb");
const client = new MongoClient(process.env.MONGO_URI);
const db = client.db("urlshortener");
const urls = db.collection("urls");

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.post("/api/shorturl/", (req, res) => {
  const url = req.body.url;
  const dnslookup = dns.lookup(
    urlParser.parse(url).hostname,
    async (err, address) => {
      if (!address) {
        res.json({ error: "Invalid URL" });
      } else {
        const urlCount = await urls.countDocuments({});
        const urlDoc = {
          url,
          short_url: urlCount,
        };

        const result = await urls.insertOne(urlDoc);

        res.json({ original_url: url, short_url: urlCount });
      }
    }
  );
});

app.get("/api/shorturl/:short/", async (req, res) => {
  const short = req.params.short;
  const toRedirect = await urls.findOne({ short_url: +short });

  if (!toRedirect) {
    res.json({ error: "Short URL is not found!" });
  } else {
    res.redirect(toRedirect.url);
  }
});

app.listen(PORT, function () {
  console.log(`Listening on port ${PORT}`);
});
