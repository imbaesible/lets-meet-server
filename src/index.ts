import express from "express";
import http from "http";

const port = 8080;
const app = express()
const server = http.createServer(app);

server.listen(port, () => {
    console.log('Gopii ki krda piyan? 💀')
})
