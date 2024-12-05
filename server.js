const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const jobsRoutes = require('./routes/jobs');
const applicationsRoutes = require('./routes/applications');
const interviewRoutes = require('./routes/interviews');
const companyRoutes = require('./routes/company');
const jobreviewRoutes = require('./routes/jobreview');
const bookmarksRoutes = require('./routes/bookmarks');
const { swaggerSpec, swaggerUi } = require('./swagger/swagger');
const cors = require('cors');
const crawl_saramin = require('./services/crawl_saramin'); // 크롤링 함수 import

dotenv.config();
const app = express();

sequelize.sync({ force: false }) // true일 경우 기존 테이블 삭제 후 재생성
    .then(() => {
        console.log('데이터베이스와 테이블이 성공적으로 동기화되었습니다.');
    })
    .catch((error) => {
        console.error('데이터베이스 동기화 중 오류 발생:', error.message); // 오류 메시지 출력
        console.error(error); // 전체 오류 객체를 출력해 상세 정보 확인
    });


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 인증 관련 라우터
app.use('/auth', authRoutes);

// 채용 공고 관련 라우터
app.use('/jobs', jobsRoutes);

app.use('/applications', applicationsRoutes);

app.use('/bookmarks', bookmarksRoutes);

app.use('/interviews', interviewRoutes);

app.use('/companies', companyRoutes);

app.use('/jobreviews', jobreviewRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 기본 라우트
app.get('/', (req, res) => {
    res.send('Job Info Backend API is running.');
});

// 서버 시작
const PORT = process.env.PORT;
const HOST = process.env.HOST;

// 서버 시작 시 크롤링 실행
async function startServer() {
    try {
        await crawl_saramin(3);
        
        console.log('서버 시작 전에 크롤링 완료');
        
        // 서버 실행
        app.listen(PORT, HOST, async () => {
            try {
                await sequelize.authenticate();
                console.log('Database connected successfully.');
            } catch (error) {
                console.error('Unable to connect to the database:', error);
            }
        });
    } catch (error) {
        console.error('크롤링 중 오류 발생:', error.message);
    }
}

// 서버 시작
startServer();
