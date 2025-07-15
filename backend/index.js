const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('KIMS 백엔드 작동 중!');
});

// app.use('/api', require('./routes/api')); ← 필요 시 사용

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
