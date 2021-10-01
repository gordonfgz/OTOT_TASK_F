const e = require('express');
const express = require('express');
const axios = require('axios');
const cors = require("cors");
const Redis = require('redis');
const Pool = require('pg').Pool;
const pool = new Pool ({
    user:'postgres',
    host:'localhost',
    database:'taskf',
    password:'password',
    port:'5432'
});

module.exports = pool;

const app = express();
app.use(express.json());
app.use(cors())
app.use(express.urlencoded({extended: true}));

const redisClient = Redis.createClient()

const DEFAULT_EXPIRATION = 3600



const PORT = process.env.PORT || 3000;

module.exports = app

app.get('/', (req, res) => {
  res.send('Hello Wo00rld!')
})

app.get('/photos', async (req, res) => {
  const albumId = req.query.albumId
  const photos = await getOrSetCache(`photos?albumId=${albumId}`, async () => {
    const {data} = await axios.get(
      "https://jsonplaceholder.typicode.com/photos",
      { params: { albumId } }
    )
    return data
  })
  res.json(photos) 
})

app.get("/photos/:id", async (req, res) => {
  const photo = await getOrSetCache(`photos:${req.params.id}`, async () => {
    const {data} = await axios.get(
      `https://jsonplaceholder.typicode.com/photos/${req.params.id}`
    )
    return data
  })
  res.json(photo) 
})


app.get("/CarOwners/:id", async (req, res) => {
  const data = await getOrSetCache(`CarOwners:${req.params.id}`, async () => {
    const data = await pool.query("SELECT * FROM CarOwners")
    return data.rows
  })
  res.json(data) 
})


function getOrSetCache(key, cb) {
  return new Promise((resolve, reject) => {
    redisClient.get(key, async (error, data) => {
      if (error) return reject(error)
      if (data != null) return resolve(JSON.parse(data))
      const freshData = await cb()
      redisClient.setex(key, DEFAULT_EXPIRATION, JSON.stringify(freshData))
      resolve(freshData)
    })
  })
}




app.listen(PORT, () => {
  console.log(`listening at http://localhost:${PORT}`)
})