const express = require('express');
const queries = require('../queries');
const pool = require('../dbConfig');

const router = express.Router();

router.get('/:memoryCodeSeqNo', async (req, res) => {
    /*#swagger.tags = ["MemoryCode"]
    #swagger.summary = "추억 코드 조회"*/

    const reqMemoryCodeSeqNo = req.params.memoryCodeSeqNo;
    let memoryCodeInfo = null;
    try {
        memoryCodeInfo = await queries.getMemoryCode(reqMemoryCodeSeqNo, undefined, undefined);
    } catch (error) {

    } finally {
        res.json({ memoryCodeInfo: memoryCodeInfo });
    }
});


router.put('/:memoryCodeSeqNo', async (req, res) => {
    //#swagger.tags = ["MemoryCode"]
    //#swagger.summary = "추억 코드 수정"
    const reqMemoryCodeSeqNo = req.params.memoryCodeSeqNo;
    const { memoryNm } = req.body;

    let status = 500;
    let resultMsg = '추억 수정 중 문제가 발생했습니다. 다시 시도해 주세요.';
    let memoryCodeInfo = null;

    const loginUser = req.session.loginUser;

    try {
        await pool.query('BEGIN'); // 트랜잭션 시작

        // 추억 코드 존재 여부 확인
        const memoryCodeRes = await queries.getMemoryCode(reqMemoryCodeSeqNo, undefined, undefined);
        if (memoryCodeRes == null) {
            resultMsg = '수정할 추억 정보가 존재하지 않습니다. 확인 후 다시 시도해주세요.';
            throw new Error(resultMsg);
        }

        // 권한 확인
        const memoryRes = await queries.getMemory(undefined, reqMemoryCodeSeqNo, loginUser.user_seq_no, undefined, undefined);
        if (memoryRes == null) {
            resultMsg = '수정 권한이 존재하지 않습니다. 확인 후 다시 시도해주세요.';
            throw new Error(resultMsg);
        }

        let updateMemoryCodeInfo = memoryCodeRes;
        // 기존의 추억 명이랑 다른 경우 update
        if (memoryCodeRes.memory_nm !== memoryNm) {
            // 추억 명 수정
            const updateMemoryCodeRes = await queries.updateMemoryCode(reqMemoryCodeSeqNo, undefined, memoryNm);
            if (!updateMemoryCodeRes.result) {
                throw new Error(resultMsg);
            }
            updateMemoryCodeInfo = updateMemoryCodeRes.memoryCodeInfo;
        }
        const activeMemoryInfo = await queries.getMemory(undefined, undefined, loginUser.user_seq_no, undefined, true);    // 활성화 된 추억 조회

        memoryCodeInfo = {
            ...activeMemoryInfo,
            ...updateMemoryCodeInfo
        };

        status = 200;
        resultMsg = '';
        await pool.query('COMMIT'); // 트랜잭션 커밋

    } catch (error) {
        await pool.query('ROLLBACK'); // 트랜잭션 롤백
    } finally {
        res.status(status).json({ resultMsg: resultMsg, memoryCodeInfo: memoryCodeInfo });
    }
});


module.exports = router;