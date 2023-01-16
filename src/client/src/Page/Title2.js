
import React from "react"
import logo1 from "../assets/logo1.png"
import "./Title2.less"

export default function Title1(props) {
    return (
        <div className="Title2">
            <a className="min1" onClick={() => { osim.minwin() }}> <font className="iconfont">&#xe67a;</font></a>
            <a className="max1" onClick={() => { osim.maxwin() }}> <font className="iconfont">&#xe60d;</font></a>
            <a className="close1" onClick={() => { osim.closewin() }}> <font className="iconfont">&#xe61a;</font></a>
        </div>
    )
}