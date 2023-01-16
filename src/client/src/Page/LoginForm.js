import React from "react"
import { createHashHistory } from "history"
const history = createHashHistory()
import $$ from "../comm"
import "./LoginForm.less"
import Title1 from "./Title1"


export default class LoginForm extends React.Component {
    constructor(props) {
        super(props);
        this.Login = this.Login.bind(this);
        this.Login1 = this.Login1.bind(this);
        this.Login2 = this.Login2.bind(this);
        this.btn_login = React.createRef()
    }
    state = {
        tips: null,
        username: '',
        passwd: '',
    }
    componentWillMount() {}
    componentDidMount() { }
    handleChange(event) {
        const name = event.target.name;
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        this.setState({ [name]: value });
    }
    SwitchMenu(name, e) {
        this.setState({ currForm: name });
    }
    handleEnterKey = (e) => {
        // const name = e.target.name
        if (e.code == 'Enter') {
            this.Login(e)
        }
    }
    LoginTimer = null;
    Login(e) {
        this.Login1(0)
        if (this.LoginTimer) {
            clearTimeout(this.LoginTimer);
            this.LoginTimer = null;
        }
        this.LoginTimer = setTimeout(this.Login2, 800);
    }
    Login1(state) {
        if (state == 0) {
            this.btn_login.current.style.backgroundColor = "#f1f1f1"
            this.btn_login.current.innerText = "logining..."
        } else {
            this.btn_login.current.style.backgroundColor = "#333"
            this.btn_login.current.innerText = "Login"
        }
    }
    Login2(e) {
        this.setState({ tips: '' });
        let verify = false;
        let rule1 = new RegExp(/^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/);
        if (rule1.test(this.state.username)) {
            verify = true;
        }
        if (!verify) {
            this.setState({ tips: 'Please enter the correct email address.' });
            this.Login1(1)
            return;
        } else {
            let rule3 = new RegExp(/^.{6,16}$/);
            if (rule3.test(this.state.passwd) == false) {
                this.setState({ tips: 'Please enter password.' });
                this.Login1(1)
                return;
            }
            //开始登录
            let param = {
                username: this.state.username,
                passwd: this.state.passwd
            };
            let url = ser.http + "/login";
            $$.ajax(url, param, (res) => {
                if (res.code == 200) {
                    global.token = res.token;
                    global.user = res.user;
                    osim.cache_set("token", res.token)
                    osim.cache_set("user", res.user)
                    history.push({ pathname: '/home' })
                } else {
                    this.setState({ tips: res.msg });
                }
            }, (err) => {
                console.log("Login error.", err);
            }, () => {
                this.Login1(1)
            });
        }
    }
    signup(e) {
        history.push({ pathname: '/signup', state: null })
    }
    render() {
        let style = {
            left: {
                width: "50%",
                padding: "15px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
            },
            left1: {
                borderRadius: "10px",
                backgroundColor: "rgb(8 58 119)",
                height: "60%",
                width: "60%",
            },
            left1txt: {
                padding: "30px",
                paddingTop: "60px",
                fontSize: "45px",
                color: "#fff",
                lineHeight: "60px",
            },
            right: {
                width: "50%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
            },
            title1: {
                fontSize: "32px",
                fontWeight: "bold",
            },
            info1: {
                textIndent: "2px",
                color: "#777",
                marginTop: "6px",
                marginBottom: "25px",
            },
            form1: {
                flexDirection: "column",
                width: "70%",
            },
            input1: {
                border: "0px",
                borderBottom: "1px solid #efefef",
                padding: "8px",
                width: "100%",
                marginTop: "10px",
                marginBottom: "10px",
                outline: "none",
            },
            row1: {
                marginTop: "15px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
            },
            tips: {
                color: "#f00",
                fontSize: "12px",
            },
        }
        return (
            <div className="_l">
                <div id="tabar1"><div id="tabar2"></div></div>
                <div className="login">
                    <Title1 />
                    <div style={style.left}>
                        <div style={style.left1}>
                            <div style={style.left1txt}>Make <br />communication <br />simple</div>
                        </div>
                    </div>
                    <div style={style.right}>
                        <div style={style.form1}>
                            <div style={style.title1}>Log in to OSIM</div>
                            <div style={style.info1}>Welcome to OSIM! Please enter your details.</div>
                            <div style={style.tips}>{this.state.tips}</div>
                            <div style={style.row1}>
                                <input style={style.input1} placeholder="Email" type="text" value={this.state.username} name="username" onChange={this.handleChange.bind(this)} />
                                <input style={style.input1} placeholder="Password" type="password" name="passwd" onChange={this.handleChange.bind(this)} onKeyUp={this.handleEnterKey} />
                                <button ref={this.btn_login} className="btn1" onClick={this.Login}>Login</button>
                            </div>
                            <div className="info2">
                                Don't have an account? <a onClick={this.signup}>Create an account for free</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}