
import * as global from "../global.js";
import { Gltf2Node } from "../render/nodes/gltf2.js";
import { HandSize } from "../render/core/handSize.js";
import * as cg from "../render/core/cg.js";
import { controllerMatrix, buttonState, joyStickState} from "../render/core/controllerInput.js";
import { lcb, rcb } from '../handle_scenes.js';
import * as FCDT from "../scenes/FCDT.js";

let c1, c2 ,c3 ,c4 ,c5 ,c6 ,c7 ,c8, c9;

let backgroundMusic = new Audio("/media/sound/RISE.mp3");
let VictoryMusic = new Audio("/media/sound/FC.mp3");


let A2 = new Audio("/media/sound/pianoSounds/A2.m4a");
let B2 = new Audio("/media/sound/pianoSounds/B2.m4a");
let C2 = new Audio("/media/sound/pianoSounds/C2.m4a");
let D2 = new Audio("/media/sound/pianoSounds/D2.m4a");
let E2 = new Audio("/media/sound/pianoSounds/E2.m4a");
let F2 = new Audio("/media/sound/pianoSounds/F2.m4a");
let G2 = new Audio("/media/sound/pianoSounds/G2.m4a");



let G = 9.8; //gravity factor
let hitGravityBall = false;
let GChange = false;


let changePose = (handstate, curState) =>{
   if(curState != handstate[1]){
      handstate[0] = handstate[1];
      handstate[1] = curState;
   }
}

Array.prototype.insert = function ( index, item ) {
   this.splice( index, 0, item );
};


let test;

let dist = (A,B) =>{
   let x = A[0];
   let y = A[1];
   let z = A[2];
   let xx = B[0];
   let yy = B[1];
   let zz = B[2];
   return Math.sqrt(Math.pow(x-xx,2) + Math.pow(y-yy,2) + Math.pow(z-zz,2));
}


class FCObject{
   constructor(dt_id = "unknown", local, obj, name, position, color, scale){
      this.DT_ID = dt_id;
      this.local_ID = local;
      this.name = name;
      this.obj = obj;
      this.position = position;
      this.color = color;
      this.scale = scale;
   }
}



//FCDT OBJ QUEUE
let FCDTObjs = [];
let localId = 0;
let FCDTIndex = -1;
let CommandQueue = new FCDT.Queue();


class Command{
   constructor(action, source, quantum=0, direction=0){
      this.action = action;
      this.source = source;
      this.quantum = quantum;
      this.direction = direction;
   }
}
let active = null; //KEEP TRACK OF ACTIVE COMMAND
let FCDTID = 0; // SIMULATING ASSIGN ID




let startPos = [0,0,0];
let endPos = [0,0,0];
let scalePos1 = [0,0,0];
let scalePos2 = [0,0,0];
let scaleDiff = 0;
let diff = 0;
let scaleFactor = 0;
let stableDist = 0;
let shot = false;
let shotTime = 0;


let TargetList = []; 
let isShot = [];
let TargetTime = 0;
let allShot = false;


let collide = (A, Aindex, List, pList) =>{
   for(let i=0; i<List.length; i++){
      if(i == Aindex){ // self no checking
         continue;
      }
      if(cg.mGrab(A.getMatrix(), List[i].getMatrix(), pList[Aindex] + pList[i])){
         return true;
      }
   }
   return false;

}

let isG = false;




