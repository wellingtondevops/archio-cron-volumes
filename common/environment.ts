

export const environment = {

    server: { port: process.env.SERVER_PORT || 3006 },
    
    
    //urlamqp: { amqpurl: process.env.AMQP_URL || "amqp://guest:guest@localhost:5672"},  

    
    urlamqp: { amqpurl: process.env.AMQP_URL || "amqp://archio:archio@localhost:5672"}, 
    emailservice:{url: process.env.EMAIL_SERVICE|| "https://apidev.archio.com.br/users"},


    //novo banco ja com ajsute de relat[rios]
     
    // db: { url: process.env.DB_URL || "mongodb://archioDB:AbsuHS7eHTup32oerzoetm9Zr1lA29@cluster0-shard-00-00-rr6sx.mongodb.net:27017/archioProduction?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin" },
    db: { url: process.env.DB_URL || "mongodb://earchiveTester:cdh0tAYUFJXDMB3t@cluster0-shard-00-00-rr6sx.mongodb.net:27017/earchive?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin" },
    api:{
        api_upload:process.env.API_UPLOAD || "https://mupload.archio.com.br/api/posts/multidelete"
    },
    email:{

        sendgridkey: process.env.SEND_MAIL || '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',
        template: process.env.EMAIL_TMPL || 'Seja bem vindo ao Archio <strong>{0}</stro::]]]]ng>!<br><br>Seu usuário para acesso é <strong>{1}</strong>, e sua senha : <strong>{2}</strong><br><br>O endereço de acesso é <strong>https://archio.com.br/login</strong><br><br><br><br>Atenciosamente,<br><br>Equipe Smartscan. ',
        forgot: process.env.EMAIL_TMPL ||'<strong>Sua nova Senha é: {2}</strong>',
        urlapiEmail: process.env.URLAPI || 'https://apidev.archio.com.br/users'
    },


    security:
    {
        saltRounds: process.env.SALT_ROUNDS || 10,
        apiSecret: process.env.API_SECRET || '4485445487-39112589-09898',

        enableHTTPS: process.env.ENABLE_HTTPS || false,
        certificate: process.env.CERTI_FILE || './security/keys/cert.pem',
        key: process.env.CERT_KEY_FILE || './security/keys/cert.pem',
        firebase: process.env.FIREBASE || './security/keys/archionotifier-firebase-adminsdk-cpecv-146c40d8c5.json'

    },
    log: {
        level: process.env.LOG_LEVEL || 'debug',
        name: 'archio-api-logger'
    },
    smtp:{
        host: "smtp.gmail.com",
        port: 587,
        user:"suporte@archio.com.br",
        pass: "@rchi0$up0rtPa$$"
         
    },
    redis:{
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        keyPrefix: 'cache'
    },
    firebase: {

        type: process.env.TYPE || "service_account",
        project_id: process.env.PROJECT_ID || "archionotifier",
        private_key_id: process.env.PRIVATE_KEY_ID || "146c40d8c5c677b737ee8bc4aebe20250141530a",
        private_key: process.env.PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDT4035yGahEiaH\n6JjEyw/aul+fdXR3d4Sv+moJLRTrHvQQA8/r+g7NG7B6179ujYRwyPjD/sTrPB8U\n8Aizub4ew2jNPIEo/eU0RCqx3a7YAnZ6Jq4ly6FsJrA5hxlPtDlStarjMZl5m4Hi\nol1UYlVBvVXyFL4K4r4NuyPKTM3HfLQ7ElUUNbES06H+bkjSd4IkdSwmW/YeLjfj\neJ210/38CF9hsbsYwV/BlZqRlCn0roRVgYWf6q62PppGHsfk9N0M/iU8t0lWIKNX\nx8vT0q/2H0Kk0mzXpyFIpDs47lkS5AHrv1BtgBuzpViuwI0d77IVgEqhJ1m1PQrp\nUK4DNftDAgMBAAECggEAN9XwWGA82zkjOjFLAKDaHrN6O1UCSfEO4CjHBIACwSq4\n+fdnNTIB8H7ZdKWh5ooYWng7Rbq/PZXsQuI2CNZriUPJPDwzdQ/i9HD6J0DZsEaF\n3g6PWZpdgVh4m9BEFULS0D7bN198qBUYlxZeLbxz5wzztwVMRyYVGx0zgz3WBDkX\nYpEEcMjRdvLqrv+9Vv+P5jJFg7LAJWfqTh1IJmFXiO6oiLBuRFlNmZ0QvYBvKFuq\ngPxWwMwJcnpufTjI/aSmIkSOQxcq/ZyHaEptmy8crjVjz0ckGL8FyhRbD352TRag\nlozM75J2jhxHfzXPgTgHLghs7qhrfZVjznAixHe6sQKBgQD5mD1C7TE9QJULdjSg\nl/QFNJI+COe85PFLlFtZmfxuJwU+P7z+MGXCVEPGCJcduQdVtOTeWzWUI4Lhk00J\nkLBUWXqvo0DTYkVkcZ3UwuxfGVs9P5ZJVmxPeJgAnV7Fw0lb6NUEan/QmeIcZAZW\nXOXWvUhyM8P8Qmbyn7tVYFWf/wKBgQDZU1fjIrMv2Do8Qkg9A81LlCghSS3YKF44\ngDcsZXZpG/vYH02a1PmpqFYnRVjD4hPxhAUaVyLSrA2uNWyV4nWDh3K7ES9WP6QH\nPWq3GBBEoNk338BBCOB6VpzFD3ULaq//vBkd58tXofotRL+/Srmgb38pSaTLFRSC\nqaPLxoEkvQKBgQDA/F55zg5hbvsPJrGgbn1mPPTKdHZCDr8nkiljyXVt8kvSitPl\nsqQrsp3IlEHL4JH0Se8gomN2DFMZeZx6Rd6hCaKcBV2NVBGVjWfc525+RYvPesgI\nIoOSmwrkhsmNneat4wQ56uKy9xjmnMxtoFyyQh6u9qmV9f3FoY3mgJsUHwKBgFhX\n8eUqSO8NFfdC9nyfHAg6LOoDBnjVSB/ttv/8KttlfcYIS5LCOs9F1+fU39WZBIRs\nJ2riuwwq1tDXdNGlIiIaoH/852JHMpWi2MufI5XSURrOgSeuxRnWNZpBw1Glx+/M\ndeVbQaTY+osGZHANn1HhoS6Wej/3zMOk1CnVAtB9AoGAQzUvA0U3Yx3EbmD7zYZb\ng5e6FaG87P/8YDNSOwyWRmC5Nh757Hl43ewTFkoLXDwV7Ahi+DWyjP1pWOKHSAti\nusB/EG1LNydNspND9Yml6zmEVtkdRd+nA7eqh4LmykSUoMEBM1K0Xt/LtYZXQUvt\nGhrb7MmyMimuZYRTaysy754=\n-----END PRIVATE KEY-----\n",
        client_email: process.env.CLIENT_EMAIL || "firebase-adminsdk-cpecv@archionotifier.iam.gserviceaccount.com",
        client_id: process.env.CLIENT_ID || "114314086239299810145",
        auth_uri: process.env.AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
        token_uri: process.env.TOKEN_URI || "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.CLIENT_X509_CERT_URL || "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-cpecv%40archionotifier.iam.gserviceaccount.com",
        databaseURL: process.env.DATABASEURL || 'https://archionotifier-default-rtdb.firebaseio.com/'

    },
    icons:{
        iconerror: process.env.ICONERROR||"https://storage.googleapis.com/archiobucket/ARCHIOFILES/icons/errors.png",
        iconsuscess: process.env.ICONSUSCESS ||"https://storage.googleapis.com/archiobucket/ARCHIOFILES/icons/sucess.png"
    }
       


}


