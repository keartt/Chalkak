
const express = require('express');
const queries = require('../queries');
const axios = require('axios');
require('dotenv').config(); // dotenv를 사용하여 환경 변수 로드

const router = express.Router();

router.post('/kakao', async (req, res) => {
    /*#swagger.tags = ["Auth"]
    #swagger.summary = "Kakao 로그인 인증 요청"
    #swagger.description = "Kakao 계정을 인증하는 API"
    #swagger.parameters['code'] = { description: '카카오 인증 코드' }*/
    try {

        // # 토큰
        const { code } = req.body;
        // 토큰 요청 데이터
        const tokenReqData = {
            grant_type: 'authorization_code',
            client_id: process.env.REACT_APP_KAKAO_CLIENT_ID,
            client_secret: process.env.REACT_APP_KAKAO_CLIENT_SECRET,
            code: code
        };

        // 토큰 요청 헤더 설정
        const tokenReqHeaders = {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        };

        // 액세스 토큰 요청
        const tokenResponse = await axios.post(
            'https://kauth.kakao.com/oauth/token',
            tokenReqData,
            {
                headers:tokenReqHeaders
            }
        );
        const resAccessToken = tokenResponse.data.access_token; // 엑세스 토큰

        // 사용자 정보 요청 헤더
        const infoReqHeaders = {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            'Authorization': `Bearer ${resAccessToken}`
        }

        // 액세스 토큰을 사용하여 사용자 정보 요청
        const userInfoResponse = await axios.get(
            'https://kapi.kakao.com/v2/user/me',
            {
                headers: infoReqHeaders
            }
        );
        const userInfo = userInfoResponse.data;
        
        const newUserInfo = {
            email : userInfo.kakao_account.email,
            user_nm: userInfo.properties.nickname,
            social_type: 'kakao',
            social_id: userInfo.id + ''
        }
        res.status(200).json({ userInfo: newUserInfo });

    } catch (error) {
        res.status(500).json({ userInfo: null }); // 오류 발생 시 500 에러 응답
    }
});


module.exports = router;