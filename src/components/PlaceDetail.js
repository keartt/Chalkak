import React, { useState, useEffect } from 'react';
import { AiOutlineClose } from "react-icons/ai";
import axiosInstance from 'utils/axiosInstance';
import useMobile from 'components/UseMobile';

import { CiLocationOn } from "react-icons/ci";
import { CiSignpostR1 } from "react-icons/ci";
import { IoInformationCircleOutline } from "react-icons/io5";
import { CiCalendar } from "react-icons/ci";
import { Scrollbars } from 'react-custom-scrollbars-2';
import { BsEmojiSmileFill } from "react-icons/bs";
import { GoTrash } from "react-icons/go";


export default function PlaceDetail({ onClose, placeSeqNo }) {

    const isMobile = useMobile();
    const [placeData, setPlaceData] = useState({});

    const [placeDetailList, setPlaceDetailList] = useState(null);
    const [writePd, setWritePd] = useState('');
    const [modifyPd, setModifyPd] = useState('');

    // 장소 정보 가져오기
    const getPlaceInfo = async () => {
        try {
            const res = await axiosInstance.get(`/api/places/place/placeSeqNo`, {
                params: {
                    placeSeqNo: placeSeqNo
                }
            });
            setPlaceData(res.data.placeInfo);
        } catch (error) {
            setPlaceData(null);
            alert('장소 정보 조회 중 문제가 발생했습니다. 다시 시도해주세요.');
            onClose();
        }
    }

    // 장소 정보 가져오기
    const getPlaceDetailList = async () => {

        if (Object.keys(placeData).length === 0 && placeData.constructor === Object) return;
        try {
            const res = await axiosInstance.get(`/api/placeDetails/placeSeqNo`, {
                params: {
                    placeSeqNo: placeSeqNo
                }
            });

            const loginUser = JSON.parse(sessionStorage.getItem('loginUser'));
            if (res.data.placeDetailList !== null) {
                res.data.placeDetailList.forEach(placeDetail => {
                    placeDetail.editCheck = false;
                    if (placeDetail.user_seq_no === loginUser.user_seq_no) {
                        placeDetail.editCheck = true;
                    }
                });
                setPlaceDetailList(res.data.placeDetailList);
            } else{
                setPlaceDetailList(null);
            }


        } catch (error) {
            setPlaceData(null);
            setPlaceDetailList(null);
            alert(error.response.data.resultMsg);
            onClose();
        }
    }

    // 상세정보
    const openDetailPlaceUrl = (data) => {
        let placeUrl = data;
        if (isMobile) {
            const parts = data.split('.com');
            placeUrl = parts[0] + '.com/m' + parts[1];
            // const remainingUrl = parts.length > 1 ? parts[1] : '';
        }
        window.open(placeUrl, '_blank')
    }

    // 추억 정보 가져온 후 place_detail 정보 조회
    useEffect(() => {

        getPlaceDetailList();

    }, [placeData])

    useEffect(() => {
        setWritePd('');
        getPlaceInfo(); // 추억 정보
    }, []);

    // 
    const handleWritePd = async () => {
        if (writePd === '') {
            alert('댓글 내용을 입력하세요');
            return;
        }

        // 저장  데이터
        let reqData = {
            place_seq_no: placeSeqNo,
            place_detail_content: writePd
        };

        try {
            const res = await axiosInstance.post(`/api/placeDetails/placeDetail`, reqData);

            if (res.data.resultMsg !== '') {
                alert(res.data.resultMsg);
            } else {
                setWritePd('');
                getPlaceDetailList();
            }
        } catch (error) {
            setWritePd('');
            alert(error.response.data.resultMsg);
        }


    }

    // 수정 버튼
    const handleModify = async (place_detail_seq_no, place_detail_content) => {
        setModifyPd(place_detail_content);

        // 기존 스타일 reset
        document.querySelectorAll('[id^="modify_"]').forEach(element => { if (element.style.display === 'none') { element.style.display = 'block'; } });
        document.querySelectorAll('[id^="delete_"]').forEach(element => { if (element.style.display === 'none') { element.style.display = 'block'; } });
        document.querySelectorAll('[id^="content_"]').forEach(element => { if (element.style.display === 'none') { element.style.display = 'block'; } });
        document.querySelectorAll('[id^="content_ta_"]').forEach(element => { if (element.style.display === 'block') { element.style.display = 'none'; } });
        document.querySelectorAll('[id^="save_"]').forEach(element => { if (element.style.display === 'block') { element.style.display = 'none'; } });
        document.querySelectorAll('[id^="cancel_"]').forEach(element => { if (element.style.display === 'block') { element.style.display = 'none'; } });

        // UI 변경
        document.getElementById(`modify_${place_detail_seq_no}`).style.display = 'none';
        document.getElementById(`delete_${place_detail_seq_no}`).style.display = 'none';
        document.getElementById(`content_${place_detail_seq_no}`).style.display = 'none';

        document.getElementById(`content_ta_${place_detail_seq_no}`).style.display = 'block';
        document.getElementById(`save_${place_detail_seq_no}`).style.display = 'block';
        document.getElementById(`cancel_${place_detail_seq_no}`).style.display = 'block';
    }

    // 취소 버튼
    const handleCancel = async (place_detail_seq_no) => {
        setModifyPd('');
        document.getElementById(`modify_${place_detail_seq_no}`).style.display = 'block';
        document.getElementById(`delete_${place_detail_seq_no}`).style.display = 'block';
        document.getElementById(`content_${place_detail_seq_no}`).style.display = 'block';

        document.getElementById(`content_ta_${place_detail_seq_no}`).style.display = 'none';
        document.getElementById(`save_${place_detail_seq_no}`).style.display = 'none';
        document.getElementById(`cancel_${place_detail_seq_no}`).style.display = 'none';
    }

    // 삭제 버튼
    const handleDelete = async (place_detail_seq_no) => {
        try {
            const res = await axiosInstance.delete(`/api/placeDetails/placeDetail`, {
                params: {
                    place_detail_seq_no: place_detail_seq_no,
                }
            });

            if (res.status === 200) {


                // 기존 스타일 reset
                document.querySelectorAll('[id^="modify_"]').forEach(element => { if (element.style.display === 'none') { element.style.display = 'block'; } });
                document.querySelectorAll('[id^="delete_"]').forEach(element => { if (element.style.display === 'none') { element.style.display = 'block'; } });
                document.querySelectorAll('[id^="content_"]').forEach(element => { if (element.style.display === 'none') { element.style.display = 'block'; } });
                document.querySelectorAll('[id^="content_ta_"]').forEach(element => { if (element.style.display === 'block') { element.style.display = 'none'; } });
                document.querySelectorAll('[id^="save_"]').forEach(element => { if (element.style.display === 'block') { element.style.display = 'none'; } });
                document.querySelectorAll('[id^="cancel_"]').forEach(element => { if (element.style.display === 'block') { element.style.display = 'none'; } });

                getPlaceDetailList();
            } else {
                alert(res.data.resultMsg);
            }
        } catch (error) {
            alert(error.response.data.resultMsg);
        }
    }

    const handleSave = async (place_detail_seq_no) => {
        if (modifyPd === '') {
            alert('수정할 댓글 내용을 입력하세요');
            return;
        }

        // 저장  데이터
        let reqData = {
            place_detail_seq_no: place_detail_seq_no,
            place_detail_content: modifyPd
        };

        try {
            const res = await axiosInstance.put(`/api/placeDetails/placeDetail`, reqData);

            if (res.data.resultMsg !== '') {
                alert(res.data.resultMsg);
            } else {

                document.querySelectorAll('[id^="modify_"]').forEach(element => { if (element.style.display === 'none') { element.style.display = 'block'; } });
                document.querySelectorAll('[id^="delete_"]').forEach(element => { if (element.style.display === 'none') { element.style.display = 'block'; } });
                document.querySelectorAll('[id^="content_"]').forEach(element => { if (element.style.display === 'none') { element.style.display = 'block'; } });
                document.querySelectorAll('[id^="content_ta_"]').forEach(element => { if (element.style.display === 'block') { element.style.display = 'none'; } });
                document.querySelectorAll('[id^="save_"]').forEach(element => { if (element.style.display === 'block') { element.style.display = 'none'; } });
                document.querySelectorAll('[id^="cancel_"]').forEach(element => { if (element.style.display === 'block') { element.style.display = 'none'; } });

                setWritePd('');
                getPlaceDetailList();
            }
        } catch (error) {
            setWritePd('');
            alert(error.response.data.resultMsg);
        }


    }




    return (
        <>
            <div className='fixed top-0 left-0 z-[38] w-full h-screen bg-gray-950 opacity-50' onClick={onClose} />

            <div className={`bg-white z-[40] py-5  ${isMobile ? 'absolute top-0 w-full h-full ' : 'shadow-lg  border-gray-300 rounded-[30px] border top-1/2 left-1/2  transform -translate-x-1/2 -translate-y-1/2 fixed min-w-[500px] w-[35%] h-[75%]'} `}>
                <Scrollbars thumbSize={85}>
                    <div className='px-5 flex flex-col h-full'>

                        <div className="relative">
                            <button className="absolute right-0 top-0 " onClick={onClose}><AiOutlineClose /></button>
                        </div>

                        <div className='gap-1 flex flex-col border-b border-gray-200 pb-5'>
                            <p className='text-[#00BFFF] text-2xl mb-2 flex items-center gap-2'>
                                {placeData.place_alias}
                                <button className='size-5 cursor-pointer hover:text-cyan-800' onClick={() => openDetailPlaceUrl(placeData.place_url)}>
                                    <IoInformationCircleOutline className='size-5' />
                                </button>
                            </p>

                            {placeData.address !== '' &&
                                <div className='flex gap-3 items-center text-lg'>
                                    <CiLocationOn className='size-5' />
                                    <p className='w-full'>{placeData.address}</p>
                                </div>
                            }
                            {placeData.notes !== '' &&

                                <div className='flex gap-3 items-center text-lg'>
                                    <CiSignpostR1 className='size-5 ' />
                                    <p className='w-full max-h-20 overflow-y-auto'>{placeData.notes}</p>
                                </div>
                            }
                            <p className='flex gap-3 items-center text-lg'><CiCalendar /> {placeData.memory_date === null ? '-' : placeData.memory_date}</p>

                        </div>

                        <div className='flex flex-col flex-1 pt-7 '>
                            <div className='flex-1'>

                                {placeDetailList !== null && placeDetailList.map((data) => (
                                    <div className='flex flex-col gap-5 mb-5 ' key={data.place_detail_seq_no}>
                                        <div className='flex flex-col gap-1'>
                                            <div className='flex items-center gap-1'>
                                                <BsEmojiSmileFill style={{ color: data.symbol_color_code }} />
                                                <p style={{ color: data.symbol_color_code }} className='text-lg'>{data.user_nm}</p>
                                            </div>

                                            <div className='px-5 '>
                                                <div id={`content_${data.place_detail_seq_no}`} dangerouslySetInnerHTML={{ __html: data.place_detail_content.replace(/\n/g, '<br />') }} />
                                                <textarea style={{ display: 'none' }} id={`content_ta_${data.place_detail_seq_no}`} className='bg-gray-200 rounded-2xl w-full min-h-[4.5rem]  resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#00BFFF] p-2 ' value={modifyPd} onChange={(e) => setModifyPd(e.target.value)} />
                                            </div>


                                            <div className='flex items-center px-5 text-gray-400'>
                                                <p className=' text-xs flex-1'>{data.create_dt}</p>

                                                {data.editCheck &&
                                                    <div className='flex gap-2'>

                                                        <button id={`save_${data.place_detail_seq_no}`} style={{ display: 'none' }} className='cursor-pointer hover:text-[#00BFFF] hover:border-[#00BFFF] shadow-sm border-[1px] rounded-full w-12 text-sm' onClick={() => handleSave(data.place_detail_seq_no)}>저장</button>
                                                        <button id={`cancel_${data.place_detail_seq_no}`} style={{ display: 'none' }} className='cursor-pointer hover:text-[#00BFFF] hover:border-[#00BFFF] shadow-sm border-[1px] rounded-full w-12 text-sm' onClick={() => handleCancel(data.place_detail_seq_no)}>취소</button>

                                                        <button id={`modify_${data.place_detail_seq_no}`} className='cursor-pointer hover:text-[#00BFFF] hover:border-[#00BFFF] shadow-sm border-[1px] rounded-full w-12 text-sm' onClick={() => handleModify(data.place_detail_seq_no, data.place_detail_content)}>수정</button>
                                                        <button id={`delete_${data.place_detail_seq_no}`} className='cursor-pointer hover:text-[#00BFFF] hover:border-[#00BFFF] shadow-sm border-[1px] rounded-full w-12 text-sm' onClick={() => handleDelete(data.place_detail_seq_no)} >삭제</button>
                                                    </div>
                                                }


                                            </div>

                                        </div>

                                    </div>

                                ))}
                                {placeDetailList === null && <div>댓글을 작성해주세요.</div>}

                            </div>

                            {/* 입력창 */}
                            <div className='gap-2 flex items-center p-1 ' >
                                <textarea className='bg-gray-200 rounded-2xl w-full min-h-[4.5rem]  resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#00BFFF] p-2 ' value={writePd} onChange={(e) => setWritePd(e.target.value)} />

                                <button className="bg-[#00BFFF] rounded-full w-20 h-16 text-white text-center " onClick={() => handleWritePd()}>저장</button>
                            </div>
                        </div>
                    </div>




                </Scrollbars>
            </div>




        </>

    )
}