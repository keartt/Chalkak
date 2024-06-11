const express = require('express');
const queries = require('../queries');
const pool = require('../dbConfig');

const router = express.Router();


// 장소 INSERT
router.post('/place', async (req, res) => {
    //#swagger.tags = ["Place"]
    //#swagger.summary = "장소 저장"

    let status = 500;
    let resultMsg = '장소 저장 중 문제가 발생했습니다. 다시 시도해주세요.';
    let placeInfo = null;
    const loginUser = req.session.loginUser;

    try {

        await pool.query('BEGIN'); // 트랜잭션 시작
        let placeData = req.body;
        placeData.userSeqNo = loginUser.user_seq_no;

        // 넘어온 데이터가 활성화 된 추억이 아닌 경우
        const activeMemoryInfo = await queries.getMemory(undefined, undefined, loginUser.user_seq_no, undefined, true);
        if (activeMemoryInfo === null) {
            throw new Error(resultMsg);
        }
        placeData.memoryCodeSeqNo = activeMemoryInfo.memory_code_seq_no;

        // 중복 데이터 확인 (추억코드, 장소ID)
        const placeInfoCheck = await queries.getPlaces(undefined, placeData.memoryCodeSeqNo, undefined, placeData.placeId, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined);
        if (placeInfoCheck !== null) {
            status = 200;
            resultMsg = '이미 저장된 장소 정보입니다. 확인 후 다시 시도해주세요.';
            throw new Error(resultMsg);
        }

        // 장소 저장
        const insertPlaceRes = await queries.insertPlace(placeData);    // 추억 코드 생성
        if (!insertPlaceRes.result) { // 생성 실패 시 오류
            status = 400;
            throw new Error(resultMsg);
        }
        placeInfo = insertPlaceRes.placeInfo;
        status = 200;
        resultMsg = "";

        await pool.query('COMMIT'); // 트랜잭션 커밋

    } catch (error) {
        await pool.query('ROLLBACK'); // 트랜잭션 롤백
    } finally {
        res.status(status).json({ resultMsg: resultMsg, placeInfo: placeInfo });
    }

});

router.put('/place', async (req, res) => {
    //#swagger.tags = ["Place"]
    //#swagger.summary = "장소 수정"

    const loginUser = req.session.loginUser;

    let status = 500;
    let resultMsg = '장소 수정 중 문제가 발생했습니다. 다시 시도해주세요.';
    let placeInfo = null;

    try {

        await pool.query('BEGIN'); // 트랜잭션 시작
        const placeData = req.body;

        // 활성화 된 추억 정보
        const activeMemoryInfo = await queries.getMemory(undefined, undefined, loginUser.user_seq_no, undefined, true);
        if (activeMemoryInfo === null) {
            throw new Error(resultMsg);
        }

        // 데이터 확인 (장소seqno, 추억 코드)
        const placeInfoCheck = await queries.getPlace(placeData.place_seq_no, activeMemoryInfo.memory_code_seq_no, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined);
        if (placeInfoCheck === null) {
            throw new Error(resultMsg);
        }

        // 수정 가능 여부 확인
        if (placeInfoCheck.edit_restrict === true && placeInfoCheck.user_seq_no !== loginUser.user_seq_no) {
            resultMsg = '장소 정보를 수정할 권한이 존재하지 않습니다. 확인 후 다시 시도해주세요.';
            status = 403;
            throw new Error(resultMsg);
        }

        // 장소 수정
        const updatePlaceRes = await queries.updatePlace(
            placeInfoCheck.place_seq_no, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, placeData.place_alias, placeData.notes, placeData.storage_category, placeData.edit_restrict, placeData.memory_date
        );

        if (!updatePlaceRes.result) { // 생성 실패 시 오류
            status = 400;
            throw new Error(resultMsg);
        }

        placeInfo = updatePlaceRes.placeInfo;
        status = 200;
        resultMsg = "";
        await pool.query('COMMIT'); // 트랜잭션 커밋

    } catch (error) {
        await pool.query('ROLLBACK'); // 트랜잭션 롤백
    } finally {
        res.status(status).json({ resultMsg: resultMsg, placeInfo: placeInfo });
    }
});


