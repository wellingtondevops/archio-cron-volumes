module.exports = {
  apps : [{
    name   : "earchive-api ",
    script : "./main.js",
    instances: 0,
    exec_mode: "cluster",
    watch: true,
    merge_logs: true,
    env: {
      SERVER_PORT: 3006,
      URLAPI: "https://apidev.archio.com.br/users",
      SERVER_AMQP:"amqp:arhio@archio@localhost:5673",
      
      NODE_ENV: "production",
      AMQP_URL:"amqp://archio:archio@rabbitmq",
      EMAIL_SERVICE: "https://apidev.archio.com.br/users"  ,
      API_UPLOAD: "https://muploadprod.archio.com.br/api/posts/multidelete" ,
      REDIS_HOST : 'redis',
      REDIS_PORT : 6379

    }
  }]
}