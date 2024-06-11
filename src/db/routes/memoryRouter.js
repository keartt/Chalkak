const express = require('express');
const queries = require('../queries');
const pool = require('../dbConfig');

const router = express.Router();
const { generateRandomString } = require('../../utils/commonFunctions');

// 활성화 추억으로 연결
router.get('/connection/active', async (req, res) => {
    //#swagger.tags = ["Memory"]
    //#swagger.summary = "최근 접속한 추억으로 연결"
    await pool.query('BEGIN'); // 트랜잭션 시작

    let status = 500;
    let resultMsg = '추억 연결 중 문제가 발생했습니다. 다시 시도해주세요.';
    let activeMemoryInfo = null;
    try {
        const loginUser = req.session.loginUser;
        activeMemoryInfo = await queries.getMemory(undefined, undefined, loginUser.user_seq_no, undefined, true);    // 활성화 된 추억 조회

        if (activeMemoryInfo == null) {
            const userMemoryInfo = await queries.getMemorys(undefined, undefined, loginUser.user_seq_no, undefined, undefined);    // 모든 추억 조회
            
            // 추억 존재X
            if (userMemoryInfo === null) {
                resultMsg = '최근 접속한 추억 정보가 존재하지 않습니다.\n새로운 추억을 생성하거나 추억 코드로 연결해주세요.';
            } else {
                // 가장 최근에 만든 추억 활성화 시켜 접속
                const updateData = userMemoryInfo[0];
                activeMemoryInfo = await queries.updateMemory(updateData.memory_seq_no, undefined, undefined, undefined, true);    // 활성화 된 추억으로 수정
                if (activeMemoryInfo != null) {
                    resultMsg = null;
                }
            }
        }
        else {
            resultMsg = null;
        }
        status = 200;
        await pool.query('COMMIT'); // 트랜잭션 커밋
    } catch (error) {
        await pool.query('ROLLBACK'); // 트랜잭션 롤백
    } finally {
        res.status(status).json({ resultMsg: resultMsg, activeMemoryInfo: activeMemoryInfo });
    }
});

// 새 추억 생성
router.post('/new', async (req, res) => {
    //#swagger.tags = ["Memory"]
    //#swagger.summary = "새 추억 생성"
    let status = 500;
    let resultMsg = '추억 생성 중 문제가 발생했습니다. 다시 시도해주세요.';
    let activeMemoryInfo = null;
    const { memoryNm } = req.body;

    try {

        await pool.query('BEGIN'); // 트랜잭션 시작

        const loginUser = req.session.loginUser;

        let memoryCodeCheck = false;
        let memoryCode = "";
        while (!memoryCodeCheck) {
            // 추억 코드 랜덤 생성
            memoryCode = generateRandomString(10);

            // 추억 코드 중복 확인
            const memoryCodeCheckRes = await queries.getMemoryCodes(undefined, memoryCode, undefined);    // 추억 코드 중복 확인
            if (memoryCodeCheckRes.length < 1) {
                memoryCodeCheck = true;
            }
        }

        // 추억 코드 생성
        const insertMemoryCodeRes = await queries.insertMemoryCode(memoryCode, memoryNm);    // 추억 코드 생성
        if (!insertMemoryCodeRes.result) // 생성 실패 시 오류
            throw new Error(resultMsg);

        // 새로운 추억 생성
        const insertMemoryRes = await queries.insertMemory(
            insertMemoryCodeRes.memoryCodeInfo.memory_code_seq_no,
            loginUser.user_seq_no,
            'COLOR_CODE_1',
            true
        );

        if (!insertMemoryRes.result) { // 추억 생성 실패
            throw new Error(resultMsg);
        }


        // 활성화 된 추억 비활성화로 수정
        const updateMemoryActiveRes = await queries.updateMemoryActiveNotThis(insertMemoryRes.memoryInfo.memory_seq_no, loginUser.user_seq_no);
        if (!updateMemoryActiveRes.result) {  // 수정 실패
            throw new Error(resultMsg);
        }

        status = 200;
        resultMsg = "";
        activeMemoryInfo = insertMemoryRes.memoryInfo;

        await pool.query('COMMIT'); // 트랜잭션 커밋
    } catch (error) {
        await pool.query('ROLLBACK'); // 트랜잭션 롤백
    } finally {
        res.status(status).json({ resultMsg: resultMsg, activeMemoryInfo: activeMemoryInfo });
    }
});

