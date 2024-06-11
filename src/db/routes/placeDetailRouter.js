const express = require('express');
const queries = require('../queries');
const pool = require('../dbConfig');

const router = express.Router();

// 장소 상세 정보 목록 조회
router.get('/placeSeqNo', async (req, res) => {
    //#swagger.tags = ["PlaceDetail"]
    //#swagger.summary = "댓글 목록 조회"

    let placeDetailList = null;
    let status = 500;
    let resultMsg = '장소 정보 조회 중 문제가 발생했습니다. 다시 시도해주세요.';

    try {
        let { placeSeqNo } = req.query;

        // 장소 정보 확인
        const placeInfo = await queries.getPlace(placeSeqNo, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined);
        if (placeInfo === null) {
            throw new Error();
        }

        // 추억 권한 확인
        const loginUser = req.session.loginUser;
        const memoryCheck = await queries.getMemory(undefined, placeInfo.memory_code_seq_no, loginUser.user_seq_no, undefined, undefined);

        if(memoryCheck === null){
            resultMsg = '장소 정보를 조회할 권한이 존재하지 않습니다. 확인 후 다시 시도해주세요.';
            status=403;
            throw new Error(resultMsg);
        }

        // 목록 조회
        placeDetailList = await queries.getPlaceDetails(undefined, placeSeqNo, undefined, undefined, undefined);
        if(placeDetailList !== null){
             // 날짜 형식 변환
            placeDetailList.forEach(placeDetail => {
                placeDetail.create_dt = formatTimestamp(placeDetail.create_dt); // memory_date 값을 변환하여 재할당
            });
        }

       
        status = 200;
    } catch (error) {

    } finally {
        res.status(status).json({ placeDetailList: placeDetailList , resultMsg: resultMsg});
    }

});



// 장소 INSERT
router.post('/placeDetail', async (req, res) => {
    //#swagger.tags = ["Place"]
    //#swagger.summary = "댓글 저장"

    let status = 500;
    let resultMsg = '댓글 저장 중 문제가 발생했습니다. 다시 시도해주세요.';
    const loginUser = req.session.loginUser;

    try {

        await pool.query('BEGIN'); // 트랜잭션 시작
        let placeDetailData = req.body;

        // 장소 정보 확인
        const placeInfo = await queries.getPlace(placeDetailData.place_seq_no, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined);
        if (placeInfo === null) {
            throw new Error();
        }

        // 추억 권한 확인
        const memoryCheck = await queries.getMemory(undefined, placeInfo.memory_code_seq_no, loginUser.user_seq_no, undefined, undefined);
        if(memoryCheck === null){
            resultMsg = '댓글 저장할 권한이 존재하지 않습니다. 확인 후 다시 시도해주세요.';
            status=403;
            throw new Error(resultMsg);
        }

        placeDetailData.user_seq_no = loginUser.user_seq_no;
        const create_dt = formatCurrentTimestamp();
        placeDetailData.create_dt = create_dt;

        // 저장
        const insertPlaceDetailRes = await queries.insertPlaceDetail(placeDetailData);    // 추억 코드 생성
        if (!insertPlaceDetailRes.result) { // 생성 실패 시 오류
            status = 400;
            throw new Error(resultMsg);
        }

        status = 200;
        resultMsg = "";
        await pool.query('COMMIT'); // 트랜잭션 커밋

    } catch (error) {
        await pool.query('ROLLBACK'); // 트랜잭션 롤백
    } finally {
        res.status(status).json({ resultMsg: resultMsg });
    }

});


router.delete('/placeDetail', async (req, res) => {
    //#swagger.tags = ["PlaceDetail"]
    //#swagger.summary = "댓글 삭제"

    const place_detail_seq_no = req.query.place_detail_seq_no;

    let status = 500;
    let resultMsg = '댓글 삭제중 문제가 발생했습니다. 다시 시도해 주세요.';
    const loginUser = req.session.loginUser;

    try {

        await pool.query('BEGIN'); // 트랜잭션 시작

        // 댓글 정보 확인
        const placeDetailRes = await queries.getPlaceDetail(place_detail_seq_no, undefined, loginUser.user_seq_no, undefined, undefined);

        // 댓글 정보 확인
        if (placeDetailRes === null) {
            throw new Error(resultMsg);
        }

        const deleteData = {
            place_detail_seq_no: place_detail_seq_no
        }

        // 삭제
        const deleteRes = await queries.deletePlaceDetail(deleteData);
        if (!deleteRes) {
            throw new Error(resultMsg);
        }

        status = 200;
        resultMsg = '';
        await pool.query('COMMIT'); // 트랜잭션 커밋

    } catch (error) {
        await pool.query('ROLLBACK'); // 트랜잭션 롤백
    } finally {
        res.status(status).json({ resultMsg: resultMsg });
    }
});

// 장소 UPDATE
router.put('/placeDetail', async (req, res) => {
    //#swagger.tags = ["PlaceDetail"]
    //#swagger.summary = "댓글 수정"

    let status = 500;
    let resultMsg = '댓글 수정 중 문제가 발생했습니다. 다시 시도해주세요.';
    const loginUser = req.session.loginUser;

    try {

        await pool.query('BEGIN'); // 트랜잭션 시작
        let placeDetailData = req.body;

        // 댓글 정보 확인
        const placeDetailRes = await queries.getPlaceDetail(placeDetailData.place_detail_seq_no, undefined, loginUser.user_seq_no, undefined, undefined);

        // 댓글 정보 확인
        if (placeDetailRes === null) {
            throw new Error(resultMsg);
        }

        // 수정
        const updatePlaceDetailRes = await queries.updatePlaceDetail(placeDetailData.place_detail_seq_no, undefined, undefined, placeDetailData.place_detail_content, undefined);    // 추억 코드 생성
        if (!updatePlaceDetailRes.result) { // 생성 실패 시 오류
            status = 400;
            throw new Error(resultMsg);
        }

        status = 200;
        resultMsg = "";
        await pool.query('COMMIT'); // 트랜잭션 커밋

    } catch (error) {
        await pool.query('ROLLBACK'); // 트랜잭션 롤백
    } finally {
        res.status(status).json({ resultMsg: resultMsg });
    }

});



const formatDate = (param) => {
    if(param === null || param === ''){
        return null;
    }
    
    const date = new Date(param);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
};

const formatTimestamp = (param) => {
    if(param === null || param === ''){
        return null;
    }
    
    const date = new Date(param);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    const formattedTimestamp = `${year}-${month}-${day} ${hours}:${minutes}`;
    return formattedTimestamp;
};

//현재시간
const formatCurrentTimestamp = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    const formattedTimestamp = `${year}-${month}-${day} ${hours}:${minutes}`;
    return formattedTimestamp;
};


module.exports = router;