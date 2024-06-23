const express = require("express")
const { createHandler } = require("graphql-http/lib/use/express")
const { buildSchema } = require("graphql")
const expressPlayground = require('graphql-playground-middleware-express')
  .default
const axios = require('axios')
const schema = require('./schema/schema')
const mongoose = require('mongoose')

const app = express();

mongoose.connect("mognodb url")

mongoose.connection.once('open',()=>{
    console.log('Connected to database'); 
})

app.get('/playground', expressPlayground({ endpoint: '/graphql' }))
app.all('/graphql',createHandler({
    schema,
    graphiql:true
}));

app.listen(4000,()=> console.log("Started on port 4000"))
