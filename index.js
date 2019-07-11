const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT || 8500;
const app = express();

app.use(cors());
app.use('/', express.static(__dirname + '/static'));

app.listen(PORT, () => console.log(`Serving at ${PORT}`));