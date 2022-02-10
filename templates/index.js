const getConfig = require("../lib/getConfig.js");
const opengraph = require("./opengraph.js");

module.exports = (layers) => {
const config = getConfig();
return /*html*/`<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${opengraph()}
  <link rel="stylesheet" href="/pico.min.css">
  <style>
    :root {
      --primary: #1e88e5;
    }
  </style>
</head>
<body>
  <main class="container">
    <h1>${(config.SITE_TITLE) ? config.SITE_TITLE : "WMTS Server"}</h1>
    <section id="app">
      <table role="grid">
        <tr>
          <th scope="col">Layer</th>
          <th scope="col">Tilejson</th>
          <th scope="col">WMTS</th>
          <th scope="col">Preview</th>
        </tr>  
        ${layers.map(r => {
          return `<tr>${Object.values(r).map(d => {
            return `
              <td>${(d.includes("http")) ? `<a href="${d}">Link</a>` : d}</td>
            `
          }).join("")}</tr>`
        }).join("")}
      </table>
    </section>
  </main>
</body>
</html>`
}