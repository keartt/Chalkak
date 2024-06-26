const express = require('express');
const queries = require('../queries');

const router = express.Router();


// 로그인 및 회원가입
router.post('/login', async (req, res) => {
    //#swagger.tags = ["User"]
    //#swagger.summary = "로그인 및 회원가입"
    let resultMsg = "로그인 중 문제가 발생했습니다. 다시 시도해주세요.";
    let status = 500;
    let redirectUrl = "/";
    let resultUserInfo = null;

    try {

        const { userInfo } = req.body;
        const resUsers = await queries.getUsers(undefined, undefined, undefined, undefined, userInfo.social_id);    // 사용자 조회
        const isUserExists = resUsers.length > 0;

        if (!isUserExists) {    // 신규 회원 -> 회원가입
            const result = await queries.insertUser(userInfo.email, userInfo.user_nm, userInfo.social_type, userInfo.social_id);  // 회원가입
            req.session.loginUser = result.result ? result.userInfo : null;    // 회원가입 성공 시 세션 저장
            status = result.result ? 200 : 500;
            resultUserInfo = result.result ? result.userInfo : null; 
            redirectUrl = result.result ? '/memories/connection' : '/'; // 회원가입 성공 시 리다이렉트 경로
        } else {    // 기존 회원 -> 로그인
            req.session.loginUser = resUsers[0]; // 세션 저장
            status = 200;
            resultUserInfo = resUsers[0];
            redirectUrl = '/memories/connection';
            resultMsg = '';
        }

    } catch (error) {
        // 오류 발생 시 500 에러 응답
    } finally {
        res.status(status).json({ redirectUrl: redirectUrl, resultMsg : resultMsg, resultUserInfo : resultUserInfo});
    }

});

// 로그아웃
router.get('/logout', async (req, res) => {
    // #swagger.tags = ["User"]
    // #swagger.summary = "로그아웃"
    delete req.session.loginUser;
    res.status(200).json({ redirectUrl: '/' });
});

// 로그인 확인
router.get('/login/check', async (req, res) => {
    //#swagger.tags = ["User"]
    //#swagger.summary = "로그인 확인"
    const loginUser = req.session.loginUser;
    if(loginUser === undefined){
        delete req.session.loginUser;
    }

    res.json({
        result: loginUser === undefined? false:true,
        loginUser: loginUser
    })
});


module.exports = router;