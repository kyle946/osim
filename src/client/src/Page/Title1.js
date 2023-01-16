
import React from "react"
import logo1 from "../assets/logo1.png"
import "./Title1.less"

export default function Title1(props) {
    return (
        <div>
            <div className="logoarea">
                <img src={logo1} />
                <span>OSIM</span>
            </div>
            <a className="close1" onClick={() => { osim.closewin() }}> <font className="iconfont">&#xe8bb;</font> </a>
        </div>
    )
}