// 추억 코드로 추억 연결
router.post('/connection/code', async (req, res) => {
    //#swagger.tags = ["Memory"]
    //#swagger.summary = "추억 코드로 추억 연결"
    let status = 500;
    let resultMsg = '추억 연결 중 문제가 발생했습니다. 다시 시도해주세요.';
    let activeMemoryInfo = null;
    const { memoryCode } = req.body;
    try {

        await pool.query('BEGIN'); // 트랜잭션 시작

        const loginUser = req.session.loginUser;

        // 추억 코드 확인
        const memoryCodeRes = await queries.getMemoryCode(undefined, memoryCode, undefined);
        if (memoryCodeRes == null) {
            resultMsg = '올바르지 않은 추억 코드입니다. 확인 후 다시 시도해주세요.';
            throw new Error(resultMsg);
        }

        // 이미 등록된 추억인지 확인
        const memoryRes = await queries.getMemory(undefined, memoryCodeRes.memory_code_seq_no, loginUser.user_seq_no, undefined, undefined)
        if (memoryRes != null) {
            resultMsg = '이미 연결된 추억입니다.';
            throw new Error(resultMsg);
        }

        // 색상 코드값 지정
        const symbol_color_code = await queries.getMemorySymbolColorCodeChoice(memoryCodeRes.memory_code_seq_no);

        //추억 연결 INSERT
        const insertMemoryRes = await queries.insertMemory(
            memoryCodeRes.memory_code_seq_no,
            loginUser.user_seq_no,
            symbol_color_code.common_code,
            true
        );

        if (!insertMemoryRes.result) { // 추억 연결 실패
            throw new Error(resultMsg);
        }

        // 활성화 된 추억 비활성화로 수정
        const updateMemoryActiveRes = await queries.updateMemoryActiveNotThis(insertMemoryRes.memoryInfo.memory_seq_no, loginUser.user_seq_no);
        if (!updateMemoryActiveRes.result) {  // 수정 실패
            throw new Error(resultMsg);
        }
        status = 200;
        resultMsg = "";

        activeMemoryInfo = insertMemoryRes.memoryInfo;
        await pool.query('COMMIT'); // 트랜잭션 커밋
    } catch (error) {
        await pool.query('ROLLBACK'); // 트랜잭션 롤백
    } finally {
        res.status(status).json({ resultMsg: resultMsg, activeMemoryInfo: activeMemoryInfo });
    }
});

// 활성화된 추억 정보 조회
router.get('/active', async (req, res) => {
    //#swagger.tags = ["Memory"]
    //#swagger.summary = "활성화된 추억 정보 조회"
    let memoryInfo = null;
    try {
        const loginUser = req.session.loginUser;
        const activeMemoryInfo = await queries.getMemory(undefined, undefined, loginUser.user_seq_no, undefined, true);    // 활성화 된 추억 조회
        const activeMemoryCodeInfo = await queries.getMemoryCode(activeMemoryInfo.memory_code_seq_no);

        memoryInfo = {
            ...activeMemoryInfo,
            ...activeMemoryCodeInfo
        };
    } catch (error) {

    } finally {
        res.json({ memoryInfo: memoryInfo });
    }
});

// 추억 정보의 추억 코드로 사용자 목록 조회
router.get('/memoryCodes/:memoryCodeSeqNo/users', async (req, res) => {
    //#swagger.tags = ["Memory"]
    //#swagger.summary = "추억 정보의 추억 코드로 사용자 목록 조회"
    let userList = null;

    try {

        const reqMemoryCodeSeqNo = req.params.memoryCodeSeqNo;
        userList = await queries.getUsersByMemoryCode(reqMemoryCodeSeqNo);    // 사용자 정보 조회

    } catch (error) {

    } finally {
        res.json({ userList: userList });
    }

});

// 로그인 정보로 추억 목록 조회
router.get('/inactive', async (req, res) => {
    //#swagger.tags = ["Memory"]
    //#swagger.summary = "로그인 정보로 추억 목록 조회"
    let memoryList = null;

    try {
        const loginUser = req.session.loginUser;
        memoryList = await queries.getMemorysInactive(loginUser.user_seq_no);    // 사용자 정보 조회

    } catch (error) {

    } finally {
        res.json({ memoryList: memoryList });
    }

});

