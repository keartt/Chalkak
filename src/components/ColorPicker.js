import React, { useState } from 'react'
import { ChromePicker } from 'react-color'
import useMobile from 'components/UseMobile.js';
import { FaCircle } from "react-icons/fa";

export default function ColorPicker({ color, setStrokeStyle }) {
    const isMobile = useMobile();

    const [displayColorPicker, setDisplayColorPicker] = useState(false);

    const handleClick = () => {
        setDisplayColorPicker(!displayColorPicker);
    };

    const changeColor = (val) => {
        setStrokeStyle(val.hex);
        const colorPickerButton = document.getElementById('colorPicker');
        colorPickerButton.style.color = val.hex;
    }

    return (
        <div className={`z-[25] `}  >
            <style>
                {`
                    .chrome-picker div[style*="text-align: right"] {
                        display: none !important;
                    }
                `}
            </style>

            <button id="colorPicker" className={`text-[${color}]`} onClick={handleClick}><FaCircle className='size-11' /></button>
            {displayColorPicker ?
                <div className={`absolute right-3 top-16`} >
                    <ChromePicker onChange={val => changeColor(val)} color={color} disableAlpha={true} />
                </div> : null}
        </div>
    )
}
