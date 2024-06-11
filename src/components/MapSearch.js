import { Scrollbars } from 'react-custom-scrollbars-2';
import { SiMaplibre } from "react-icons/si";
import { AiOutlineClose } from "react-icons/ai";
import { RiRoadMapFill } from "react-icons/ri";
import { FaListUl } from "react-icons/fa6";
import { FaRegStar } from "react-icons/fa";
import { FaStar } from "react-icons/fa";
import React, { useState, useRef, useEffect, useContext } from 'react';
import PlaceSave from './PlaceSave';
import useMobile from 'components/UseMobile.js';
import { MapContext } from 'context/MapContext';
import { IoInformationCircleOutline } from "react-icons/io5";
import axiosInstance from 'utils/axiosInstance';

export default function MapSearch({ closeEvent }) {

    const isMobile = useMobile();

    const { showMobileMapSearch, setShowMobileMapSearch, showMobileMapList, setShowMobileMapList,  map, psRef, markers, setMarkers, currentPosition } = useContext(MapContext);
    const [datas, setDatas] = useState([]);
    const [selectedData, setSelectedData] = useState(null);
    

    const [keyword, setKeyword] = useState('');
    const [pageNumber, setPageNumber] = useState(1); // 추가 검색을 위한 페이지 번호
    const [searchLastCheck, setSearchLastCheck] = useState(false);  // 검색 마지막 완료 
    const kakao = window.kakao;

    const itemRefs = useRef({});

    let debounceTimeout = null;

    // 장소 저장에 필요한 데이터
    const [showPlaceSave, setShowPlaceSave] = useState(false);  // 저장
    const [savePlaceId, setSavePlaceId] = useState('');
    const [savePlaceAlias, setSavePlaceAlias] = useState('');
    const [saveNotes, setSaveNotes] = useState('');
    const [memoryDate, setMemoryDate] = useState(null);
    const [saveStorageCategory, setSaveStorageCategory] = useState('PSCC_1');
    const [saveEditRestrict, setSaveEditRestrict] = useState(false);

    const [activeMemorySavedPlaceList, setActiveMemorySavedPlaceList] = useState(null);

    // 장소 정보 가져오기
    const getPlaceList = async () => {
        try {
            const plRes = await axiosInstance.get(`/api/places/active`, {
                params: {
                    storageCategory: undefined
                }
            });
            setActiveMemorySavedPlaceList(plRes.data.placeList);

        } catch (error) {
            setActiveMemorySavedPlaceList(null);
        }
    }


    // 장소 저장
    const handleSavePlace = async () => {

        if (savePlaceAlias === '') {
            alert('장소 명을 입력하세요.');
            return;
        }

        // 저장  데이터
        const placeData = datas.find(data => data.placeId === savePlaceId);
        let reqData = {
            ...placeData,
            placeAlias: savePlaceAlias,
            notes: saveNotes,
            memoryDate: memoryDate,
            storageCategory: saveStorageCategory,
            editRestrict: saveEditRestrict
        };

        // 장소정보 저장
        await axiosInstance.post(`/api/places/place`, reqData)
            .then(res => {
                savePlaceClear();   // 저장 정보 초기화
                if (res.data.resultMsg !== '') {
                    alert(res.data.resultMsg);
                } else {

                    const getPlaceList = async () => {
                        try {
                            const plRes = await axiosInstance.get(`/api/places/active`, {
                                params: {
                                    storageCategory: undefined
                                }
                            });
                            setActiveMemorySavedPlaceList(plRes.data.placeList);
            
                        } catch (error) {
                            setActiveMemorySavedPlaceList(null);
                        }
                    }
                    getPlaceList();
                    const starBtn = document.getElementById(`starBtn_${savePlaceId}`);  // 스타일 변경
                    if (starBtn) {
                        starBtn.classList.add('text-[#FFE400]'); // 클래스 추가
                    }
                }
            })
            .catch(error => {
                savePlaceClear();
                alert(error.response.data.resultMsg);
            });
    }


    // 기존 정보 초기화
    const clearAllData = () => {
        setSearchLastCheck(false);  // 검색 초기화
        setPageNumber(1);   // 번호 초기화
        markers.forEach(marker => marker.setMap(null));
        setMarkers([]);
        setDatas([]);
        setSelectedData(null);
    }

    // 장소 저장 정보 초기화
    const savePlaceClear = () => {
        setShowPlaceSave(false);
        setSavePlaceId('');
        setSavePlaceAlias('');
        setSaveNotes('');
        setMemoryDate(null);
        setSaveStorageCategory('PSCC_1');
        setSaveEditRestrict(false);
    }

    useEffect(() => {
        getPlaceList();
        savePlaceClear();
        clearAllData();
        setShowMobileMapSearch(false);
        setShowMobileMapList(false);
        setKeyword('');
    }, []);


    useEffect(() => {
        if (markers.length <= 0) {
            return;
        }

        // 마커 클릭리스너 추가
        markers.forEach(marker => {
            kakao.maps.event.addListener(marker, 'click', () => {

                const clickData = {
                    placeId: marker.placeId,
                    placeNm: marker.placeNm,
                    placeCategoryCode: marker.placeCategoryCode,
                    address: marker.address,
                    placeUrl: marker.placeUrl,
                    latitude: marker.getPosition().getLat(),
                    longitude: marker.getPosition().getLng()
                };

                handlePlaceDataClick(clickData);
                if (isMobile) {
                    setShowMobileMapList(true);
                    setShowMobileMapSearch(true);
                }

                setTimeout(() => {
                    if (itemRefs.current[clickData.placeId]) {
                        itemRefs.current[clickData.placeId].scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 100);
            });
        });
    }, [markers]);

    // 장소 검색
    const handleSearch = async (newPage) => {
        const searchOption = {
            location: new kakao.maps.LatLng(currentPosition.lat, currentPosition.lng),
            page: newPage
        };
        psRef.current.keywordSearch(keyword, (data, status) => {
            if (status === kakao.maps.services.Status.OK) {
                let filteredData = data;
                if (newPage > 1) {
                    // 중복된 장소를 필터링하여 새로운 데이터 생성
                    filteredData = data.filter((place) => (
                        !datas.some((existingPlace) => existingPlace.placeId === place.id)
                    ));
                }
                if (newPage > 1 && filteredData.length === 0) {  // 더이상 중복되지 않은 데이터가 없는 경우에는 목록 추가x
                    setSearchLastCheck(true);
                    return;
                }

                // 새로운 마커들 생성
                const newMarkers = data.map((place) => {
                    const markerPosition = new kakao.maps.LatLng(place.y, place.x);
                    const markerImage = new kakao.maps.MarkerImage(
                        `${process.env.PUBLIC_URL}/images/marker_search.png`, // 마커 이미지 경로
                        new kakao.maps.Size(32, 32)
                    );

                    const marker = new kakao.maps.Marker({
                        position: markerPosition,
                        image: markerImage // 마커 이미지 설정
                    });


                    // 생성한 마커를 지도에 추가
                    marker.placeId = place.id
                    marker.placeNm = place.place_name;
                    marker.placeCategoryCode = place.category_group_code;
                    marker.address = place.address_name;
                    marker.placeUrl = place.place_url;



                    marker.setMap(map);
                    return marker;
                });
                setMarkers((prevMarkers) => [...prevMarkers, ...newMarkers]);
                
                setDatas((prevDatas) => [...prevDatas,
                ...filteredData.map((place) => (
                    {
                        placeId: place.id,
                        placeNm: place.place_name,
                        placeCategoryCode: place.category_group_code,
                        address: place.address_name,
                        placeUrl: place.place_url,
                        latitude: place.y,  // 위도
                        longitude: place.x  // 경도
                    }))])

                // 검색 결과 중 첫 번째 장소의 위치를 기준으로 지도의 중심을 설정
                if (filteredData.length > 0 && newPage === 1) {
                    const firstPlace = filteredData[0];
                    const centerPosition = new kakao.maps.LatLng(firstPlace.y, firstPlace.x);
                    map.panTo(centerPosition);
                    // isMobile?map.setCenter(centerPosition):map.panTo(centerPosition);
                }

            } else {
                clearAllData();
            }
        }, searchOption);
    }


    // 장소 검색
    const handleEnter = (event) => {
        if (event.key === 'Enter') {

            event.preventDefault();
            event.stopPropagation();

            if (debounceTimeout) {
                clearTimeout(debounceTimeout);
            }

            debounceTimeout = setTimeout(() => {
                // 기존의 마커들 제거
                clearAllData();
                getPlaceList();

                if (keyword.trim() !== '') {
                    if (!psRef.current) {
                        psRef.current = new window.kakao.maps.services.Places();    // psRef == null이면 Places 생성
                    }

                    handleSearch(1);
                }
            }, 300); // 300ms 디바운스
        }
    };

    // 장소 정보 클릭했을 때
    const handlePlaceDataClick = async (data) => {

        setSelectedData(data);
        setShowMobileMapList(false);

        const dataPosition = new kakao.maps.LatLng(data.latitude, data.longitude);
        map.panTo(dataPosition);
        // isMobile?map.setCenter(dataPosition):map.panTo(dataPosition);

        // 클릭된 장소의 좌표와 마커의 좌표를 비교하여 색상을 변경
        markers.forEach(marker => {
            if (marker.placeId === data.placeId) {  // 클릭한 정보 마커 변경
                marker.setImage(new kakao.maps.MarkerImage(
                    `${process.env.PUBLIC_URL}/images/marker_search_skyblue.png`, // 마커 이미지 경로
                    new kakao.maps.Size(32, 32)
                ));
                marker.setZIndex(10); // 클릭된 마커를 가장 위로 올림
            } else {
                marker.setImage(new kakao.maps.MarkerImage(
                    `${process.env.PUBLIC_URL}/images/marker_search.png`, // 마커 이미지 경로
                    new kakao.maps.Size(32, 32)
                )); // 원래 마커 이미지로 변경
                marker.setZIndex(0);
            }
        });
    };

    // 상세정보
    const openPlaceUrl = (data) => {
        let placeUrl = data;
        if (isMobile) {
            const parts = data.split('.com');
            placeUrl = parts[0] + '.com/m' + parts[1];
            // const remainingUrl = parts.length > 1 ? parts[1] : '';
        }
        window.open(placeUrl, '_blank')
    }

    // 스크롤이 가장 아래로 내려왔을 때 실행되는 메서드
    const handleScrollToBottom = (values) => {
        const { scrollTop, scrollHeight, clientHeight } = values;
        setTimeout(() => {
            if (scrollTop !== 0 && searchLastCheck === false && Math.abs(scrollHeight - scrollTop - clientHeight) <= 1) {
                let newPageNumber = pageNumber + 1;
                setPageNumber(newPageNumber);

                setTimeout(() => {
                    handleSearch(newPageNumber);
                }, 200);
            }

        }, 200);
    };

    const checkSavePlace = (data) => {

        if(activeMemorySavedPlaceList === null){
            return false;
        }
        return activeMemorySavedPlaceList.some(place => place.place_id === data.placeId);
    }

    return (
        <>
            {/* PC */}
            {!isMobile &&
                <div className='sidebar-content-box'>
                    <input type="text" placeholder="장소 검색" className="map-search-input"
                        onKeyDown={handleEnter}
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />

                    <div className='place-search-box '>
                        <Scrollbars onScrollFrame={(values) => { handleScrollToBottom(values); }} >
                            {datas.length === 0 &&
                                <span className='flex mt-5'>검색 결과가 존재하지 않습니다.</span>
                            }

                            {datas.length !== 0 && datas.map(data => (
                                <div key={data.placeId} className='border-b-gray-200 py-5 border-b '
                                    ref={(el) => (itemRefs.current[data.placeId] = el)}
                                >
                                    <div className='place-search-item'>
                                        <div className='place-search-item flex-1' onClick={() => handlePlaceDataClick(data)}>
                                            <SiMaplibre className='size-10 text-slate-300' />
                                            <div className={`flex-1 ${selectedData !== null && selectedData.placeId === data.placeId ? 'text-[#00BFFF]' : ''}`}>
                                                <p>{data.placeNm}</p>
                                                <p>{data.address}</p>
                                            </div>

                                        </div>
                                        <button className='mr-4' id={`starBtn_${data.placeId}`} onClick={() => { if(checkSavePlace(data) === false){setSavePlaceId(data.placeId); setSavePlaceAlias(data.placeNm); setShowPlaceSave(true); }}} >
                                            <FaRegStar className={`size-6 ${checkSavePlace(data) ? 'text-[#FFE400]' : ''}`} />
                                        </button>
                                    </div>
                                    <div className='ml-12 mt-2 '>
                                        <button className='flex gap-1 items-center cursor-pointer' onClick={() => openPlaceUrl(data.placeUrl)}>
                                            <IoInformationCircleOutline className='size-4' />
                                            상세 정보
                                        </button>
                                    </div>

                                </div>
                            ))}
                        </Scrollbars>
                    </div>
                </div>
            }


            {/* Mobile */}
            {/* 검색창 */}
            {isMobile &&
                <div role="presentation" className={`map-mobile-search-box ${showMobileMapSearch ? 'bg-white' : ''}`}>
                    {showMobileMapSearch &&
                        <button>
                            {showMobileMapList ?
                                <RiRoadMapFill className='size-7 text-[#00BFFF]' onClick={() => setShowMobileMapList((val) => !val)} />
                                :
                                <FaListUl className='size-7 text-[#00BFFF]' onClick={() => setShowMobileMapList((val) => !val)} />
                            }
                        </button>
                    }

                    <input type="text" placeholder="장소 검색" className="map-mobile-search-input h-full "
                        onClick={() => { setShowMobileMapList(true); setShowMobileMapSearch(true); }}
                        onKeyDown={handleEnter}
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />

                    {showMobileMapSearch &&
                        <button onClick={() => { setShowMobileMapSearch(false); setShowMobileMapList(false); closeEvent('mapSearch'); clearAllData(); setKeyword('') }}>
                            <AiOutlineClose className='size-5' />
                        </button>
                    }
                </div>
            }

            {/* 검색 목록 */}
            {isMobile && showMobileMapList &&
                <div className='map-search-mobile-content-box'>
                    <div className='mobile-place-box'>
                        <Scrollbars thumbSize={85} onScrollFrame={(values) => { handleScrollToBottom(values); }}>
                            {datas.length === 0 &&
                                <span className='flex mt-5'>검색 결과가 존재하지 않습니다.</span>
                            }

                            {datas.length !== 0 && datas.map(data => (
                                <div key={data.placeId} className='border-b-gray-200 py-5 border-b ' ref={(el) => (itemRefs.current[data.placeId] = el)}>
                                    <div className='place-search-item'>
                                        <div className='place-search-item flex-1' onClick={() => handlePlaceDataClick(data)}>
                                            <SiMaplibre className='size-10 text-slate-300' />
                                            <div className={`flex-1 ${selectedData !== null && selectedData.placeId === data.placeId ? 'text-[#00BFFF]' : ''}`}>
                                                <p>{data.placeNm}</p>
                                                <p>{data.address}</p>
                                            </div>
                                        </div>
                                        <button className='mr-4' onClick={() => { if(checkSavePlace(data) === false){setSavePlaceId(data.placeId); setSavePlaceAlias(data.placeNm); setShowPlaceSave(true); }}}>
                                            <FaRegStar className={`size-6 ${checkSavePlace(data) ? 'text-[#FFE400]' : ''}`} />
                                        </button>
                                    </div>

                                    {data.placeUrl !== '' &&
                                        <div className='ml-12 mt-2 ' > 
                                            <button className='flex gap-1 items-center cursor-pointer' onClick={() => openPlaceUrl(data.placeUrl)}>
                                                <IoInformationCircleOutline className='size-4' />
                                                상세 정보
                                            </button>
                                        </div>
                                    }
                                    

                                </div>

                            ))}
                        </Scrollbars>
                    </div>
                </div>
            }
            {showPlaceSave && <PlaceSave
                onClose={() => { savePlaceClear(); }}
                placeAlias={savePlaceAlias} setPlaceAlias={setSavePlaceAlias}
                notes={saveNotes} setNotes={setSaveNotes}
                memoryDate={memoryDate} setMemoryDate={setMemoryDate}
                storageCategory={saveStorageCategory} setStorageCategory={setSaveStorageCategory}
                editRestrict={saveEditRestrict} setEditRestrict={setSaveEditRestrict}
                visibleEditRestrict={true}
                handleSavePlace={handleSavePlace}
            />

            }

        </>

    )
}