// 장소 목록 조회
router.get('/memoryCode/:memoryCodeSeqNo', async (req, res) => {
    //#swagger.tags = ["Place"]
    //#swagger.summary = "추억 코드로 저장 장소 목록 조회"
    let placeList = null;

    try {

        const memoryCodeSeqNo = req.params.memoryCodeSeqNo;
        placeList = await queries.getPlaces(undefined, memoryCodeSeqNo, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined);

        // 날짜 형식 변환
        placeList.forEach(place => {
            place.memory_date = formatDate(place.memory_date); // memory_date 값을 변환하여 재할당
        });


    } catch (error) {

    } finally {
        res.json({ placeList: placeList });
    }

});

// 활성화 추억 장소 목록 조회
router.get('/active', async (req, res) => {
    //#swagger.tags = ["Place"]
    //#swagger.summary = "최근 접속한 추억 저장 장소 목록 조회"
    let placeList = null;
    let status = 500;

    try {

        let { storageCategory } = req.query;

        const loginUser = req.session.loginUser;
        const activeMemoryInfo = await queries.getMemory(undefined, undefined, loginUser.user_seq_no, undefined, true);    // 활성화 된 추억 조회
        placeList = await queries.getPlaces(undefined, activeMemoryInfo.memory_code_seq_no, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, storageCategory, undefined, undefined);

        // 날짜 형식 변환
        placeList.forEach(place => {
            place.memory_date = formatDate(place.memory_date); // memory_date 값을 변환하여 재할당
        });

    } catch (error) {
        status == 500;
    } finally {
        res.json({ placeList: placeList });
    }

});

router.delete('/place', async (req, res) => {
    //#swagger.tags = ["Place"]
    //#swagger.summary = "장소 삭제"

    const place_seq_no = req.query.placeSeqNo;

    let status = 500;
    let resultMsg = '장소 삭제중 문제가 발생했습니다. 다시 시도해 주세요.';
    const loginUser = req.session.loginUser;

    try {

        await pool.query('BEGIN'); // 트랜잭션 시작

        const placeRes = await queries.getPlace(place_seq_no, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined);

        // 장소 정보 확인
        if (placeRes === null) {
            throw new Error(resultMsg);
        }

        // 권한 확인
        const memoryRes = await queries.getMemory(undefined, placeRes.memory_code_seq_no, loginUser.user_seq_no, undefined, undefined);
        if ((placeRes.edit_restrict === true && placeRes.user_seq_no !== loginUser.user_seq_no) || memoryRes == null) {
            resultMsg = '장소 정보를 삭제할 권한이 존재하지 않습니다. 확인 후 다시 시도해주세요.';
            status = 403;
            throw new Error(resultMsg);
        }

        // 장소 댓글 삭제
        let deletePlaceDetailData = {
            place_seq_no: place_seq_no
        };
        const deletePlaceRes = await queries.deletePlaceDetail(deletePlaceDetailData);
        if (!deletePlaceRes) {
            throw new Error(resultMsg);
        }

        const deletePlaceData = {
            placeSeqNo: place_seq_no
        }
        // 장소 삭제
        const deleteRes = await queries.deletePlace(deletePlaceData);
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

// 장소 정보 조회
router.get('/place/placeSeqNo', async (req, res) => {
    //#swagger.tags = ["Place"]
    //#swagger.summary = "장소 정보 조회"
    let placeInfo = null;
    let status = 500;
    try {
        let { placeSeqNo } = req.query;

        placeInfo = await queries.getPlace(placeSeqNo, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined);
        if (placeInfo === null) {
            throw new Error();
        }

        placeInfo.memory_date = formatDate(placeInfo.memory_date); // memory_date 값을 변환하여 재할당
        status = 200;
    } catch (error) {
        status = 500;
    } finally {
        res.status(status).json({ placeInfo: placeInfo });
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
module.exports = router;