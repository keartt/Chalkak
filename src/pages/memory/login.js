import { RiKakaoTalkFill } from "react-icons/ri";
import { useNavigate } from 'react-router-dom'; 

export default function MemoryLogin() {
    const navigate = useNavigate();
    return (
       
        <div className="login-box" >
            <div className="login-logo-box">
                <div className="login-logo-img">
                    <img src="/images/chalkak_logo.png" alt="Chalkak Logo" width="200px" />
                </div>
                <p className="login-logo-text-bold">
                    SNS 계정으로 로그인해주세요
                </p>
                <p className="login-logo-text">
                    계정이 없다면 자동으로 회원가입이 진행됩니다.
                </p>
                
            </div>
            <div className="login-btn-box">
                <button
                    type="button"
                    className="login-btn login-btn-kakao"
                    onClick={() => navigate(`/memory/new`)}
                >
                    <RiKakaoTalkFill className="w-6 h-6 " />
                    Sign in with Kakao
                </button>
            </div>
        </div>
    )
}