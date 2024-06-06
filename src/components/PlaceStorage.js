import React, { useEffect, useState, useContext, useRef } from 'react';
import { AiOutlineClose } from "react-icons/ai";
import { Scrollbars } from 'react-custom-scrollbars-2';
import { SiMaplibre } from "react-icons/si";
import { FaPencilAlt } from "react-icons/fa";
import useMobile from 'components/UseMobile.js';
import PlaceSave from './PlaceSave';
import axiosInstance from 'utils/axiosInstance';
import { MapContext } from 'context/MapContext';
import { IoInformationCircleOutline } from "react-icons/io5";
import { RiRoadMapFill } from "react-icons/ri";
import { FaListUl } from "react-icons/fa6";

export default function PlaceStorage({ closeEvent }) {

    const isMobile = useMobile();
    const [activeTab, setActiveTab] = useState('PSCC_1');

    const [placeList, setPlaceList] = useState(null);
    const [selectedData, setSelectedData] = useState(null); // 장소 선택
    const kakao = window.kakao;
    const itemRefs = useRef({});
    const { showMobileMapSearch, setShowMobileMapSearch, map, psRef, markers, setMarkers, currentPosition } = useContext(MapContext);

    // 추억 정보 가져오기
    const getPlaceList = async (storageCategory) => {
        try {
            const res = await axiosInstance.get(`/api/places/active`, {
                params: {
                    storageCategory: storageCategory
                }
            });
            setPlaceList(res.data.placeList);
        } catch (error) {
            setPlaceList(null);
        }
    }

    // 장소목록
    useEffect(() => {
        savePlaceClear();
    }, []);

    // 탭 변경
    const changeActiveTab = (storageCategory) => {
        setSelectedData(null);
        setActiveTab(storageCategory);
        setSaveStorageCategory(storageCategory);
    };

    // 카테고리별 장소 조회
    useEffect(() => {

        markers.forEach(marker => marker.setMap(null));
        setMarkers([]);

        getPlaceList(activeTab);
    }, [activeTab]);


    // 장소 정보 클릭했을 때
    const handlePlaceDataClick = async (data) => {

        setSelectedData(data);

        const dataPosition = new kakao.maps.LatLng(data.latitude, data.longitude);
        map.panTo(dataPosition);
        // isMobile?map.setCenter(dataPosition):map.panTo(dataPosition);

        // 클릭된 장소의 좌표와 마커의 좌표를 비교하여 색상을 변경
        markers.forEach(marker => {
            if (marker.place_seq_no === data.place_seq_no) {  // 클릭한 정보 마커 변경
                marker.setImage(new kakao.maps.MarkerImage(
                    `${process.env.PUBLIC_URL}/images/marker_search_current.png`, // 마커 이미지 경로
                    new kakao.maps.Size(32, 32)
                ));
                marker.setZIndex(35); // 클릭된 마커를 가장 위로 올림
            } else {
                marker.setImage(new kakao.maps.MarkerImage(
                    `${process.env.PUBLIC_URL}/images/marker_search.png`, // 마커 이미지 경로
                    new kakao.maps.Size(32, 32)
                )); // 원래 마커 이미지로 변경
                marker.setZIndex(0);
            }
        });
    };

    // 마커 이벤트
    useEffect(() => {
        if (markers.length <= 0) {
            return;
        }

        // 마커 클릭리스너 추가
        markers.forEach(marker => {
            kakao.maps.event.addListener(marker, 'click', () => {

                const clickData = {
                    place_seq_no: marker.place_seq_no,
                    place_id: marker.place_id,
                    place_nm: marker.place_nm,
                    place_category_code: marker.place_category_code,
                    address: marker.address,
                    place_url: marker.place_url,
                    latitude: marker.getPosition().getLat(),
                    longitude: marker.getPosition().getLng()
                };

                handlePlaceDataClick(clickData);
                setTimeout(() => {
                    if (itemRefs.current[clickData.place_seq_no]) {
                        itemRefs.current[clickData.place_seq_no].scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 100);
            });
        });
    }, [markers]);


    // 마커
    useEffect(() => {
        if (placeList === null)
            return;

        const newMarkers = placeList.map((place) => {
            const markerPosition = new kakao.maps.LatLng(place.latitude, place.longitude);
            const markerImage = new kakao.maps.MarkerImage(
                `${process.env.PUBLIC_URL}/images/marker_search.png`, // 마커 이미지 경로
                new kakao.maps.Size(32, 32)
            );

            const marker = new kakao.maps.Marker({
                position: markerPosition,
                image: markerImage // 마커 이미지 설정
            });

            // 생성한 마커를 지도에 추가
            marker.place_seq_no = place.place_seq_no;
            marker.place_id = place.place_id;
            marker.place_nm = place.place_nm;
            marker.place_category_code = place.place_category_code;
            marker.address = place.address;
            marker.place_url = place.place_url;

            marker.setMap(map);
            return marker;
        });
        setMarkers(newMarkers);

        // 마커가 모두 추가된 후에 map.panTo 호출
        if (newMarkers.length > 0) {
            const centerPosition = new kakao.maps.LatLng(newMarkers[0].getPosition().getLat(), newMarkers[0].getPosition().getLng());
            map.panTo(centerPosition);
            // isMobile?map.setCenter(centerPosition):map.panTo(centerPosition);
        }

    }, [placeList]);


    // 장소 저장에 필요한 데이터
    const [showPlaceSave, setShowPlaceSave] = useState(false);  // 저장
    const [savePlaceSeqNo, setSavePlaceSeqNo] = useState(null);
    const [savePlaceAlias, setSavePlaceAlias] = useState('');
    const [saveNotes, setSaveNotes] = useState('');
    const [saveStorageCategory, setSaveStorageCategory] = useState('PSCC_1');
    const [saveEditRestrict, setSaveEditRestrict] = useState(false);
    const [saveVisibleEditRestrict, setSaveVisibleEditRestrict] = useState(true);

    // 장소 저장 정보 초기화
    const savePlaceClear = () => {
        setShowPlaceSave(false);
        setSavePlaceSeqNo(null);
        setSavePlaceAlias('');
        setSaveNotes('');
        setSaveStorageCategory('PSCC_1');
        setSaveEditRestrict(false);
        setSaveVisibleEditRestrict(true);
    }

    // 저장 컴포넌트 열기
    const openSavePlace = async (data) => {
        setSavePlaceSeqNo(data.place_seq_no);
        setSavePlaceAlias(data.place_alias);
        setSaveNotes(data.notes);
        setSaveStorageCategory(data.storage_category);
        setSaveEditRestrict(data.edit_restrict);

        const loginUser = JSON.parse(sessionStorage.getItem('loginUser'));
        if (data.user_seq_no !== loginUser.user_seq_no) {
            setSaveVisibleEditRestrict(false);
        }

        setShowPlaceSave(true);
    }

    // 저장
    const handleSavePlace = async () => {

        if (savePlaceAlias === '') {
            alert('장소 명을 입력하세요.');
            return;
        }

        // 저장  데이터
        let reqData = {
            place_seq_no: savePlaceSeqNo,
            place_alias: savePlaceAlias,
            notes: saveNotes,
            storage_category: saveStorageCategory,
            edit_restrict: saveEditRestrict
        };

        try {
            // 장소정보 저장
            const res = await axiosInstance.put(`/api/places/place`, reqData);

            savePlaceClear(); // 저장 정보 초기화

            if (res.data.resultMsg !== '') {
                alert(res.data.resultMsg);
            } else {
                markers.forEach(marker => marker.setMap(null));
                setMarkers([]);
                getPlaceList(activeTab);
            }
        } catch (error) {
            savePlaceClear(); // 저장 정보 초기화
            alert(error.response.data.resultMsg);
        }

        // 장소정보 저장
        // await axiosInstance.put(`/api/places/place`, reqData)
        //     .then(res => {
        //         savePlaceClear();   // 저장 정보 초기화
        //         if (res.data.resultMsg !== '') {
        //             alert(res.data.resultMsg);
        //         } else {

        //             markers.forEach(marker => marker.setMap(null));
        //             setMarkers([]);

        //             getPlaceList(activeTab);
        //         }
        //     })
        //     .catch(error => {
        //         savePlaceClear();   // 저장 정보 초기화
        //         alert(error.response.data.resultMsg);
        //     });
    }

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

    // 장소 삭제
    const deletePlace = async (data) => {

        try {
            const res = await axiosInstance.delete(`/api/places/place`, {
                params: {
                    placeSeqNo: data.place_seq_no
                }
            });

            if (res.status === 200) {
                markers.forEach(marker => marker.setMap(null));
                setMarkers([]);
                getPlaceList(activeTab);
            } else {
                alert(res.data.resultMsg);
            }
        } catch (error) {
            alert(error.response.data.resultMsg);
        }
    }

    const [showMobileMapList, setShowMobileMapList] = useState(true);

    return (
        <>
            <div className={`${!isMobile ? 'sidebar-content-box px-2 py-5' : 'menu-mobile-content-box'}`}>
                {isMobile &&

                    <>
                        <div className='absolute top-5'>

                            <button className=''>
                                {showMobileMapList ?
                                    <RiRoadMapFill className='size-7 text-[#96DBF4]' onClick={() => setShowMobileMapList((val) => !val)} />
                                    :
                                    <FaListUl className='size-7 text-[#96DBF4]' onClick={() => setShowMobileMapList((val) => !val)} />
                                }
                            </button>
                        </div>
                        <div className='absolute top-6 right-5'>
                            <button className='menu-mobile-close-btn' onClick={() => closeEvent('mapSearch')}>
                                <AiOutlineClose className='size-5' />
                            </button>
                        </div>
                    </>

                }

                <div>
                    <ul className='place-storage-tab-box' >
                        <li className={`place-storage-tab-item  ${activeTab === 'PSCC_1' ? 'place-storage-tab-item-active' : ''}`}
                        ><button className='w-full' onClick={() => { changeActiveTab('PSCC_1') }}>저장 장소</button>
                        </li>
                        <li className={`place-storage-tab-item  ${activeTab === 'PSCC_2' ? 'place-storage-tab-item-active' : ''}`}
                        ><button className='w-full' onClick={() => { changeActiveTab('PSCC_2') }}>추억 장소</button>
                        </li>
                    </ul>
                </div>

                <div className='place-storage-box' >
                    <Scrollbars thumbSize={85}  >

                        {placeList !== null && placeList.map((data) => (
                            <div key={data.place_seq_no} className='border-b-gray-200 border-b py-5' ref={(el) => (itemRefs.current[data.place_seq_no] = el)}>
                                <div className='place-storage-item'>

                                    <SiMaplibre className='size-10' style={{ color: data.symbol_color_code }} />
                                    <div className={`flex-1 cursor-pointer ${selectedData !== null && selectedData.place_seq_no === data.place_seq_no ? 'text-[#96DBF4]' : ''}`} onClick={() => handlePlaceDataClick(data)}>
                                        <p className='text-lg'>{data.place_alias}</p>
                                        <p className='text-sm ' title={`${data.address}`}>{data.address.length > 25 ? `${data.address.substring(0, 25)}...` : data.address}</p>
                                        <p className='text-sm ' title={`${data.notes}`} >{data.notes.length > 25 ? `${data.notes.substring(0, 25)}...` : data.notes}</p>
                                    </div>

                                    {(data.edit_restrict === false || (data.edit_restrict === true && data.user_seq_no === JSON.parse(sessionStorage.getItem('loginUser')).user_seq_no)) &&
                                        <div className='flex gap-3 float-right text-gray-400 mr-3'>
                                            <button onClick={() => { openSavePlace(data); }}>
                                                <FaPencilAlt />
                                            </button>
                                            <button onClick={() => { deletePlace(data); }}>
                                                <AiOutlineClose />
                                            </button>

                                        </div>
                                    }
                                </div>

                                {data.place_url !== '' &&
                                    <div className={`ml-12 mt-1 ${selectedData !== null && selectedData.place_seq_no === data.place_seq_no ? 'text-[#96DBF4]' : 'text-gray-600'} `}>
                                        <button className='flex gap-1 items-center cursor-pointer text-sm' onClick={() => openPlaceUrl(data.place_url)}>
                                            <IoInformationCircleOutline className='size-3' />
                                            상세 정보
                                        </button>
                                    </div>
                                }
                            </div>
                        ))}
                        {placeList === null &&
                            <div className='flex gap-3 items-center p-3 py-5'>
                                저장된 장소 정보가 없습니다.
                            </div>
                        }
                    </Scrollbars>
                </div >
            
                



            </div >

            {showPlaceSave && <PlaceSave
                onClose={() => { savePlaceClear(); }}
                placeAlias={savePlaceAlias} setPlaceAlias={setSavePlaceAlias}
                notes={saveNotes} setNotes={setSaveNotes}
                storageCategory={saveStorageCategory} setStorageCategory={setSaveStorageCategory}
                editRestrict={saveEditRestrict} setEditRestrict={setSaveEditRestrict}
                visibleEditRestrict={saveVisibleEditRestrict}
                handleSavePlace={handleSavePlace}
            />
            }

        </>

    )
}

