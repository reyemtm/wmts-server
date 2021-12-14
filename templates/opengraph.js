const getConfig = require("../lib/getConfig.js");

module.exports = (opts) => {
  const config = getConfig(opts);

  return `
  <!-- BEGIN OPENGRAPH -->

  <title>${config.SITE_TITLE}${(config.PAGE_TITLE) ? " | " + config.PAGE_TITLE : ""}</title>
  <meta property="og:site_name" content="${config.SITE_TITLE}" />
  <meta property="og:title" content="${config.SITE_TITLE}" />
  <meta property="og:description" content="${config.SITE_ABOUT}" />
  <meta property="og:url" content="https://${config.HOST}" />
  <meta property="og:type" content="website" />
  <meta property="article:publisher" content="https://${(config.SITE_PUBLISHER) ? config.SITE_PUBLISHER : config.HOST}" />
  <meta property="og:image" content="${(config.SITE_IMG) ? config.SITE_IMG : `https://${config.HOST}/preview.png`}" />
  <!-- REPLACE THESE DIMENSIONS WITH THE ACTUAL DIMENSIONS -->
  <meta property="og:image:width" content="2307" />
  <meta property="og:image:height" content="1413" />
  ${(config.TWITTER) ? `<meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:image" content="${(config.SITE_IMG) ? config.SITE_IMG : `https://${config.HOST}/preview.png`}" />
  <meta property="twitter:site" content="${config.TWITTER}" />` : ''}
  <!-- ADD YOUR OWN FAVICON IF YOU WANT-->
  <link rel="apple-touch-icon" sizes="180x180" href="https://${config.HOST}/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="https://${config.HOST}/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="https://${config.HOST}/favicon-16x16.png">
  <link rel="manifest" href="https://${config.HOST}/site.webmanifest">
  
  <!-- END OPENGRAPH -->
`
}