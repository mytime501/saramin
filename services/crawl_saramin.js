const axios = require('axios');
const cheerio = require('cheerio');
const { Job } = require('../models'); // Job 모델 import
const { sequelize } = require('../models'); // sequelize 인스턴스 가져오기

async function crawl_saramin(pages) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    // Jobs 테이블의 데이터가 있는지 확인
    const jobCount = await Job.count();
    if (jobCount > 0) {
        console.log("Jobs 테이블에 데이터가 이미 존재합니다. 크롤링을 실행하지 않습니다.");
        return;
    }

    try {
        // 1. 외래 키 제약 조건 해제
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        console.log("Foreign key checks disabled.");

        // 2. Jobs 테이블 삭제
        await sequelize.getQueryInterface().dropTable('jobs');
        console.log("Jobs 테이블 삭제 완료.");

        // 3. Jobs 테이블 재생성
        await Job.sync();
        console.log("Jobs 테이블 재생성 완료.");

        // 4. 외래 키 제약 조건 다시 활성화
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log("Foreign key checks re-enabled.");
    } catch (error) {
        console.error("테이블 재생성 중 에러 발생:", error);
        return;
    }

    console.log("Jobs 테이블에 데이터가 없습니다. 크롤링을 시작합니다.");

    for (let page = 1; page <= pages; page++) {
        const url = `https://www.saramin.co.kr/zf_user/jobs/public/list?page=${page}&&type=all&page_count=50&isAjaxRequest=y`;

        try {
            const response = await axios.get(url, { headers });
            const $ = cheerio.load(response.data);

            const jobListings = $('.box_item');
            jobListings.each(async (_, job) => {
                try {
                    const rawJobData = {
                        title: $(job).find('.job_tit a').text(),
                        company: $(job).find('.company_nm a').text(),
                        link: 'https://www.saramin.co.kr' + $(job).find('.job_tit a').attr('href'),
                        location: $(job).find('.work_place').text(),
                        education: $(job).find('.education').text(),
                        career: $(job).find('.career').text(),
                        deadline: $(job).find('.support_detail .date').text(),
                        techStack: $(job).find('.job_sector span').map(function() {
                            return $(this).text().trim(); // 각 span의 텍스트를 가져와서 앞뒤 공백을 제거
                        }).get().join(', ') || null, // 배열로 변환 후 쉼표로 결합   
                        description: $(job).find('.job_tit a').text(),                     
                        salary: $(job).find('.salary').text(),
                    };

                    // 데이터 정규화 및 유효성 검사
                    const normalizedData = validateAndNormalizeJobData(rawJobData);
                    if (!normalizedData) {
                        return;
                    }

                    // 중복 데이터 확인
                    const existingJob = await Job.findOne({ where: { link: normalizedData.link } });
                    if (existingJob) {
                        return; // 이미 존재하는 데이터는 삽입하지 않음
                    }

                    // 데이터 저장
                    await Job.create(normalizedData);
                } catch (error) {
                    console.error(`항목 파싱 중 에러 발생: ${error}`);
                }
            });

            console.log(`${page}페이지 크롤링 완료`);
        } catch (error) {
            console.error(`페이지 요청 중 에러 발생: ${error}`);
        }
    }
}

// 데이터 정규화 및 유효성 검사 함수
function validateAndNormalizeJobData(rawData) {
    const normalizedData = {};

    // 필수 필드 확인
    if (!rawData.title || !rawData.company || !rawData.link) {
        console.error('필수 필드 누락: title, company, 또는 link가 없습니다.');
        return null;
    }

    // 문자열 트림 및 null 처리
    normalizedData.title = rawData.title.trim();
    normalizedData.company = rawData.company.trim();
    normalizedData.link = rawData.link.trim();
    normalizedData.location = rawData.location?.trim() || null;
    normalizedData.education = rawData.education?.trim() || null;
    normalizedData.techStack = rawData.techStack?.trim() || null;
    normalizedData.description = rawData.title.trim();
    normalizedData.salary = rawData.salary?.trim() || null;

    // 경력 및 고용형태 처리
    const careerParts = rawData.career.split('·').map(part => part.trim());
    normalizedData.experience = careerParts[0] || null;
    normalizedData.employmentType = careerParts[1] || null;

    // 날짜 형식 변환
    normalizedData.deadline = formatDeadline(rawData.deadline);

    return normalizedData;
}

// 날짜 형식 변환 함수 (D-day, D+X 또는 ~MM.DD 형태 처리)
function formatDeadline(deadline) {
    const today = new Date();
    let formattedDate = null;

    // D-3 또는 D+X 처리
    const dDayMatch = deadline.match(/D-?(\d+)/); // D-3 또는 D+X 형태
    if (dDayMatch) {
        const daysBefore = parseInt(dDayMatch[1], 10);
        today.setDate(today.getDate() - daysBefore); // D-3인 경우 3일 전으로 설정
        formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD 형식으로 변환
        return formattedDate;
    }

    // ~MM.DD(요일) 처리
    const dateMatch = deadline.match(/~(\d{2})\.(\d{2})\((.)\)/);
    if (dateMatch) {
        const month = parseInt(dateMatch[1], 10) - 1; // 월은 0부터 시작
        const day = parseInt(dateMatch[2], 10);
        const year = today.getFullYear(); // 현재 연도로 설정

        const targetDate = new Date(year, month, day);
        formattedDate = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식으로 변환
        return formattedDate;
    }

    // 값이 없거나 다른 형식일 경우 null 반환
    return null;
}

module.exports = crawl_saramin;
