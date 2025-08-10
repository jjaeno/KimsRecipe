require('dotenv').config(); //환경변수
const express = require('express');
const cors = require('cors');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});

const authRoutes = require('./routes/auth')
app.use('/api/auth', authRoutes); //회원가입, 로그인, 아이디 중복 확인 api
const storeRoutes = require('./routes/stores')
app.use('/api/stores', storeRoutes); //호점 목록 불러오기 api




