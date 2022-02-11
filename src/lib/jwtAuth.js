const fp = require('fastify-plugin');

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
 * This will work when a KEYS environment variable is provided which should be a comma separated list.
 * This variable could be replaced with something more fancy like a db call to get keys.
 * This leaves all routes accessible to those with a key, improvements could include per route authorization.
 * Per route authorization could be done by adding routes to the keys.
 * @param {String} request 
 * @returns 
 */
  const apiKeyURLVerify = async (request, reply) => {
    //CHECK IF KEYS EXIST
    if (!options.keys) return true

    //CHECK IF COOKIE EXISTS
    const cookie = request.cookies[options.cookieName] || null;

    //CHECK IF COOKIE IS VALID
    if (cookie) {
      try {
        app.jwt.verify(cookie)
        return true
      } catch (err) {
        if (err.code && err.code != "FAST_JWT_INVALID_SIGNATURE") {
          throw new Error("unknown token verification error")
        } else {
          console.log("Token authorization failed!")
        }
      }
    }

    //IF COOKIE IS INVALID OR DOES NOT EXIST, CHECK FOR A KEY AND SET A NEW COOKIE   
    const apiKey = (request.query.key) ? request.query.key : request.headers.origin ? request.headers.origin : request.headers.referer ? request.headers.referer : null;
    console.log(apiKey)
    if (!apiKey) return false

    //CHECK IF THE KEY EXISTS IN THE KEY REGISTRY
    if (apiKey && options.keys.includes(apiKey)) {

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