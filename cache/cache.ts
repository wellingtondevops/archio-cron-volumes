


const Redis = require("ioredis");
import { environment } from '../common/environment'



class cache {
  redis: any;
  constructor() {
    try {
      this.redis = new Redis({
        host: environment.redis.host,
        
        port: environment.redis.port,
        // keyPrefix: environment.redis.keyPrefix
      });
    } catch (error) {
      console.log(error)
      
    }
   
  }

  async get(key) {

    try {

      const value = await this.redis.get(key);

      return value ? JSON.parse(value) : null
    } catch (error) {
      console.log(`${key}-->`, error)
    }


  }

  set(key, value, timeExp) {
    try {

      return this.redis.set(key, JSON.stringify(value), "EX", timeExp);

    } catch (error) {
      console.log(`${key}-->`, error)
    }


  }

  del(key) {

    try {
      return this.redis.del(key);

    } catch (error) {
      console.log(`${key}-->`, error)
    }

  }

  async delPrefix(prefix) {

    const keys = (await this.redis.keys(`${prefix}:*`))

    try {
      return this.redis.del(keys)

    } catch (error) {
      console.log(`${keys}-->`, error)

    }

  }
  async delPrefixx(prefix) {
    const keys = (await this.redis.keys(`${prefix}:*`))

    try {
      return this.redis.del(keys);

    } catch (error) {
      console.log(`${keys}-->`, error)

    }


  }
}
module.exports = new cache();