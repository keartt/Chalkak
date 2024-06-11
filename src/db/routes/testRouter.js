const express = require('express');
const queries = require('../queries');

const router = express.Router();

router.get('/', async (req, res) => {
    //#swagger.tags = ["Test"]
    //#swagger.summary = "조회"
    try {
        const tests = await queries.getTests(); // queries 객체를 통해 getUsers 함수를 호출하여 사용자 목록을 가져옴
        res.json(tests); // 사용자 목록을 JSON 형식으로 응답
    } catch (error) {
        console.error('Error handling request:', error);
        res.status(500).json({ error: 'Internal server error' }); // 오류 발생 시 500 에러 응답
    }
});

router.post('/add', async (req, res) => {
    //#swagger.tags = ["Test"]
    //#swagger.summary = "등록"
    const testName = req.body.testName; // POST 요청에서 testName 파라미터를 가져옴
    try {
        const result = await queries.createTest(testName); // createTest 함수를 호출하여 테스트를 생성함
        res.json(result); // 결과를 JSON 형식으로 응답
    } catch (error) {
        console.error('Error handling request:', error);
        res.status(500).json({ error: 'Internal server error' }); // 오류 발생 시 500 에러 응답
    }
});



module.exports = router;