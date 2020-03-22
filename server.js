const express = require('express')
const app = express()
const port = 3000

app.listen(process.env.PORT || 3002, () => {
  console.log(`Server listening`)
})

app.use(express.static('public'))