// 활성화 추억 변경
router.put('/:memorySeqNo/active', async (req, res) => {
    //#swagger.tags = ["Memory"]
    //#swagger.summary = "최근 접속한 추억 변경"
    const reqMemorySeqNo = req.params.memorySeqNo;
    let status = 500;
    let resultMsg = '추억 변경 중 문제가 발생했습니다. 다시 시도해 주세요.';
    let memoryInfo = null;

    const loginUser = req.session.loginUser;

    try {

        await pool.query('BEGIN'); // 트랜잭션 시작

        // 추억 & 권한 확인
        const memoryRes = await queries.getMemory(reqMemorySeqNo, undefined, loginUser.user_seq_no, undefined, undefined);
        if (memoryRes == null) {
            resultMsg = '변경할 추억 정보 또는 권한이 존재하지 않습니다. 확인 후 다시 시도해주세요.';
            throw new Error(resultMsg);
        }

        // 기존 활성화 된 추억 비활성화로 UPDATE
        const updateMemoryInactiveRes = await queries.updateMemoryActiveNotThis(memoryRes.memory_seq_no, loginUser.user_seq_no);
        if (!updateMemoryInactiveRes.result) {
            throw new Error(resultMsg);
        }

        // 선택한 추억 활성화 UPDATE
        const updateMemoryActiveRes = await queries.updateMemory(reqMemorySeqNo, undefined, undefined, undefined, true);
        if (updateMemoryActiveRes == null) {
            throw new Error(resultMsg);
        }

        // 추억 코드 정보 조회
        const memoryCodeInfo = await queries.getMemoryCode(updateMemoryActiveRes.memory_code_seq_no, undefined, undefined);
        if (memoryCodeInfo == null) {
            throw new Error(resultMsg);
        }

        status = 200;
        resultMsg = '';
        memoryInfo = {
            ...updateMemoryActiveRes,
            ...memoryCodeInfo
        };
        await pool.query('COMMIT'); // 트랜잭션 커밋

    } catch (error) {
        await pool.query('ROLLBACK'); // 트랜잭션 롤백
    } finally {
        res.status(status).json({ resultMsg: resultMsg, memoryInfo: memoryInfo });
    }
});

router.delete('/:memorySeqNo', async (req, res) => {
    //#swagger.tags = ["Memory"]
    //#swagger.summary = "추억 삭제"
    const reqMemorySeqNo = req.params.memorySeqNo;
    let status = 500;
    let resultMsg = '연결 해제중 문제가 발생했습니다. 다시 시도해 주세요.';
    let redirectUrl = '';
    const loginUser = req.session.loginUser;

    try {

        await pool.query('BEGIN'); // 트랜잭션 시작

        // 추억 & 권한 확인
        const memoryRes = await queries.getMemory(reqMemorySeqNo, undefined, loginUser.user_seq_no, undefined, undefined);
        if (memoryRes == null) {
            resultMsg = '연결 해제할 추억 정보 또는 권한이 존재하지 않습니다. 확인 후 다시 시도해주세요.';
            throw new Error(resultMsg);
        }

        
        const placeRes = await queries.getPlaces(undefined, memoryRes.memory_code_seq_no, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined);
        if(placeRes !== null){

            for (const place of placeRes) {
                let deletePlaceDetailData = {
                    place_seq_no: place.place_seq_no
                };
        
                if (place.user_seq_no !== loginUser.user_seq_no) {
                    deletePlaceDetailData.user_seq_no = loginUser.user_seq_no;
                }
                await queries.deletePlaceDetail(deletePlaceDetailData);
            }

            // place 삭제
            const deletePlaceData = {
                memoryCodeSeqNo : memoryRes.memory_code_seq_no,
                userSeqNo: loginUser.user_seq_no
            }
            const placeDeleteRes = await queries.deletePlace(deletePlaceData);
            if (!placeDeleteRes) {
                throw new Error(resultMsg);
            }

        }

        // memory 삭제
        const memoryDeleteRes = await queries.deleteMemory(memoryRes.memory_seq_no);
        if (!memoryDeleteRes) {
            throw new Error(resultMsg);
        }

        // 마지막 사용자인 경우 memory_code 삭제  
        const memoryCodeDelCheck = await queries.getUsersByMemoryCode(memoryRes.memory_code_seq_no);
        if (memoryCodeDelCheck == null) {
            const memoryCodeDeleteRes = await queries.deleteMemoryCode(memoryRes.memory_code_seq_no);
            if (!memoryCodeDeleteRes) {
                throw new Error(resultMsg);
            }
        }

        // 활성화 추억 조회-> 없는 경우 위에서 삭제된거임
        const activeMemoryInfo = await queries.getMemory(undefined, undefined, loginUser.user_seq_no, undefined, true);    // 활성화 된 추억 조회
        if(activeMemoryInfo == null) {
            redirectUrl = '/memories/connection';
        }
        status = 200;
        resultMsg = '';
        await pool.query('COMMIT'); // 트랜잭션 커밋

    } catch (error) {
        await pool.query('ROLLBACK'); // 트랜잭션 롤백
    } finally {
        res.status(status).json({ resultMsg: resultMsg, redirectUrl: redirectUrl });
    }
});

// 연결 해제 (추억 삭제)


module.exports = router;