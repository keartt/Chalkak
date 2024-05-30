const pool = require('./dbConfig');

// ## test
const getTests = async () => {

  try {
    const tests = await pool.query('SELECT * FROM test');
    console.log(tests);
    return tests.rows;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};

const insertTest = async (test_nm) => {
  try {
    await pool.query('INSERT INTO test (test_seq_no, test_nm) VALUES (nextval($1), $2)', ['sq_test', test_nm]);
    return { success: true, message: 'test created successfully' };
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};
// test ##



// ## users

// 사용자 목록 조회
const getUsers = async (user_seq_no, email, user_nm, social_type, social_id) => {
  try {
    let queryText = 'SELECT * FROM users WHERE 1 = 1';
    const queryParams = [];

    // 매개변수가 주어진 경우에만 해당 조건을 추가하고, 쿼리파라미터 배열에 추가
    if (user_seq_no !== undefined) {
      queryText += ` AND user_seq_no = $${queryParams.push(user_seq_no)}`;
    }
    if (email !== undefined) {
      queryText += ` AND email = $${queryParams.push(email)}`;
    }
    if (user_nm !== undefined) {
      queryText += ` AND user_nm = $${queryParams.push(user_nm)}`;
    }
    if (social_type !== undefined) {
      queryText += ` AND social_type = $${queryParams.push(social_type)}`;
    }
    if (social_id !== undefined) {
      queryText += ` AND social_id = $${queryParams.push(social_id)}`;
    }
    queryText += ' ORDER BY user_seq_no ASC';

    // 쿼리 실행
    const result = await pool.query(queryText, queryParams);

    // 결과 반환
    return result.rows;
  } catch (error) {
    return null;
  }
};



// 사용자 등록
const insertUser = async (email, user_nm, social_type, social_id) => {
  try {
    // INSERT 쿼리 텍스트
    const queryText = `INSERT INTO users (user_seq_no, email, user_nm,  social_type, social_id) VALUES (NEXTVAL('sq_users'), $1, $2, $3, $4) RETURNING *`;
    // 쿼리 실행
    const userInfo = await pool.query(queryText, [email, user_nm, social_type, social_id]);
    return { result: true, userInfo: userInfo.rows[0] };
  } catch (error) {
    return { result: false, userInfo: null };
  }
};


// users ##



// ## memory
// 추억 조회
const getMemory = async (memory_seq_no, memory_code_seq_no, user_seq_no, symbol_color_code, is_active) => {
  try {
    let queryText = 'SELECT * FROM memory WHERE 1 = 1';
    const queryParams = [];

    // 매개변수가 주어진 경우에만 해당 조건을 추가하고, 쿼리파라미터 배열에 추가
    if (memory_seq_no !== undefined) {
      queryText += ` AND memory_seq_no = $${queryParams.push(memory_seq_no)}`;
    }
    if (memory_code_seq_no !== undefined) {
      queryText += ` AND memory_code_seq_no = $${queryParams.push(memory_code_seq_no)}`;
    }
    if (user_seq_no !== undefined) {
      queryText += ` AND user_seq_no = $${queryParams.push(user_seq_no)}`;
    }
    if (symbol_color_code !== undefined) {
      queryText += ` AND symbol_color_code = $${queryParams.push(symbol_color_code)}`;
    }
    if (is_active !== undefined) {
      queryText += ` AND is_active = $${queryParams.push(is_active)}`;
    }

    // 쿼리 실행
    const result = await pool.query(queryText, queryParams);

    // 결과가 정확히 하나인지 확인하고, 그렇지 않으면 오류 발생
    if (result.rows.length < 1) {
      return null;
    } else if (result.rows.length > 1) {
      throw new Error();
    } else {
      return result.rows[0];
    }
  } catch (error) {
    throw error;
  }
};

// 추억 목록 조회
const getMemorys = async (memory_seq_no, memory_code_seq_no, user_seq_no, symbol_color_code, is_active) => {
  try {
    let queryText = 'SELECT * FROM memory WHERE 1 = 1';
    const queryParams = [];

    // 매개변수가 주어진 경우에만 해당 조건을 추가
    if (memory_seq_no !== undefined) {
      queryText += ` AND memory_seq_no = $${queryParams.push(memory_seq_no)}`;
    }
    if (memory_code_seq_no !== undefined) {
      queryText += ` AND memory_code_seq_no = $${queryParams.push(memory_code_seq_no)}`;
    }
    if (user_seq_no !== undefined) {
      queryText += ` AND user_seq_no = $${queryParams.push(user_seq_no)}`;
    }
    if (symbol_color_code !== undefined) {
      queryText += ` AND symbol_color_code = $${queryParams.push(symbol_color_code)}`;
    }
    if (is_active !== undefined) {
      queryText += ` AND is_active = $${queryParams.push(is_active)}`;
    }

    queryText += ' order by memory_seq_no desc';

    // 쿼리 실행
    const result = await pool.query(queryText, queryParams);

    // 결과가 정확히 하나인지 확인하고, 그렇지 않으면 오류 발생
    if (result.rows.length < 1) {
      return null;
    } else {
      return result.rows;
    }

  } catch (error) {
    throw error;
  }
};



// # 추억 등록 시 필요한 색상 코드 선택
const getMemorySymbolColorCodeChoice = async (memory_code_seq_no) => {
  try {

    const queryText = `
    SELECT common_code 
    FROM common_code 
    WHERE group_code = 'COLOR_CODE' 
    AND common_code NOT IN (
      SELECT m.symbol_color_code 
      FROM memory m 
      WHERE m.memory_code_seq_no = $1
    ) 
    ORDER BY common_code ASC 
    LIMIT 1`;

    // 쿼리 실행
    const result = await pool.query(queryText, [memory_code_seq_no]);
    return result.rows.length < 1 ? { common_code: 'COLOR_CODE_1' } : result.rows[0];

  } catch (error) {
    return { common_code: 'COLOR_CODE_1' };
  }

};



// 추억 등록
const insertMemory = async (memory_code_seq_no, user_seq_no, symbol_color_code, is_active) => {
  try {

    const queryText = `INSERT INTO memory (memory_seq_no, memory_code_seq_no, user_seq_no, symbol_color_code, is_active) VALUES (NEXTVAL('sq_memory'), $1, $2, $3, $4) RETURNING *`;
    // 쿼리 실행
    const memoryInfo = await pool.query(queryText, [memory_code_seq_no, user_seq_no, symbol_color_code, is_active]);

    return { result: true, memoryInfo: memoryInfo.rows[0] };
  } catch (error) {
    return { result: false, memoryInfo: null };
  }
};

// 추억 수정
const updateMemory = async (memory_seq_no, memory_code_seq_no, user_seq_no, symbol_color_code, is_active) => {

  try {
    let queryText = 'UPDATE memory SET ';
    const queryParams = [];

    if (memory_code_seq_no !== undefined) {
      queryText += `memory_code_seq_no = $${queryParams.push(memory_code_seq_no)}, `;
    }
    if (user_seq_no !== undefined) {
      queryText += `user_seq_no = $${queryParams.push(user_seq_no)}, `;
    }
    if (symbol_color_code !== undefined) {
      queryText += `symbol_color_code = $${queryParams.push(symbol_color_code)}, `;
    }
    if (is_active !== undefined) {
      queryText += `is_active = $${queryParams.push(is_active)}, `;
    }

    // 마지막 쉼표 제거
    queryText = queryText.slice(0, -2);

    queryText += ` WHERE memory_seq_no = $${queryParams.push(memory_seq_no)} RETURNING * `;

    // 쿼리 실행
    const result = await pool.query(queryText, queryParams);

    // 결과 반환
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    throw error;
  }
};



// 추억 활성화 여부 수정
const updateMemoryActiveNotThis = async (memory_seq_no, user_seq_no) => {
  try {

    const queryText = `UPDATE memory SET is_active = false WHERE memory_seq_no !=$1 and user_seq_no = $2 and is_active = true`;
    // 쿼리 실행
    await pool.query(queryText, [memory_seq_no, user_seq_no]);

    return { result: true };
  } catch (error) {
    return { result: false };
  }
};

// 추억 코드를 사용하여 추억에 속한 사용자 정보 조회
const getUsersByMemoryCode = async (memory_code_seq_no) => {
  try {
    const queryText = `

    SELECT u.user_seq_no, u.email, u.user_nm, cc.common_code_nm as symbol_color_code 
    FROM memory m 
    LEFT JOIN users u ON m.user_seq_no = u.user_seq_no 
    LEFT JOIN common_code cc ON cc.common_code = m.symbol_color_code  
    WHERE m.memory_code_seq_no = $1 
    ORDER BY m.memory_seq_no asc `;

    // 쿼리 실행
    const result = await pool.query(queryText, [memory_code_seq_no]);
    return result.rows.length > 0 ? result.rows : null;
  } catch (error) {
    throw error;
  }

};

// 활성화 추억 제외하고 목록 조회
const getMemorysInactive = async (user_seq_no) => {
  try {

    let queryText = `SELECT m.memory_seq_no, m.memory_code_seq_no, mc.memory_code, mc.memory_nm 
     from memory m
     left join memory_code mc on m.memory_code_seq_no = mc.memory_code_seq_no
     WHERE user_seq_no = $1 
     AND is_active = false 
     order by memory_seq_no desc
    `;

    // 쿼리 실행
    const result = await pool.query(queryText, [user_seq_no]);
    return result.rows.length > 0 ? result.rows : null;

  } catch (error) {
    throw error;
  }
};

// 추억 삭제
const deleteMemory = async (memory_seq_no) => {
  try {

    let queryText = `DELETE FROM memory 
    WHERE memory_seq_no = $1 
    `;

    // 쿼리 실행
    const result = await pool.query(queryText, [memory_seq_no]);
    return result.rowCount > 0 ? true : false;

  } catch (error) {
    throw error;
  }
};

// memory ##



// ## memory_code
// 추억 코드 조회
const getMemoryCode = async (memory_code_seq_no, memory_code, memory_nm) => {
  try {
    let queryText = 'SELECT * FROM memory_code WHERE 1 = 1';

    // 매개변수가 주어진 경우에만 해당 조건을 추가
    if (memory_code_seq_no !== undefined) { queryText += ` AND memory_code_seq_no = $1`; }
    if (memory_code !== undefined) { queryText += ` AND memory_code = $${queryText.split('$').length}`; }
    if (memory_nm !== undefined) { queryText += ` AND memory_nm = $${queryText.split('$').length}`; }

    // 쿼리 실행
    const result = await pool.query(queryText, [memory_code_seq_no, memory_code, memory_nm].filter(param => param !== undefined));
    // 결과가 정확히 하나인지 확인하고, 그렇지 않으면 오류 발생
    if (result.rows.length < 1) {
      return null;
    } else if (result.rows.length > 1) {
      throw new Error();
    } else {
      return result.rows[0];
    }
  } catch (error) {
    throw error;
  }
};

// 추억 코드 목록 조회
const getMemoryCodes = async (memory_code_seq_no, memory_code, memory_nm) => {
  try {
    let queryText = 'SELECT * FROM memory_code WHERE 1 = 1';

    // 매개변수가 주어진 경우에만 해당 조건을 추가
    if (memory_code_seq_no !== undefined) { queryText += ` AND memory_code_seq_no = $1`; }
    if (memory_code !== undefined) { queryText += ` AND memory_code = $${queryText.split('$').length}`; }
    if (memory_nm !== undefined) { queryText += ` AND memory_nm = $${queryText.split('$').length}`; }
    queryText += ' order by memory_code_seq_no desc';

    // 쿼리 실행
    const result = await pool.query(queryText, [memory_code_seq_no, memory_code, memory_nm].filter(param => param !== undefined));

    return result.rows;// 결과 반환
  } catch (error) {
    throw error;
  }
};

// 추억 코드 생성
const insertMemoryCode = async (memory_code, memory_nm) => {
  try {

    // INSERT 쿼리 텍스트
    const queryText = `INSERT INTO memory_code (memory_code_seq_no, memory_code, memory_nm) VALUES (NEXTVAL('sq_memory_code'), $1, $2) RETURNING *`;
    // 쿼리 실행
    const memoryCodeInfo = await pool.query(queryText, [memory_code, memory_nm]);
    return { result: true, memoryCodeInfo: memoryCodeInfo.rows[0] };
  } catch (error) {
    return { result: false, memoryCodeInfo: null };
  }
};

// 추억 코드 수정
const updateMemoryCode = async (memory_code_seq_no, memory_code, memory_nm) => {

  try {

    let queryText = 'UPDATE memory_code SET ';
    const queryParams = [];

    if (memory_code !== undefined) {
      queryText += `memory_code = $${queryParams.push(memory_code)}, `;
    }
    if (memory_nm !== undefined) {
      queryText += `memory_nm = $${queryParams.push(memory_nm)}, `;
    }

    // 마지막 쉼표 제거
    queryText = queryText.slice(0, -2);

    queryText += ` WHERE memory_code_seq_no = $${queryParams.push(memory_code_seq_no)} RETURNING * `;

    // 쿼리 실행
    const result = await pool.query(queryText, queryParams);

    // 결과가 존재하면 첫 번째 레코드 반환, 그렇지 않으면 null 반환
    const updatedMemoryCodeInfo = result.rows.length > 0 ? result.rows[0] : null;

    // 결과 반환
    return { result: true, memoryCodeInfo: updatedMemoryCodeInfo };

  } catch (error) {
    return { result: false, memoryCodeInfo: null };
  }

}

// 추억 코드 삭제
const deleteMemoryCode = async (memory_code_seq_no) => {
  try {

    let queryText = `DELETE FROM memory_code 
    WHERE memory_code_seq_no = $1 
    `;

    // 쿼리 실행
    const result = await pool.query(queryText, [memory_code_seq_no]);
    return result.rowCount > 0 ? true : false;

  } catch (error) {
    throw error;
  }
};


// memory_code ##

// ## place
// 장소 등록
const insertPlace = async (placeData) => {
  try {


    const queryText = `INSERT INTO place
    (place_seq_no, memory_code_seq_no, user_seq_no, place_id, place_nm, place_category_code, address, place_url, longitude, latitude, place_alias, notes, storage_category, edit_restrict)
    VALUES(nextval('sq_place'), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);`;

    const {
      memoryCodeSeqNo, userSeqNo, placeId, placeNm, placeCategoryCode, address, placeUrl, longitude, latitude, placeAlias, notes, storageCategory, editRestrict
    } = placeData;

    // 쿼리 실행
    const placeInfo = await pool.query(queryText, [
      memoryCodeSeqNo, userSeqNo, placeId, placeNm, placeCategoryCode, address, placeUrl, longitude, latitude, placeAlias, notes, storageCategory, editRestrict
    ]);

    return { result: true, placeInfo: placeInfo.rows[0] };
  } catch (error) {
    return { result: false, placeInfo: null };
  }
};

// 장소 목록 조회
const getPlaces = async (placeSeqNo, memoryCodeSeqNo, userSeqNo, placeId, placeNm, placeCategoryCode, address, placeUrl, longitude, latitude, placeAlias, notes, storageCategory, editRestrict) => {
  try {
    let queryText = 'SELECT * FROM place WHERE 1 = 1';
    const queryParams = [];

    // 매개변수가 주어진 경우에만 해당 조건을 추가
    if (placeSeqNo !== undefined) {
      queryText += ` AND place_seq_no = $${queryParams.push(placeSeqNo)}`;
    }
    if (memoryCodeSeqNo !== undefined) {
      queryText += ` AND memory_code_seq_no = $${queryParams.push(memoryCodeSeqNo)}`;
    }
    if (userSeqNo !== undefined) {
      queryText += ` AND user_seq_no = $${queryParams.push(userSeqNo)}`;
    }
    if (placeId !== undefined ) {
      queryText += ` AND place_id = $${queryParams.push(placeId)}`;
    }
    if (placeNm !== undefined ) {
      queryText += ` AND place_nm = $${queryParams.push(placeNm)}`;
    }
    if (placeCategoryCode !== undefined) {
      queryText += ` AND place_category_code = $${queryParams.push(placeCategoryCode)}`;
    }
    if (address !== undefined ) {
      queryText += ` AND address = $${queryParams.push(address)}`;
    }
    if (placeUrl !== undefined ) {
      queryText += ` AND place_url = $${queryParams.push(placeUrl)}`;
    }
    if (longitude !== undefined) {
      queryText += ` AND longitude = $${queryParams.push(longitude)}`;
    }
    if (latitude !== undefined) {
      queryText += ` AND latitude = $${queryParams.push(latitude)}`;
    }
    if (placeAlias !== undefined ) {
      queryText += ` AND place_alias = $${queryParams.push(placeAlias)}`;
    }
    if (notes !== undefined) {
      queryText += ` AND notes = $${queryParams.push(notes)}`;
    }
    if (storageCategory !== undefined ) {
      queryText += ` AND storage_category = $${queryParams.push(storageCategory)}`;
    }
    if (editRestrict !== undefined) {
      queryText += ` AND edit_restrict = $${queryParams.push(editRestrict)}`;
    }

    queryText += ' order by place_seq_no desc';

    // 쿼리 실행
    const result = await pool.query(queryText, queryParams);

    // 결과가 정확히 하나인지 확인하고, 그렇지 않으면 오류 발생
    if (result.rows.length < 1) {
      return null;
    } else {
      return result.rows;
    }

  } catch (error) {
    throw error;
  }
};

// place ##




module.exports = {
  getTests, insertTest,
  getUsers, insertUser,
  getMemory, insertMemory, updateMemoryActiveNotThis, getMemorys, updateMemory, getUsersByMemoryCode, getMemorysInactive, deleteMemory,
  getMemoryCode, getMemoryCodes, insertMemoryCode, updateMemoryCode, deleteMemoryCode,
  getMemorySymbolColorCodeChoice,
  insertPlace, getPlaces
};
