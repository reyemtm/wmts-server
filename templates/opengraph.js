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
  <meta property="og:image" content="${(config.SITE_IMG) ? config.SITE_IMG : 'https://pandemix.netlify.app/pandemix.png'}" />
  <meta property="og:image:width" content="1600" />
  <meta property="og:image:height" content="800" />
  ${(config.TWITTER) ? `<meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:image" content="${(config.SITE_IMG) ? config.SITE_IMG : 'https://pandemix.netlify.app/pandemix.png'}" />
  <meta property="twitter:site" content="${config.TWITTER}" />` : ''}
  <!-- END OPENGRAPH -->
`
}