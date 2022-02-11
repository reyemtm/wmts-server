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
  <link rel="preconnect" href="https://fonts.gstatic.com">
  <link href="https://fonts.googleapis.com/css2?family=Major+Mono+Display" rel="stylesheet">
  <link rel="stylesheet" href="/style.css">
  <style>
    :root {
      --primary: #1e88e5;
    }
    body {
      background-image: url(/preview-2.jpg)!important;
      background-size: cover;
    }
  </style>
</head>
<body class="dark-mode">
  <header class="container">
    <h1>${(config.SITE_TITLE) ? config.SITE_TITLE : "WMTS Server"}</h1>
    <p>
      ${config.SITE_ABOUT}
    </p>
  </header>
  <main class="container">
    <section id="app" class="container table-responsive">
      <table role="grid" class="table table-hover">
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
  <footer class="">
    <div class="container">
      <div class="container-sm font-weight-light font-size-12 text-muted center">
        a project by <a href="${config.SITE_AUTHOR_URL}">${config.SITE_AUTHOR_URL_NAME} | ${config.SITE_AUTHOR}</a>
      </div>
    </div>
  </footer>
</body>
</html>`
}