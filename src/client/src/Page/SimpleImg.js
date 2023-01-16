import React from "react";
import "./SimpleImg.less"
import logo1 from "../assets/logo1.png"

export default class SimpleImg extends React.Component {
    constructor(props) {
        super(props);
        this.img=React.createRef();
        this.src = logo1
        this.state={
            style: {
            },
            style_gray: {
                filter: "grayscale(1)",
            }
        }
    }
    static defaultProps={
        src: logo1,
        gray: false,
        className: "SimpleImg",
    }
    componentDidMount(){
        this.forceUpdate()
    }
    componentDidUpdate(){
        let img1=new Image()
        img1.onload=()=>{
            this.img.current.src=this.props.src;
        }
        img1.src=this.props.src;
    }
    render(){
        return (
            <img className={this.props.className} style={this.props.gray?this.state.style_gray:this.state.style} ref={this.img} src={this.src} />
        )
    }
}