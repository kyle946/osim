import React from "react"
import { createHashHistory } from "history"
const history = createHashHistory()
import $$ from "../comm"
import "./SignupForm.less"
import Title1 from "./Title1"


export default class SignupForm extends React.Component {
    constructor(props) {
        super(props);
        this.signup = this.signup.bind(this);
        this.signup1 = this.signup1.bind(this);
        this.signup2 = this.signup2.bind(this);
        this.sendmail = this.sendmail.bind(this);
        this.sendmail1=this.sendmail1.bind(this)
        
        this.btn_signup=React.createRef()
        this.btn_sendmail=React.createRef()
    }
    state = {
        tips: null,
        nickname: '',
        username: '',
        passwd: '',
        passwd2: '',
        verifycode:'',
    }
    componentWillMount() {}
    componentDidMount() {}
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
            this.signup(e)
            e.target.blur()
        }
    }
    sendmailTimer=null
    sendmailTimerSec1=180
    sendmailTimerSec2=0
    sendmail(e){
        if(this.sendmailTimer){
            return 
        }
        let rule2 = new RegExp(/^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/);
        if (rule2.test(this.state.username)==false) {
            $$.confirm("Please enter the correct email address.", ()=>{}, true, false)
            this.signup1(1)
            return
        }
        $$.ajax(ser.http+"/sendmail",{email: this.state.username},res=>{
            if(res.code==200){
                $$.alert("Send successfully.")
                this.btn_sendmail.current.disable = true
                this.sendmailTimerSec2=this.sendmailTimerSec1
                this.btn_sendmail.current.innerText = `${this.sendmailTimerSec2} S`
                this.sendmailTimer=setInterval(() => {
                    this.btn_sendmail.current.innerText = `${this.sendmailTimerSec2} S`
                    if(this.sendmailTimerSec2<=0){
                        this.sendmail1()
                        return 
                    }
                    this.sendmailTimerSec2--
                }, 1000)
            }else{
                $$.confirm(res.msg, ()=>{}, true, false)
            }
        },err=>{
            $$.confirm("Failed to send verification code.", ()=>{}, true, false)
        },()=>{
        })
    }
    sendmail1(){
        clearInterval(this.sendmailTimer)
        this.sendmailTimer=null
        this.btn_sendmail.current.innerText = `Send mail`
        this.btn_sendmail.current.disable = false
    }
    signupTimer = null;
    signup(e) {
        this.signup1(0)
        if (this.signupTimer) {
            clearTimeout(this.signupTimer);
            this.signupTimer = null;
        }
        this.signupTimer = setTimeout(this.signup2, 200);
    }
    signup1(state) {
        if (state == 0) {
            this.btn_signup.current.style.backgroundColor = "#f1f1f1"
            this.btn_signup.current.innerText = "logining..."
        } else {
            this.btn_signup.current.style.backgroundColor = "#0e82ed"
            this.btn_signup.current.innerText = "Create account"
        }
    }
    signup2(event) {
        let r1 = $$.checkName(this.state.nickname, 4, 20);
        if (r1 != 1) {
            $$.confirm("Nicknames are 4 to 20 characters long.", ()=>{}, true, false)
            this.signup1(1)
            return
        }
        let rule2 = new RegExp(/^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/);
        if (rule2.test(this.state.username)==false) {
            $$.confirm("Please enter the correct email address.", ()=>{}, true, false)
            this.signup1(1)
            return
        }
        let rule3 = new RegExp(/^.{6,16}$/);
        if (rule3.test(this.state.passwd) == false) {
            $$.confirm("Please enter a new password.", ()=>{}, true, false)
            this.signup1(1)
            return
        }
        if(this.state.passwd!=this.state.passwd2){
            $$.confirm("The password cannot be entered twice.", ()=>{}, true, false)
            this.signup1(1)
            return
        }
        let rule4 = new RegExp(/^[0-9|a-z|A-Z]{6,8}$/);
        if (rule4.test(this.state.verifycode) == false) {
            $$.confirm("Please enter the verification code.", ()=>{}, true, false)
            this.signup1(1)
            return
        }
        var param = {
            username: this.state.username,
            passwd: this.state.passwd,
            nickname: this.state.nickname,
            verifycode: this.state.verifycode
        }
        $$.ajax(ser.http+"/signup",param,res=>{
            if(res.code==200){
                $$.confirm("Account created successfully.", ()=>{
                    history.push({ pathname: '/login' })
                }, true, false)
            }else{
                $$.alert(res.msg)
            }
        },err=>{
            $$.alert("request failure")
        },()=>{
            this.signup1(1)
        })
    }
    loginup(e) {
        history.push({ pathname: '/login', state: null })
    }
    render() {
        return <div className="sigup">
            <div id="tabar1"><div id="tabar2"></div></div>
            <Title1 />
            <div className="left">
                <div className="left1"></div>
            </div>
            <div className="right">
                <div>
                    <div className="title1">Create an account</div>
                    <div className="info1">Welcome to OSIM! Please enter your details.</div>
                    <div className="tips">{this.state.tips}</div>
                    <div className="row1">
                        <input className="input1" placeholder="Nickname" type="text" name="nickname" onChange={this.handleChange.bind(this)} onKeyUp={this.handleEnterKey} />
                        <input className="input1" placeholder="Email" type="text" name="username" onChange={this.handleChange.bind(this)} onKeyUp={this.handleEnterKey} />
                        <button className="btn2" ref={this.btn_sendmail} onClick={this.sendmail}>Send mail</button>
                        <input className="input1" placeholder="Password" type="password" name="passwd" onChange={this.handleChange.bind(this)} onKeyUp={this.handleEnterKey} />
                        <input className="input1" placeholder="Enter the password again" type="password" name="passwd2" onChange={this.handleChange.bind(this)} onKeyUp={this.handleEnterKey} />
                        <input className="input1" placeholder="Verification Code" type="text" name="verifycode" onChange={this.handleChange.bind(this)} onKeyUp={this.handleEnterKey} />
                        <button className="btn1" onClick={this.signup} ref={this.btn_signup}>Create account</button>
                    </div>
                    <div className="info2">
                        If you have an account, <a onClick={this.loginup}>click here to log in</a>
                    </div>
                </div>
            </div>
        </div>
    }
}