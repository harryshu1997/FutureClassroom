"use strict";

export class Queue {
    constructor() {
      this.elements = {};
      this.head = 0;
      this.tail = 0;
    }
    enqueue(element) {
      this.elements[this.tail] = element;
      this.tail++;
    }
    dequeue() {
      const item = this.elements[this.head];
      delete this.elements[this.head];
      this.head++;
      return item;
    }
    peek() {
      return this.elements[this.head];
    }
    get length() {
      return this.tail - this.head;
    }
    get isEmpty() {
      return this.length === 0;
    }
  }
 

  /*
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
  */
 
 export class Move{
   constructor(FCDTObj){
     this.FCDTObj = FCDTObj;

     this.onStart = (command) => {
        
     };

     this.onFrame = () => {

     }

     this.onEnd = () => { 


     }
   }

   
 }




