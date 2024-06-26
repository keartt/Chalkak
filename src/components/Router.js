import KakaoCallback from 'pages/api/KakaoCallback';
import MapHome from 'pages/map';
import MemoryConnection from 'pages/memory/connection';
import MemoryLogin from 'pages/memory/login';
import MemoryNew from 'pages/memory/new';
import Test from 'pages/test/Test';
import { Route, Routes, Navigate } from 'react-router';

export default function Router() {

    return (
        <>
            {/** 경로 설정 */}
            <Routes>

                <Route path="/tests" element={<Test/>} />

                {/** 추억 관리 */}
                <Route path="/" element={<MemoryLogin />} />
                <Route path="/memories/new" element={<MemoryNew />} />
                <Route path="/memories/connection" element={<MemoryConnection />} />

                {/** 지도서비스 */}
                <Route path="/map" element={<MapHome/>} />

                <Route path="/auth/kakao" element={<KakaoCallback/>}/>

                {/** 설정된 경로를 제외한 나머지 경로로 접속한 경우 루트 페이지로 이동 */}
                <Route path="*" element={<Navigate replace to="/" />} />
            </Routes>
        </>
    );

}