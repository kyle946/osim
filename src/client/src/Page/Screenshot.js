import React from "react"
import "./Screenshot.less";

import img1 from "../assets/x2.png";
import img2 from "../assets/x1.png";
import img3 from "../assets/x3.png";


export default class Screenshot extends React.Component {

    constructor(props){
        super(props);
        this.mousedown = this.mousedown.bind(this);
        this.mousemove = this.mousemove.bind(this);
        this.mouseup = this.mouseup.bind(this);
        this.drawCoordinate1 = this.drawCoordinate1.bind(this);
        this.drawCoordinate2 = this.drawCoordinate2.bind(this);
        this.mArea = this.mArea.bind(this);
        this.btnConfirm = this.btnConfirm.bind(this);
        this.btnCancel = this.btnCancel.bind(this);
        this.btnDown = this.btnDown.bind(this);

        this._ctx = null;
        this._canvas = null;

        this.ctx = null;
        this.canvas = null;
        this.startPoint = {x: -1, y: -1};
        this.endPoint = {x: 0, y: 0};
        this.rect = null;
        this.left = {x:0, y:0};

        this.p1_x = null;
        this.p1_y = null;
        this.p2_x = null;
        this.p2_y = null;
        this.p3_x = null;
        this.p3_y = null;
        this.p4_x = null;
        this.p4_y = null;

        this.p5_x = null;
        this.p5_y = null;
        this.p6_x = null;
        this.p6_y = null;
        this.p7_x = null;
        this.p7_y = null;
        this.p8_x = null;
        this.p8_y = null;

        this.p_down = null;  //鼠标在哪个区域按下
        this.p_down_x = null;
        this.p_down_y = null;
    }

    load(){
        console.log("开始截图");
        this.canvas = document.getElementById("canvasEle");
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = screen.width;
        this.canvas.height = screen.height;

        this._canvas = document.getElementById("canvasEleBottom");
        this._ctx = this._canvas.getContext('2d');
        this._canvas.width = screen.width;
        this._canvas.height = screen.height;

        document.body.title = '屏幕截图 SmallIM聊天软件';
        this.canvas.addEventListener('mousedown', this.mousedown);
        this.canvas.addEventListener('mousemove', this.mousemove);
        this.canvas.addEventListener('mouseup', this.mouseup);
        
        osim.getimgScreenshot()
        .then(imgsrc=>{
            let ctx = this._ctx;
            var img = new Image();
            img.onload = function () {
                // 执行 drawImage 语句
                ctx.drawImage(img, 0, 0);
            }
            img.src = imgsrc;
        })
    }

    mousedown(e){
        if(this.rect!=null && this.p_down!=null){       //已经指定了区域，并且鼠标已经移动到可修改区域
            this.p_down_x = e.clientX-this.left.x;
            this.p_down_y = e.clientY-this.left.y;
            
            var ele = document.getElementById('screenshot_tools');
            ele.style.display='none';
            return ;
        }
        if(this.startPoint.x==-1){
            this.rect=null;
            this.startPoint.x = e.clientX ;
            this.startPoint.y = e.clientY ;
            this.ctx.fillStyle = "rgba(50,50,50, 0.5)";
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            return ;
        }
    }