export const init = async model => {

    
      
    let hands = window.clay.handsWidget;
    model.setTable(false);
    
    
     //used for duplicate arrows 
    let objs = model.add();
    let objsProperties = []; // for now it only keep track of radius
    let originPose = [];
    let originColor = [];


    //using hand inputs
    let lHandState = [null, null];
    let rHandState = [null, null];


    let text = `The mode of left : right:  ` .split('\n');
    let label = model.add();
    for (let line = 0 ; line < text.length ; line++){
      label.add('label').move(0,2-line,0).scale(.05);
    }


    //all kinds of gestures
   let first = false;
   let clap = false;
   let leftPoint = false;
   let rightPoint = false;
   let leftFist = false;
   let rightFist = false;


   let leftPose = "";
   let rightPose = "";

   let createMode = false;
   let creating = false;
    
   let ballIndex = -1, ball = [], radius = .02;

   let chosen = false;
   let chosenIndex = -1;

   let currentShape = "sphere";
   let changeMode = "create";



   //creating targets
   let Targets = model.add();
   let t1 = Targets.add("sphere").move(3,1.8,-5).scale(0.2).color(2,3,1);
   let t1Shot = false;
   let t2 = Targets.add("sphere").move(2,1.8,-5).scale(0.3).color(2,2,1);
   let t2Shot = false;
   let t3 = Targets.add("sphere").move(0,1.8,-5).scale(0.15).color(4,3,1);
   let t3Shot = false;
   let t4 = Targets.add("sphere").move(-2,1.8,-5).scale(0.1).color(3,3,0);
   let t4Shot = false;
   let t5 = Targets.add("sphere").move(-3,1.8,-5).scale(0.2).color(2,3,4);
   let t5Shot = false;

   isShot.push(t1Shot);
   isShot.push(t2Shot);
   isShot.push(t3Shot);
   isShot.push(t4Shot);
   isShot.push(t5Shot);
   TargetList.push(t1);
   TargetList.push(t2);
   TargetList.push(t3);
   TargetList.push(t4);
   TargetList.push(t5);

    //color plates
    let colorPlates = model.add();
    let showColors = false;
    let chosenColor = [1,1,1];

   c1 = colorPlates.add("sphere").color(1,0,0).scale(0.1);
   c2 = colorPlates.add("sphere").color(0,1,0).scale(0.1);
   c3 = colorPlates.add("sphere").color(0,0,1).scale(0.1);
   c4 = colorPlates.add("sphere").color(1,1,0).scale(0.1);
   c5 = colorPlates.add("sphere").color(1,0,1).scale(0.1);
   c6 = colorPlates.add("sphere").color(0,1,1).scale(0.1);
   c7 = colorPlates.add("sphere").color(1,1,1).scale(0.1);
   c8 = colorPlates.add("sphere").color(1,2,3).scale(0.1);
   c9 = colorPlates.add("sphere").color(3,2,1).scale(0.1);


    //ADD MUSIC
    let musicCube = model.add("cube").color(1.3,1.8,4).move(1.5,1,-0.8).scale(0.1);
    let musicEnter = false;
    let musicOut = false;
    let playing = false;


    let musicA2 = model.add("cube").color(0,0,0).move(-1.6,1,-1).scale(0.1);
    let musicB2 = model.add("cube").color(1,0,0).move(-1.2,1,-1).scale(0.1);
    let musicC2 = model.add("cube").color(0,1,0).move(-0.8,1,-1).scale(0.1);
    let musicD2 = model.add("cube").color(0,0,1).move(-0.4,1,-1).scale(0.1);
    let musicE2 = model.add("cube").color(1,1,0).move(0,1,-1).scale(0.1);
    let musicF2 = model.add("cube").color(1,0,1).move(0.4,1,-1).scale(0.1);
    let musicG2 = model.add("cube").color(0,1,1).move(0.8,1,-1).scale(0.1);




    //TESTING GRAVITY 
    let gravityBall = model.add("tubeZ").color(2,3,1).move(0,1.5,-1).scale(0.2);


   //  let cc = model.add("sphere");
   //  FCDTObjs.push(new FCObject("unknown", localId ,cc, "harry", [0,0,0], [1,1,1], 0.01));
   //  console.log(FCDTObjs[0].obj.getMatrix());



    model.animate(() => {
      // FCDTObjs[0].obj.move(0,1,0).scale(0.5);
      // console.log(FCDTObjs[0].name);


      




         let leftP = hands.getMatrix('left', 0, 0);
         let left0top = hands.getMatrix('left',0, 4);
         let left1top = hands.getMatrix('left', 1, 4);
         let left2top = hands.getMatrix('left', 2, 4);
         let left3top = hands.getMatrix('left', 3, 4);
         let left4top = hands.getMatrix('left', 4, 4);

         let rightP = hands.getMatrix('right', 0, 0);
         let right0top = hands.getMatrix('right', 0, 4);
         let right1top = hands.getMatrix('right', 1, 4);
         let right2top = hands.getMatrix('right', 2, 4);
         let right3top = hands.getMatrix('right', 3, 4);
         let right4top = hands.getMatrix('right', 4, 4);

      //show colors
      if(showColors){
         c1.setMatrix(leftP).scale(0.03).move(-4,0,0);
         c2.setMatrix(leftP).scale(0.03).move(-3.68,1.56,0);
         c3.setMatrix(leftP).scale(0.03).move(-2.82,2.9,0);
         c4.setMatrix(leftP).scale(0.03).move(-1.66,3.63,0);
         c5.setMatrix(leftP).scale(0.03).move(0,4,0);
         c6.setMatrix(leftP).scale(0.03).move(1.46,3.72,0);
         c7.setMatrix(leftP).scale(0.03).move(2.8,2.876,0);
         c8.setMatrix(leftP).scale(0.03).move(3.65,1.636,0);
         c9.setMatrix(leftP).scale(0.03).move(4,0,0);

         if(cg.mGrab(c1.getMatrix(), right1top, 0.01)){
            chosenColor = [1,0,0];
         }else if(cg.mGrab(c2.getMatrix(), right1top, 0.01)){
            chosenColor = [0,1,0];
         }else if(cg.mGrab(c3.getMatrix(), right1top, 0.01)){
            chosenColor = [0,0,1];
         }else if(cg.mGrab(c4.getMatrix(), right1top, 0.01)){
            chosenColor = [1,1,0];
         }else if(cg.mGrab(c5.getMatrix(), right1top, 0.01)){
            chosenColor = [1,0,1];
         }else if(cg.mGrab(c6.getMatrix(), right1top, 0.01)){
            chosenColor = [0,1,1];
         }else if(cg.mGrab(c7.getMatrix(), right1top, 0.01)){
            chosenColor = [1,1,1];
         }else if(cg.mGrab(c8.getMatrix(), right1top, 0.01)){
            chosenColor = [1,2,3];
         }else if(cg.mGrab(c9.getMatrix(), right1top, 0.01)){
            chosenColor = [3,2,1];
         }


         //colorPlates.hud().scale(1);
         //c1.flag('uTransparentTexture', 0);

      }else{
         c1.identity().scale(0.001);
         c2.identity().scale(0.001);
         c3.identity().scale(0.001);
         c4.identity().scale(0.001);
         c5.identity().scale(0.001);
         c6.identity().scale(0.001);
         c7.identity().scale(0.001);
         c8.identity().scale(0.001);
         c9.identity().scale(0.001);
      }

      if(cg.mGrab(musicA2.getMatrix(), right1top, 0.2) || cg.mGrab(musicA2.getMatrix(), left1top, 0.2)){
         A2.play();
      }else{
         A2.pause();
         A2.currentTime = 0;
      }
      if(cg.mGrab(musicB2.getMatrix(), right1top, 0.2) || cg.mGrab(musicB2.getMatrix(), left1top, 0.2)){
         B2.play();
      }else{
         B2.currentTime = 0;
         B2.pause();
      }
      if(cg.mGrab(musicC2.getMatrix(), right1top, 0.2) || cg.mGrab(musicC2.getMatrix(), left1top, 0.2)){
         C2.play();
      }else{
         C2.currentTime = 0;
         C2.pause();
      }
      if(cg.mGrab(musicD2.getMatrix(), right1top, 0.2) || cg.mGrab(musicD2.getMatrix(), left1top, 0.2)){
         D2.play();
      }else{
         D2.currentTime = 0;
         D2.pause();
      }
      if(cg.mGrab(musicE2.getMatrix(), right1top, 0.2) || cg.mGrab(musicE2.getMatrix(), left1top, 0.2)){
         E2.play();
      }else{
         E2.currentTime = 0;
         E2.pause();
      }
      if(cg.mGrab(musicF2.getMatrix(), right1top, 0.2) || cg.mGrab(musicF2.getMatrix(), left1top, 0.2)){
         F2.play();
      }else{
         F2.currentTime = 0;
         F2.pause();
      }
      if(cg.mGrab(musicG2.getMatrix(), right1top, 0.2) || cg.mGrab(musicG2.getMatrix(), left1top, 0.2)){
         G2.play();
      }else{
         G2.currentTime = 0;
         G2.pause();
      }




      //ADD BACKGROUND MUSIC
      if(cg.mGrab(musicCube.getMatrix(), right1top, 0.2)){
         musicOut = musicEnter;
         musicEnter = true;
      }else{
         musicOut = musicEnter;
         musicEnter = false;

      }
      if(musicEnter == false && musicOut == true){
         playing = playing == true? false : true;
      }
      if(playing){
         backgroundMusic.play();
         musicCube.color(3,0,0);
      }else{
         backgroundMusic.pause();
         musicCube.color(1.3,1.8,4);
      }

      



         //gestures
         if(first && cg.mGrab(leftP, rightP, 0.1)){
            clap = true;
            leftPose = "clap";
            rightPose = "clap";
            changePose(lHandState, "clap");
            changePose(rHandState, "clap");

         }else{
            leftPose = "L";
            rightPose = "R";
            changePose(lHandState, "L");
            changePose(rHandState, "R");
            clap = false;
            if(first && cg.mDistance(leftP, left1top) > cg.mDistance(leftP, left2top) + 0.04){
               leftPose = cg.mDistance(left0top, left4top) > .115? "L" : "point";
               if(cg.mDistance(left0top, left4top) > .115){
                  leftPoint = false;
               } 
               else{
                  leftPoint = true;
                  changePose(lHandState, "point");
                  changeMode = "create";
               } 
            }else{
               leftPoint = false;
               if(first && cg.mDistance(leftP, left1top) > cg.mDistance(leftP, left3top) + 0.08 && cg.mGrab(left1top, left2top, 0.03)){
                  if(cg.mDistance(left0top, left4top) <= .115){
                     changeMode = "scale";
                     changePose(lHandState, "scale");
                     leftPose = "twoFinger/scale";
                  }
               }
               if(first && cg.mDistance(leftP, left1top) > cg.mDistance(leftP, left4top) + 0.08 && cg.mGrab(left1top, left2top, 0.03) && cg.mGrab(left1top, left3top, 0.05)){
                  if(cg.mDistance(left0top, left4top) <= .115){
                     changeMode = "undecided";
                     changePose(lHandState, "undecided");
                     leftPose = "threeFinger/undecided";
                  }
               }
            }
            if(first && cg.mDistance(rightP, right1top) > cg.mDistance(rightP, right2top) + 0.08){
               rightPose = cg.mDistance(right0top, right4top) > .115? "R" : "point";
               if(cg.mDistance(right0top, right4top) > .115){
                  rightPoint = false;
               } 
               else{
                  rightPoint = true;
                  currentShape = "sphere";
                  changePose(rHandState, "point/sphere");
               } 
            }else{
               rightPoint = false;
               if(first && cg.mDistance(rightP, right1top) > cg.mDistance(rightP, right3top) + 0.08 && cg.mGrab(right1top, right2top, 0.03)){
                  if(cg.mDistance(right0top, right4top) <= .115){
                     currentShape = "cube";
                     changePose(rHandState, "cube");
                     rightPose = "twoFinger/cube";
                  }
               }
               if(first && cg.mDistance(rightP, right1top) > cg.mDistance(rightP, right4top) + 0.08 && cg.mGrab(right1top, right2top, 0.03) && cg.mGrab(right1top, right3top, 0.05)){
                  if(cg.mDistance(right0top, right4top) <= .115){
                     currentShape = "donut";
                     changePose(rHandState, "donut");
                     rightPose = "threeFinger/donut"
                  }
               }
               if(first && cg.mGrab(rightP, right1top, 0.13) && cg.mGrab(rightP, right2top, 0.13) && cg.mGrab(rightP, right4top, 0.13) && !cg.mGrab(right4top,right0top, 0.08)){
                  currentShape = "rightThumb";
                  changePose(rHandState, "rightThumb");
                  rightPose = "rightThumb";
               }
            }
            if(first && cg.mGrab(leftP, left0top, 0.13) && cg.mGrab(leftP, left4top, 0.13) && cg.mGrab(leftP,left1top, 0.13) && cg.mGrab(leftP, left2top, 0.13)){
               leftPose = "Fist";
               leftFist = true;
               changePose(lHandState, "Fist");
               changeMode = "LFist";
            }else{
               leftFist = false;
            }
            if(first && cg.mGrab(rightP, right0top, 0.13) && cg.mGrab(rightP, right4top, 0.13) && cg.mGrab(rightP, right1top, 0.13) && cg.mGrab(rightP, right2top, 0.13)){
               rightPose = "Fist";
               rightFist = true;
               changePose(rHandState, "Fist");
            }else{
               rightFist = false;
            }

            //initialize clap for the first time since it always clap before
            if(!first){
               if(!cg.mGrab(leftP, rightP, 0.05)){
                  first = true;
               }
            }

         }

         // DEBUG TEXT
         for (let line = 0 ; line < text.length; line++){
            if(FCDTObjs.length > 0){
               label.child(line).info(text[line] + " \n  " + leftPose + " : " + rightPose + " create "+  createMode + !creating + "  fcdtss  " + FCDTObjs[0].obj.getMatrix()[12] + FCDTObjs[0].obj.getMatrix()[13]);

            }else{
               label.child(line).info(text[line] + " \n  " + leftPose + " : " + rightPose + " create "+  createMode + !creating + "  fcdtss  " + FCDTObjs.length + " " + FCDTIndex);
            }
        }


        //HANDLE COMMANDS 
        if(active != null){
            if(active.action == "create"){
               active.source.DT_ID = FCDTID;
               FCDTID++;
               //when done active ==> null
               active = null;
            }else if(active.action == "move"){

            }
        }else{
           if(!CommandQueue.isEmpty()){
              active = CommandQueue.dequeue();
           }
        }






        //create objects
        // clap for make an object
        // two fist means create down

        if(clap){
           createMode = true;
        }

        //choose colors
        if(rightPoint){
           showColors = true;
        }else{
           showColors = false;
        }

        if(leftFist && rightFist){
           createMode = false;
           creating = false;
        }

        if(createMode && !creating){
           creating = true;
            FCDTIndex = FCDTObjs.length;
            let createObj = model.add(currentShape).scale(0.01);
            let tmp = new FCObject("unknown", localId ,createObj, "harry", [0,0,0], [1,1,1], 0.01);
            FCDTObjs.push(tmp);
            CommandQueue.enqueue(new Command("create", tmp));
            localId++;
        }

        if (createMode && FCDTIndex >= 0) {
         let a = hands.getMatrix('left', 0, 0).slice(12, 15);
         let b = hands.getMatrix('right', 0, 0).slice(12, 15);
         let c = cg.mix(a, b, .5, .5);
         let d = cg.mix(a, b, -.5, .5);
         radius = .9 * radius + .1 * (cg.norm(d) - .005);
         //let createObj = FCDTObjs[FCDTIndex];
         FCDTObjs[FCDTIndex].obj.identity().move(c).scale(radius);
         FCDTObjs[FCDTIndex].position = c;
         FCDTObjs[FCDTIndex].scale = radius;
      }

      //choose the object to change
      if(!chosen && !createMode && (rightFist || rightPoint) ){ //probelm leftfist ?????
         for(let i=0; i<FCDTObjs.length; i++){
            let origianlRadius = FCDTObjs[i].scale;
            if(cg.mDistance(FCDTObjs[i].obj.getMatrix(), rightP) < origianlRadius || cg.mGrab(FCDTObjs[i].obj.getMatrix(), right0top, origianlRadius) || cg.mGrab(FCDTObjs[i].obj.getMatrix(), right2top, origianlRadius)){
               chosenIndex = i;
               chosen = true;
               break;
            }
         }
      }else{
         if(chosen){
            if(changeMode == "scale"){
               scalePos1[0] = rightP[12];
               scalePos1[1] = rightP[13];
               scalePos1[2] = rightP[14];
               scalePos2[0] = leftP[12];
               scalePos2[1] = leftP[13];
               scalePos2[2] = leftP[14];
               if(stableDist == 0){
                  stableDist = dist(scalePos1, scalePos2);
               }
               scaleDiff = dist(scalePos1, scalePos2);
               scaleFactor = scaleDiff - stableDist;
               if(FCDTObjs[chosenIndex].scale >= 0.02){
                  FCDTObjs[chosenIndex].scale += scaleFactor * 0.01;
               }else{
                  FCDTObjs[chosenIndex].scale += Math.abs(scaleFactor * 0.01);
               }
               
            }else{
               scaleDiff = 0;
               stableDist = 0;
               scaleFactor = 0;
            }

            
            let origianlRadius = FCDTObjs[chosenIndex].scale;
            FCDTObjs[chosenIndex].obj.setMatrix(rightP).scale(origianlRadius).move(0,0,-1.5).color(5*Math.sin(model.time),2,2);
            FCDTObjs[chosenIndex].color[0] = 5 * Math.sin(model.time);
            FCDTObjs[chosenIndex].position[0] = FCDTObjs[chosenIndex].obj.getMatrix()[12];
            FCDTObjs[chosenIndex].position[1] = FCDTObjs[chosenIndex].obj.getMatrix()[13];
            FCDTObjs[chosenIndex].position[2] = FCDTObjs[chosenIndex].obj.getMatrix()[14];
            
            // originColor[chosenIndex][0] = 5 * Math.sin(model.time);
            // originPose[chosenIndex][0] = ball[chosenIndex].getMatrix()[12];
            // originPose[chosenIndex][1] = ball[chosenIndex].getMatrix()[13];
            // originPose[chosenIndex][2] = ball[chosenIndex].getMatrix()[14];

         }
         //remove objects
         else if(leftFist && !rightFist){
            let removeIndex = -1;
            for(let i=0; i<FCDTObjs.length; i++){
               let removeRadius = FCDTObjs[i].scale <= 0.1? 0.1 : FCDTObjs[i].scale;
               if(cg.mGrab(FCDTObjs[i].obj.getMatrix(), leftP, removeRadius) || cg.mGrab(FCDTObjs[i].obj.getMatrix(), left1top, removeRadius) || cg.mGrab(FCDTObjs[i].obj.getMatrix(), left2top, removeRadius)){
                  removeIndex = i;
                  test3 = removeIndex;
                  break;
               }
            }
            if(removeIndex != -1){
               model.remove(FCDTObjs[removeIndex].obj);
               FCDTObjs.splice(removeIndex,1);
               removeIndex = -1;
            }
         }
      }




      /*
      create the achery effect, when the user release the arrow
      diff == initial velocity
      gravity factor == 9.8
      time = model.deltatime
      I used a ball as an reference for the arrow move along with the ball
      */
      // if(cg.mGrab(bow.matrix, leftP, 0.2) || cg.mGrab(bow.matrix, left1top, 0.2)){
      //    if(!leftFist){
      //       bow.matrix = leftP;
      //       arrow.matrix = leftP;
      //       if(rightFist){
      //          shotTime = 0;
      //          axisP.setMatrix(bow.matrix).scale(1);
      //          endPos[0] = rightP[12];
      //          endPos[1] = rightP[13];
      //          endPos[2] = rightP[14];
      //          diff = dist(startPos, endPos);
      //          axisP.move(0,0,diff*4);
      //          //arrow.matrix = axisP.getMatrix();
      //          arrow.matrix = axisP.getMatrix();
      //          shotarrow.matrix = axisP.getMatrix();
      //          axisP.scale(0.0001);
      //          // //axisP.identity().scale(0.03);
      //          //  axisP.aimZ([0,0,10000]);
      //          //  axisP.aimY([0,10000,0]);
      //          let GAX = axisP.getMatrix()[12];
      //          let GAY = axisP.getMatrix()[13];
      //          let GAZ = axisP.getMatrix()[14];
      //          axisP.aimZ([GAX, GAY-0.5, 1000]);
      //          shot = false;

      //       }else{
      //          shot = true;
      //          if(currentShape == "rightThumb"){
      //             axisP.setMatrix(bow.matrix).scale(0.0001);
      //             arrow.matrix = bow.matrix;
      //             shotarrow.matrix = axisP.getMatrix();
      //             startPos[0] = rightP[12];
      //             startPos[1] = rightP[13];
      //             startPos[2] = rightP[14];
      //             diff = 0;
      //             shotTime = 0;
      //             shot = false;
      //          }else{//let the arrow fly
      //             if(shot){
      //                shotTime += 0.4;
      //                shot = true;
      //                axisP.scale(10000);
      //                axisP.move(0, 0, -0.08 * shotTime);
      //                shotarrow.matrix = axisP.getMatrix();
      //                axisP.scale(0.0001);
      //             }
      //          }
      //       }
      //    }
      // }else{
      // }

      //GRAVITY BALL TESTING
      gravityBall.identity().move(Math.sin(model.time)*2, Math.sin(model.time)+1, 1).scale(0.1);
      let gravityX = gravityBall.getMatrix()[12];
      let gravityY = gravityBall.getMatrix()[13];
      let gravityZ = gravityBall.getMatrix()[14];
      gravityBall.aimZ([gravityX,1,gravityZ]);
      
 
      //GRAVITY FOR ALL CREATED OBJECT
      // for(let i=0; i<ball.length; i++){
      //    let A = ball[i];
      //    let isCollide = false;
      //    if(ball.length >= 2){
      //       isCollide = collide(A, i, ball, objsProperties);
      //    }
      //    let isGround = A.getMatrix()[13] <= objsProperties[i] ? true : false;
      //    if(!isCollide && !isGround && !createMode && !chosen){
      //       isG = true;
      //       let Ax = originPose[i][0];
      //       let Ay = originPose[i][1];
      //       let Az = originPose[i][2];
      //       A.identity().move(Ax, Ay, Az).scale(objsProperties[i]).color(originColor[i]);
      //       originPose[i][1] -= 0.01;
      //    }else{
      //       isG = false;
      //    }
      // }




      TargetTime += 0.4;
      // FOR TARGETS 
      if(leftFist){
         t1.identity().move(3,1.5,-5).scale(0.2).color(2,3,1);
         t2.identity().move(2,1.5,-5).scale(0.3).color(2,2,1);
         t3.identity().move(0,1.5,-5).scale(0.15).color(4,3,1);
         t4.identity().move(-2,1.5,-5).scale(0.1).color(3,3,0);
         t5.identity().move(-3,1.5,-5).scale(0.2).color(2,3,4);
         VictoryMusic.pause();
         for(let i=0; i<isShot.length; i++){
            isShot[i] = false;
         }

      }else{
         for(let i=0; i<TargetList.length; i++){
            TargetList[i].move(Math.sin(model.time)/5,Math.sin(model.time)/4, Math.cos(model.time)/4);
         }
      }


      //not chosen release object 
      if(!rightFist){
         if(chosenIndex != -1){
            FCDTObjs[chosenIndex].obj.color(chosenColor);
            FCDTObjs[chosenIndex].color[0] = chosenColor[0];
            FCDTObjs[chosenIndex].color[1] = chosenColor[1];
            FCDTObjs[chosenIndex].color[2] = chosenColor[2];
         }
         chosen = false;
         chosenIndex = -1;
         test = -1;
      }



      



      /*
         FOR CONTROLLER INPUTS -------------------------------------------------------- 
      */
        //mBowPos[13] = mBowPos[13] - 1;
        
        //set bow and arrow matrix to hands
        //bow.matrix = mBowPos;
        //arrow.matrix = mArrow;

        //hands inputs
         




        // GET THE CURRENT MATRIX AND TRIGGER INFO FOR BOTH CONTROLLERS

      //   let matrixL  = controllerMatrix.left;
      //   let triggerL = buttonState.left[0].pressed;
      //   let leftSqueeze  = buttonState.left[1].pressed;
      //   let leftJoyTouch = buttonState.left[3].touched;
      //   let leftJoyPress = buttonState.left[3].pressed;
      //   let X            = buttonState.left[4].pressed;
      //   let Y            = buttonState.left[5].pressed;
      //   let leftJoyX     = joyStickState.left.x;
      //   let leftJoyY     = joyStickState.left.y;

      //   let matrixR  = controllerMatrix.right;
      //   let triggerR = buttonState.right[0].pressed;
      //   let rightSqueeze  = buttonState.right[1].pressed;
      //   let rightJoyTouch = buttonState.right[3].touched;
      //   let rightJoyPress = buttonState.right[3].pressed;
      //   let A             = buttonState.right[4].pressed;
      //   let B             = buttonState.right[5].pressed;
      //   let rightJoyX     = joyStickState.right.x;
      //   let rightJoyY     = joyStickState.right.y;


      // INTRO TEXT SHOW AND REMOVE
      
      
      // if(Y || X){
      //    model.remove(introLabel);
      //    introGone = true;
      // }
      // if(A){
      //    hasAimer = true;
      // }
      // if(B){
      //    hasAimer = false;
      // }

        
      
      

       // PLACE THE LASER BEAMS TO EMANATE FROM THE CONTROLLERS
         // IF NOT IN VR MODE, PLACE THE BEAMS IN DEFAULT POSITIONS

         //let LM = matrixL.length ? cg.mMultiply(matrixL, cg.mTranslate( .006,0,0)) : cg.mTranslate(cx-.2,cy,1);
         //let RM = matrixR.length ? cg.mMultiply(matrixR, cg.mTranslate(-.001,0,0)) : cg.mTranslate(cx+.2,cy,1);

         //model.child(0).setMatrix(LM);
         //model.child(1).setMatrix(RM);

         // let graBow = cg.mGrab(matrixL, bow.matrix, 0.5);
         // if(graBow && triggerL){
         //    lcb.color(10,10,10);
         //    bow.matrix = matrixL;
         // }
         // if(X){
         //     bow.matrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,1,0,1];
         // }


        

    });
 }


