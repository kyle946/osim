import React from "react";
import { Route, HashRouter as Router, Switch } from 'react-router-dom'
import { createHashHistory } from "history";
const history = createHashHistory();
const ipcRenderer = require('electron').ipcRenderer;


import "./Myrouter.less";
import Login from "../Page/LoginForm";
import SignupForm from "../Page/SignupForm";
import Home from "../Page/Home";
import Screenshot from "../Page/Screenshot";


export default class MyRouter extends React.Component {

    constructor(props) {
        super(props);
    }
    componentWillMount() { }
    componentDidMount() { }
    render() {
        return (
            <Router basename="/">
                <Switch>
                    <Route path="/" exact component={Login}></Route>
                    <Route path="/login" component={Login}></Route>
                    <Route path="/signup" component={SignupForm}></Route>
                    <Route path="/home" component={Home}></Route>
                    <Route path="/screenshot" component={Screenshot}></Route>
                </Switch>
            </Router>
        );
    }
}