    mousemove(e){
        if(this.rect!=null && this.p_down!=null && this.p_down_x!=null){
            this.ctx.fillStyle = "rgba(50,50,50, 0.5)";
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            let width, height;
            if(this.p_down==1){
                width = this.rect.width;
                height = (this.left.y+this.rect.height)-e.clientY
                this.ctx.clearRect(this.left.x, e.clientY, width, height);
                this.left.x = this.left.x;
                this.left.y = e.clientY;
            }
            else if(this.p_down==2){
                width = e.clientX - this.left.x;
                height = this.rect.height;
                this.ctx.clearRect(this.left.x, this.left.y, width, height);
            }
            else if(this.p_down==3){
                width = this.rect.width;
                height = e.clientY - this.left.y;
                this.ctx.clearRect(this.left.x, this.left.y, width, height);
            }
            else if(this.p_down==4){
                width = (this.left.x+this.rect.width)-e.clientX;
                height = this.rect.height;
                this.ctx.clearRect(e.clientX, this.left.y, width, height);
                this.left.x = e.clientX;
            }
            else if(this.p_down==5){
                width = (this.left.x+this.rect.width)-e.clientX;
                height = (this.left.y+this.rect.height)-e.clientY;
                this.ctx.clearRect(e.clientX, e.clientY, width, height);
                this.left.x = e.clientX;
                this.left.y = e.clientY;
            }
            else if(this.p_down==6){
                width = e.clientX - this.left.x;
                height = (this.left.y+this.rect.height)-e.clientY;
                this.ctx.clearRect(this.left.x, e.clientY, width, height);
                this.left.y = e.clientY;
            }
            else if(this.p_down==7){
                width = e.clientX - this.left.x;
                height = e.clientY - this.left.y;
                this.ctx.clearRect(this.left.x, this.left.y, width, height);
            }
            else if(this.p_down==8){
                width = (this.left.x+this.rect.width)-e.clientX;
                height = e.clientY - this.left.y;
                this.ctx.clearRect(e.clientX, this.left.y, width, height);
                this.left.x = e.clientX;
            }
            else if(this.p_down==10){       //移动截图区域
                width = this.rect.width;
                height = this.rect.height;
                let x = e.clientX-this.p_down_x;
                let y = e.clientY-this.p_down_y;
                this.ctx.clearRect(x, y, width, height);
                this.left.x = x;
                this.left.y = y;
            }
            this.rect = {width, height};
            this.drawCoordinate1();
            this.DrawBoundary();
            return ;
        }
        if(this.startPoint.x==-1){
            if(this.rect==null){        //还没有指定截图区域
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.drawCoordinate2(e.clientX, e.clientY, e.clientX, e.clientY);
                return ;
            }else{      //已经指定截图区域
                let p = this.mArea(e.clientX, e.clientY);
                this.p_down = p;
                var body = document.querySelector("body");
                if(p==1 || p==3){
                    body.style.cursor='n-resize';
                }else if(p==2 || p==4){
                    body.style.cursor='e-resize';
                }else if(p==5){
                    body.style.cursor='nw-resize';
                }else if(p==6){
                    body.style.cursor='sw-resize';
                }else if(p==7){
                    body.style.cursor='nw-resize';
                }else if(p==8){
                    body.style.cursor='sw-resize';
                }else if(p==10){
                    body.style.cursor='move';
                }else{
                    body.style.cursor='default';
                }
            }
            return ;
        }
        
        if(this.startPoint.x>=0){
            let width = e.clientX - this.startPoint.x;
            let height = e.clientY - this.startPoint.y;
            this.ctx.fillStyle = "rgba(50,50,50, 0.5)";
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.clearRect(this.startPoint.x, this.startPoint.y, width, height);
            return ;
        }
    }

    mouseup(e){
        if(this.rect!=null && this.p_down!=null && this.p_down_x!=null){
            this.p_down = null;
            this.p_down_x = null;
            this.p_down_y = null;
        }
        if(this.startPoint.x>=0){
            let width = e.clientX - this.startPoint.x;
            let height = e.clientY - this.startPoint.y;
            //判断左上角的坐标
            if(width<0){
                this.left.x = e.clientX;
                width = Math.abs(width);
            }else{
                this.left.x = this.startPoint.x;
            }
            if(height<0){
                this.left.y = e.clientY;
                height = Math.abs(height);
            }else{
                this.left.y = this.startPoint.y;
            }
            this.rect = {width, height};
            this.drawCoordinate1();
            this.DrawBoundary();
            this.startPoint.x=-1;
            this.startPoint.y=-1;
        }

        var ele = document.getElementById('screenshot_tools');
        var left2 = (this.left.x+this.rect.width) - 124;
        var top2 = this.left.y+this.rect.height + 10;
        ele.style.display='flex';
        ele.style.left = left2+'px';
        ele.style.top = top2+'px';
    }

    /**
     * 绘制坐标文本
     */
    drawCoordinate1(){
        this.ctx.font = "16px 黑体";
        this.ctx.fillStyle = "rgb(255,255,255)";
        let text = `${this.rect.width}, ${this.rect.height}`;
        this.ctx.fillText(text, this.left.x, this.left.y-10);
    }

    drawCoordinate2(x, y, w, h){
        this.ctx.fillStyle = "rgba(50,50,50,.5)";
        this.ctx.fillRect(x+10, y, 70, 25);
        this.ctx.font = "14px 黑体";
        this.ctx.fillStyle = "rgb(255,255,255)";
        let text = `${w}, ${h}`;
        this.ctx.fillText(text, x+15, y+20);
    }

