const fp = require('fastify-plugin');
const crypto = require("crypto");

module.exports = fp(function (app, options, done) {

  app.register(require('fastify-jwt'), {
    secret: process.env.SECRET || crypto.randomBytes(20).toString('hex'),
    cookie: {
      cookieName: options.cookieName,
      signed: false
    }
  })
  .register(require('fastify-cookie'))

  /**
 * Simple testing of authoriztion for routes.
 * Use genKeys.js to create a sample keys file at the root of the project.
 * @param {String} request 
 * @returns 
 */
  const apiKeyURLVerify = async (request, reply) => {
    

    if (!request.params.database) return true
    if (!options.keys || !options.keys.length) return true

    const routeKeys = options.keys.filter(k => k.file === request.params.database)

    //CHECK IF KEYS EXIST
    if (!routeKeys.length) return true

    //CHECK IF COOKIE EXISTS
    const cookie = request.cookies[options.cookieName] || null;

    //CHECK IF COOKIE IS VALID
    if (cookie) {
      try {
        app.jwt.verify(cookie)
        app.log.info("valid cookie")

        //CHECK IF THE VALID apiKey INSIDE THE COOKIE MATCHES ONE OF THE ROUTE KEYS
        const { apiKey } = cookie ? app.jwt.decode(cookie) : null;
        if (apiKey && routeKeys[0].keys.includes(apiKey)) return true
        app.log.warn("Valid cookie but does not match route keys!")
        
      } catch (err) {
        if (err.code && err.code != "FAST_JWT_INVALID_SIGNATURE") {
          throw new Error("unknown token verification error")
        } else {
          app.log.warn("Token authorization failed!")
        }
      }
    }

    //IF COOKIE IS INVALID OR DOES NOT EXIST, CHECK FOR A KEY AND SET A NEW COOKIE   
    const rawApiKey = (request.query.key) ? request.query.key : request.headers.origin ? request.headers.origin : request.headers.referer ? request.headers.referer : null;
    const url = rawApiKey && rawApiKey.includes("http") ? new URL(rawApiKey) : null
    const apiKey = url ? url.host : rawApiKey
    // console.log(apiKey)

    if (!apiKey) return false

    //CHECK IF THE KEY EXISTS IN THE KEY REGISTRY
    if (apiKey && routeKeys[0].keys.includes(apiKey)) {

      const expireDate = options.exipres || new Date().getTime() + (60 * 60 * 24 * 1000 * 1);

      const token = app.jwt.sign({
        apiKey: apiKey,
        expiresIn: expireDate
      });
      reply
        .setCookie(options.cookieName, token, {
          domain: process.env.HOST,
          path: '/',
          secure: false,
          httpOnly: true,
          sameSite: true,
          expires: expireDate
        })
      return true
    }
    return false
  }

  // app.addHook('onSend', (request, reply, payload, done) => {
  //   if (reply.statusCode === 401) console.log(true)
  //   console.log(payload)
  //   done()
  // })

  app.addHook('onRequest', async (request, reply) => {
    try {
      const authorized = await apiKeyURLVerify(request, reply);
      if (!authorized) return reply.status(401).send("Unauthorized")
    } catch (err) {
      reply.send(err)
    }
  })

  done()
})
