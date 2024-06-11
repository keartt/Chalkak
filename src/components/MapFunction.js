import React, { useEffect, useState, useContext, useRef } from 'react';
import useMobile from 'components/UseMobile.js';
import { TfiPencilAlt } from "react-icons/tfi";
import { TbCurrentLocation } from "react-icons/tb";
import { MapContext } from 'context/MapContext';
import ColorPicker from './ColorPicker';
import { GrPowerReset } from "react-icons/gr";
import { IoIosSave } from "react-icons/io";
import html2canvas from 'html2canvas';

export default function MapFunction() {
  const { currentPosition, map } = useContext(MapContext);
  const isMobile = useMobile();

  const [drawStatus, setDrawStatus] = useState(false);
  const canvasRef = useRef(null);


  const [painting, setPainting] = useState(false);
  const [lastX, setLastX] = useState(null);
  const [lastY, setLastY] = useState(null);

  // 그리기 설정
  const [strokeStyle, setStrokeStyle] = useState("#000000");

  // 현재 위치로
  const clickCurrentLocation = () => {
    const moveLatLon = new window.kakao.maps.LatLng(currentPosition.lat, currentPosition.lng);
    map.setLevel(3);
    map.panTo(moveLatLon);
    // isMobile?map.setCenter(moveLatLon):map.panTo(moveLatLon);
  }

  // 손메모 이벤트
  const handleDraw = () => {
    map.setDraggable(drawStatus); // 지도 이동 제어
    map.setZoomable(drawStatus);  // 지도 줌 제어

    setDrawStatus(!drawStatus);   // 상태 변경

    // 모바일
    if(window.innerWidth <= 600){
      // 스크롤 잠그기
      if (!drawStatus) {
        document.body.style.overflow = 'hidden';  // 모바일의 경우 스크롤 정지
      } else {
        document.body.style.overflow = 'auto';
      }
    } else{
      let sidebar = document.querySelector('.map-sidebar-content');
      let sidebarToggle = document.querySelector('.map-sidebar-content-toggle');
      // 스크롤 잠그기
      if (!drawStatus) {
        sidebar.style.zIndex = '10';
        sidebarToggle.style.zIndex = '10';
      } else {
        sidebar.style.zIndex = '25';
        sidebarToggle.style.zIndex = '25';
      }
    }
    
  }

  // 페이지 사이즈 변경
  const handleResize = () => {
    if (canvasRef.current) {
      // canvasRef.current.width = window.innerWidth - 5 * parseFloat(getComputedStyle(document.documentElement).fontSize);
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
    }
  };

  // 그리기 상태 변경
  useEffect(() => {
    // setDrawStatus(false);
  }, []);

  useEffect(() => {
    if (!drawStatus) return;

    setStrokeStyle("#000000");

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [drawStatus]);

  // 그리기 시작
  const startDrawing = (e) => {
    setPainting(true);
    const clientX = window.innerWidth <= 600 ? (e.touches ? e.touches[0].clientX : e.nativeEvent.offsetX) : e.nativeEvent.offsetX;
    const clientY = window.innerWidth <= 600 ? (e.touches ? e.touches[0].clientY : e.nativeEvent.offsetY) : e.nativeEvent.offsetY;
    setLastX(clientX);
    setLastY(clientY);
    drawLine(clientX, clientY, clientX, clientY);
  }

  const draw = (e) => {
    if (!painting) return;

    const clientX = window.innerWidth <= 600 ? (e.touches ? e.touches[0].clientX : e.nativeEvent.offsetX) : e.nativeEvent.offsetX;
    const clientY = window.innerWidth <= 600 ? (e.touches ? e.touches[0].clientY : e.nativeEvent.offsetY) : e.nativeEvent.offsetY;
    drawLine(lastX, lastY, clientX, clientY);
    setLastX(clientX);
    setLastY(clientY);
  }

  const endDrawing = () => {
    setPainting(false);
  }

  const drawLine = (startX, startY, endX, endY) => {

    const ctx = canvasRef.current.getContext("2d");
    ctx.lineJoin = "round";
    ctx.lineWidth = 5;
    ctx.strokeStyle = strokeStyle;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 캔버스를 클리어합니다.
  };


  // 저장 함수
 const saveCanvas = () => {
  // HTML 요소 캡쳐
  const elementToCapture = document.querySelector('.map-container');
  
  // html2canvas를 사용하여 화면 캡쳐
  html2canvas(elementToCapture).then(canvas => {
    // 캡쳐된 이미지를 데이터 URL로 변환
    const dataURL = canvas.toDataURL();
    
    // 데이터 URL을 이미지로 변환하여 다운로드
    const link = document.createElement('a');
    link.download = 'screenshot.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
};



  return (
    <>
      <div className={`absolute right-4 ${isMobile ? 'top-28' : 'top-4'} flex flex-col gap-4`}>
        
        <button className={`map-func-btn z-[25] ${drawStatus === true ? 'text-white bg-[#00BFFF]' : 'bg-white text-black'}`} onClick={handleDraw}>
          <TfiPencilAlt />
        </button>

        {/* 그리기 도구 */}
        {drawStatus && <>

          <div className={` z-[25] absolute top-0  right-14 flex gap-2`}>

            <ColorPicker color={strokeStyle} setStrokeStyle={setStrokeStyle} />

            <button className={`map-func-btn z-[25] bg-white`} onClick={clearCanvas}>
              <GrPowerReset />
            </button>
            {/* <button className={`map-func-btn z-[25] bg-white`} onClick={saveCanvas}>
              <IoIosSave />
            </button> */}

          </div>

        </>
        }

        <button className='map-func-btn bg-white text-black z-[15]' onClick={clickCurrentLocation}>
          <TbCurrentLocation />
        </button>


      </div>
      {drawStatus && (
        <canvas
          className='canvas'
          ref={canvasRef}

          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}

          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}

          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100%',
            // width: `${isMobile ? '100%' : 'calc(100% - 5rem)'}`,
            height: '100%',
            zIndex: 20
          }}
        />
      )}
    </>
  );
}
