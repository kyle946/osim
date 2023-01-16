import React from "react";
import ReactDom from 'react-dom';
import AvatarEditor from 'react-avatar-editor'
const nativeImage = require('electron').nativeImage
import $$ from "../comm"
import logo1 from "../assets/logo1.png"
import "./Set.less"
import Empty1 from "./Empty1"



class Menu2 extends React.Component {
    constructor(props) {
        super(props)
        reactPage["Menu2"] = this
        this.state = {
            i: "details",
            d: [
                {
                    key: "details",
                    name: "User Details",
                    num: 0,
                    icon: '\u{e66a}'
                },
                {
                    key: "generals",
                    name: "Generals",
                    num: 0,
                    icon: '\u{e655}'
                },
                {
                    key: "shortcutkey",
                    name: "Shortcut Key",
                    num: 0,
                    icon: '\u{e643}'
                }
            ]
        }
    }
    static defaultProps = {
        click: () => { }
    }
    componentWillUnMount() {
        reactPage["Menu2"] = undefined;
    }
    client(v, i) {
        this.setState({ i: v.key })
        this.props.click(v, i)
    }
    setnum(index, num) {
        let d = this.state.d;
        d[index].num = num;
        this.setState({ d });
    }
    render() {
        let list1 = this.state.d.map((value, index) => {
            return <a key={index} className={this.state.i == value.key ? "active" : null} onClick={() => { this.client(value, index) }}><font className="iconfont">{value.icon}</font><span>{value.name}</span>{value.num > 0 && <font className="num">{value.num}</font>}</a>
        })
        return (
            <div className="Menu2">
                <div className="title">SET</div>
                {list1}
            </div>
        )
    }
}