    /**
     * 绘制边界
     */
    DrawBoundary(){
        //线中间的点： 上右下左
        this.p1_x = parseInt(this.left.x+(this.rect.width/2));
        this.p1_y = this.left.y;
        this.p2_x = this.left.x + this.rect.width;
        this.p2_y = parseInt(this.left.y + (this.rect.height/2));
        this.p3_x = this.p1_x;
        this.p3_y = this.left.y + this.rect.height;
        this.p4_x = this.left.x;
        this.p4_y = this.p2_y;

        //角的点： 上右下左
        this.p5_x = this.left.x;
        this.p5_y = this.left.y;
        this.p6_x = this.p2_x;
        this.p6_y = this.left.y;
        this.p7_x = this.p2_x;
        this.p7_y = this.p3_y;
        this.p8_x = this.left.x;
        this.p8_y = this.p3_y;
        
        this.ctx.fillStyle = "#00c1de";
        this.ctx.fillRect(this.p1_x-5, this.p1_y-5, 10, 10);
        this.ctx.fillRect(this.p2_x-5, this.p2_y-5, 10, 10);
        this.ctx.fillRect(this.p3_x-5, this.p3_y-5, 10, 10);
        this.ctx.fillRect(this.p4_x-5, this.p4_y-5, 10, 10);
        
        this.ctx.fillRect(this.p5_x-5, this.p5_y-5, 10, 10);
        this.ctx.fillRect(this.p6_x-5, this.p6_y-5, 10, 10);
        this.ctx.fillRect(this.p7_x-5, this.p7_y-5, 10, 10);
        this.ctx.fillRect(this.p8_x-5, this.p8_y-5, 10, 10);
        
        this.ctx.strokeStyle = "#00c1de";
        this.ctx.strokeRect(this.left.x, this.left.y, this.rect.width, this.rect.height);
    }

    /**
     * 判断点在哪个区域
     * @param {*} x 
     * @param {*} y 
     */
    mArea(x, y){
        let a = 20;
        if( (x>(this.p1_x-a) && x<(this.p1_x+a)) && (y>(this.p1_y-a) && y<(this.p1_y+a))) return 1;
        if( (x>(this.p2_x-a) && x<(this.p2_x+a)) && (y>(this.p2_y-a) && y<(this.p2_y+a))) return 2;
        if( (x>(this.p3_x-a) && x<(this.p3_x+a)) && (y>(this.p3_y-a) && y<(this.p3_y+a))) return 3;
        if( (x>(this.p4_x-a) && x<(this.p4_x+a)) && (y>(this.p4_y-a) && y<(this.p4_y+a))) return 4;
        
        if( (x>(this.p5_x-a) && x<(this.p5_x+a)) && (y>(this.p5_y-a) && y<(this.p5_y+a))) return 5;
        if( (x>(this.p6_x-a) && x<(this.p6_x+a)) && (y>(this.p6_y-a) && y<(this.p6_y+a))) return 6;
        if( (x>(this.p7_x-a) && x<(this.p7_x+a)) && (y>(this.p7_y-a) && y<(this.p7_y+a))) return 7;
        if( (x>(this.p8_x-a) && x<(this.p8_x+a)) && (y>(this.p8_y-a) && y<(this.p8_y+a))) return 8;

        if( (x>this.left.x && x<(this.left.x+this.rect.width)) && (y>this.left.y && y<(this.left.y+this.rect.height))) return 10;
        return null;
    }

    btnConfirm(e){
        //清空区域，隐藏按钮
        var ele = document.getElementById('screenshot_tools');
        ele.style.display='none';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        //复制图片
        var imgdata = this._ctx.getImageData(this.left.x, this.left.y, this.rect.width, this.rect.height);
        var cvs = document.createElement('canvas');
        cvs.width = this.rect.width;
        cvs.height = this.rect.height;
        var ctx = cvs.getContext('2d');
        ctx.putImageData(imgdata, 0, 0);
        cvs.toBlob((buf)=>{
            var clipboardData =  new ClipboardItem({'image/png': buf});
            navigator.clipboard.write([clipboardData]).then(()=>{
                osim.closeScreenshot();
            });
        }, 'image/png');
    }
    
    btnCancel(e){
        osim.closeScreenshot();
    }

    btnDown(e){}

    componentDidMount(){
        this.load();
    }

    render(){
        return (
            <>
            <div className="canvasEleDiv">
                <canvas id="canvasEle" width="100%" height="100%"></canvas>
                <canvas id="canvasEleBottom" width="100%" height="100%"></canvas>
                <div className="tools" id="screenshot_tools">
                    <a title="下载" onClick={this.btnDown.bind(this)}><img src={img3} /></a>
                    <a title="取消" onClick={this.btnCancel.bind(this)}><img src={img2} /></a>
                    <a title="确认" onClick={this.btnConfirm.bind(this)}><img src={img1} /></a>
                </div>
            </div>
            </>
        )
    }

}

