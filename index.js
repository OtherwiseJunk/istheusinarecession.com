import * as http from "http";
import fetch from "node-fetch";
import * as fs from "fs";

const sahmRuleMap = new Map();
const title = "Is the US In a recession?";
const description =
  "Uses the Real-time Sahm Rule Recession Indicator: https://fred.stlouisfed.org/series/SAHMREALTIME.\n\nModel is updated monthly based on a moving average of the unemployment rate (U3), so not quite Real-Time.";
const noRecessionImage =
  "https://upload.wikimedia.org/wikipedia/commons/8/8a/Stonks_emoji.png";
const recessionImage =
  "https://cacheblasters.nyc3.digitaloceanspaces.com/thisisfine.webp";

http
  .createServer(async function (req, res) {
    if (req.url === "/favicon.ico") {
      sendFavicon(res);
    } else {
      sendSahmRuleIndex(res);
    }
  })
  .listen(112);

function sendFavicon(res) {
  res.writeHead(200, { "Content-Type": "image/x-icon" });
  fs.createReadStream("favicon.ico").pipe(res);
}

async function sendSahmRuleIndex(res) {
  res.writeHead(200, { "Content-Type": "text/html" });
  var isRecessionText = "";
  var recessionClass = "";
  var isRecessionImageURL = "";

  if (await recessionCheck()) {
    isRecessionText = "yes.";
    recessionClass = "recession";
    isRecessionImageURL = recessionImage;
  } else {
    isRecessionText = "no.";
    recessionClass = "noRecession";
    isRecessionImageURL = noRecessionImage;
  }
  var html = `
  <!DOCTYPE html>
    <head>
        <title>${title} ${isRecessionText}*</title>
        <meta property="og:title" content="${title} ${isRecessionText}*" />
        <meta property="description" content="${description}" />
        <meta property="og:description" content="${description}" />
        <meta property="image" content="${isRecessionImageURL}" />
        <meta property="og:image" content="${isRecessionImageURL}" />
        <style>
            a { color: inherit; text-decoration: none;}
            a:hover { color: inherit; text-decoration: none; cursor:pointer; }
            * { box-sizing: border-box }
            .container { position:fixed; width:100%; height:100%; top:0px; left:0px; margin-left: auto; margin-right: auto; }
            .recession { background-image: url('${recessionImage}'); background-repeat: no-repeat; background-size:100% 100%; -webkit-text-stroke-width: 10px; -webkit-text-stroke-color: black;}
            .noRecession { background-color: black; }
            .text{font-size: 30.0vw; margin: 0; position: absolute; top: 45%; left: 50%; -ms-transform: translate(-50%, -50%); transform: translate(-50%, -50%); color: white; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container ${recessionClass}">
            <h1 class="text"><a href="https://fred.stlouisfed.org/series/SAHMREALTIME"/>${isRecessionText}</h1>
            <a style="display: none;" rel="me" href="https://mastodon.cacheblasters.com/@OtherwiseJunk">Mastodon</a>
            <a style="display: none;" rel="me" href="https://mastodo.neoliber.al/@OtherwiseJunk">Mastodon</a>
        </div>
    </body>
</html>`;
  res.end(html);
}

async function recessionCheck() {
  var isRecession;
  const now = new Date();
  var dateKey = `${now.getYear()}-${now.getMonth()}-${now.getDay()}-${now.getHours()}`;

  if (sahmRuleMap.has(dateKey)) {
    return sahmRuleMap.get(dateKey);
  }

  await fetch(process.env.SAHM)
    .then((response) => {
      return response.json();
    })
    .then(function (json) {
      isRecession = json.isRecession;
      sahmRuleMap.set(dateKey, isRecession);
    });

  return isRecession;
}