class Baseinfo1 extends React.Component {
    constructor(props) {
        super(props)
        reactPage["Baseinfo1"] = this
        this.select_image = this.select_image.bind(this)
        this.save_avatar = this.save_avatar.bind(this)
        //保存
        this.save = this.save.bind(this)
        this.save1 = this.save1.bind(this)
        this.save2 = this.save2.bind(this)
        //创建ref对象
        this.btn_save = React.createRef()
        this.btn_save_avatar = React.createRef()
        this.editor = React.createRef(AvatarEditor);
    }
    state = {
        avatar: logo1,
        scale: 1,
        nickname: user.nickname,
        info: user.info,
    }
    componentWillUnMount(){
        reactPage["Baseinfo1"] = undefined
    }
    handleScale = (e) => {
        const scale = parseFloat(e.target.value)
        this.setState({ scale })
    }
    handleSave() {
        const img = this.editor.current?.getImageScaledToCanvas().toDataURL()
        const rect = this.editor.current?.getCroppingRect()
        if (!img || !rect) return
        //保存图片
    }
    handleChange(event) {
        const name = event.target.name;
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        this.setState({ [name]: value });
    }
    select_image() {
        osim.selectFile(2).then(buf => {
            const img = nativeImage.createFromDataURL(buf)
            this.setState({ avatar: img.toDataURL() })
        })
    }
    save_avatar() {
        console.log(this.btnsave.current);
        //修改按钮状态
        this.btn_save_avatar.current.style.backgroundColor = "#f1f1f1"
        this.btn_save_avatar.current.innerText = "saveing..."
    }
    saveTimer = null;
    //按钮点击事件
    save(){
        this.save1(0)
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
            this.saveTimer = null;
        }
        this.saveTimer = setTimeout(this.save2, 700);
    }
    //修改按钮状态, 0 正在保存, 1 恢复正常
    save1(state=0){
        if(state==0){
            this.btn_save.current.style.backgroundColor = "#f1f1f1"
            this.btn_save.current.innerText = "saveing..."
        }else{
            this.btn_save.current.style.backgroundColor = "#fff"
            this.btn_save.current.innerText = "Save"
        }
    }
    //执行保存操作
    save2() {
        let r1 = $$.checkName(this.state.nickname, 4, 20);
        if (r1 != 1) {
            $$.confirm("Nicknames are 4 to 20 characters long.", ()=>{}, true, false)
            this.save1(1)
            return;
        }
        var rule2 = new RegExp(/^.{4,64}$/)
        if (rule2.test(this.state.info) == false) {
            $$.confirm("Please complete your profile.", ()=>{}, true, false)
            this.save1(1)
            return;
        }
        let avatar = null
        if (this.state.avatar == logo1) {
            avatar = null
        } else {
            avatar = this.editor.current?.getImageScaledToCanvas().toDataURL()
        }
        if (global.user.state == 0) {
            if (avatar == null) {
                $$.confirm("Please upload your avatar.", ()=>{}, true, false)
                this.save1(1)
                return;
            }
        }
        let param = {
            token: global.token,
            avatar,
            info: this.state.info,
            nickname: this.state.nickname
        };
        let url = ser.http + "/update_user_info";
        $$.ajax(url, param, (res) => {
            if (res.code == 200) {
                global.user = res.data;
                $$.alert("Modified successfully.")
                reactPage["Home"].setavatar(user.avatar+'?v='+Math.random())
            }else if(res.code==402){
                $$.logout()
            } else {
                $$.confirm(res.msg, ()=>{}, false, true);
            }
        }, (err) => {
            $$.confirm("Save failure.", ()=>{}, false, true);
        }, () => {
            this.save1(1)
        });
    }
    render() {
        return (
            <div className="Baseinfo1">
                <div className="title">User Details</div>
                <div className="line1">
                    <div className="label">Email</div>
                    <div className="value">
                        <input readOnly style={{backgroundColor:'#f1f1f1'}} value={global.user.username} />
                    </div>
                </div>
                <div className="line1">
                    <div className="label">Nickname</div>
                    <div className="value">
                        <input value={this.state.nickname} name="nickname" onChange={this.handleChange.bind(this)} />
                    </div>
                </div>
                <div className="line1">
                    <div className="label">Info</div>
                    <div className="value">
                        <input value={this.state.info} name="info" onChange={this.handleChange.bind(this)} placeholder="Tell me about yourself" />
                    </div>
                </div>
                <div className="line1">
                    <div className="label">Profile Photo</div>
                    <div className="value">
                        <div className="avatareditor">
                            <AvatarEditor
                                ref={this.editor}
                                image={this.state.avatar}
                                width={100}
                                height={100}
                                border={50}
                                color={[255, 255, 255, 0.6]} // RGBA
                                scale={this.state.scale}
                                rotate={0}
                            />
                            <div className="right">
                                <div className="line2">
                                    <div className="label">Scale</div>
                                    <input type="range" onChange={this.handleScale} min="1" max="2" step="0.01" defaultValue="1" />
                                </div>
                                <div className="line2">
                                    <div className="label">Select image</div>
                                    <button onClick={this.select_image}>Select</button>
                                </div>
                                {/* <div className="line2">
                                    <div className="label">Save change</div>
                                    <button ref={this.btnsave} onClick={this.save_avatar}>Change</button>
                                </div> */}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="line1">
                    <div className="label">.</div>
                    <div className="value">
                        <button ref={this.btn_save} onClick={this.save}>Save user info</button>
                    </div>
                </div>
            </div>
        )
    }
}

export default class Set extends React.Component {
    constructor(props) {
        super(props);
        reactPage["Set"] = this;
    }
    componentDidMount() {
        this.column2_show_page(Baseinfo1)
    }
    componentWillUnmount() {
        reactPage["Set"] = undefined;
    }
    column1_click(v, i) {

    }
    column2_show_page(InputComponent, props = null) {
        let element = document.getElementById('Set_column2')
        ReactDom.unmountComponentAtNode(element)
        let recEle = React.createElement(InputComponent, props);
        ReactDom.render(recEle, element);
    }
    render() {
        return (
            <div className="Set">
                <div className="column1">
                    <Menu2 click={this.column1_click} />
                </div>
                <div className="column2" id="Set_column2"></div>
            </div>
        )
    }
}