module.exports = (layers) => {
  return /*html*/`<!DOCTYPE html>
    <html lang="en" data-theme="dark">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WMTS-Server</title>
      <link rel="stylesheet" href="https://unpkg.com/@picocss/pico@latest/css/pico.min.css">
      <style>
        :root {
          --primary: #1e88e5;
        }
      </style>
    </head>
    <body>
      <main class="container">
        <h1>WMTS Server Layers</h1>
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
                  <td>${(d.includes("http")) ? `<a href="${d}">${d}</a>` : d}</td>
                `
              }).join("")}</tr>`
            }).join("")}
          </table>
        </section>
      </main>
    </body>
  </html>`
}