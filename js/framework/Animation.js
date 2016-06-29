"use strict"; //ES6

/**
 * Animation class represents a RESOURCE which describes an animation state graph
 * 
 * AnimationInstance class represents an INSTANCE of the Animation class with state
 *  variables specific to that instance.
 * 
 * Sending an appropriate EVENT to an Animation instance will cause it to move from
 *  the current animation state to the next.
 * When an animation state completes, the "end" event is sent, which it can use to 
 *  automatically transition to a new state, or continue looping.
 */

class Animation {
	constructor() {
		this.events = ["end"];
		this.graph = {
			"idle":{ fps:5, transitions:{"end":"idle"} }
		};
		this.defaultAnim = "idle";
		this.sprites = {};
	}
	LoadFromJson( dataJson ) {
		this.events = dataJson.events;
		this.graph = dataJson.graph;
		this.defaultAnim = dataJson.defaultState;
	}
	
	//For each state $s try to AttachSprite( $s, baseName + $s + extName )
	QuickAttach( baseName, extName, fnOnComplete ) {
		var RP = Service.Get("rp");
		var self = this;
		var imgsDownloading = 0;
		for( var state in this.graph ) {
			imgsDownloading++;
			console.log("get sprite "+ state);
			
			(function(stateName){
				RP.getSprite( baseName + state + extName, function(e){
					//console.log("got sprite for state " + stateName);
					var sprite = e.res;
					if(sprite) {
						self.AttachSprite(stateName, sprite);
						imgsDownloading--;
						
						if(fnOnComplete && imgsDownloading == 0) {
							fnOnComplete();
						}
					}
				});
			}(state));

		}
	}
	AttachSprite( animState, sprite ) {
		//console.log("attach sprite for " + animState)
		this.sprites[animState] = sprite;
	}
	
	CreateInstance() {
		return new AnimationInstance(this);
	}
}

class AnimationInstance {
	constructor( animation ) {
		this.pAnimation = animation;
		this.startTime = 0;
		this.currAnim = "null";
		
		//frame index of sprite to draw, refreshed in update()
		this.drawFrame = 0;
		this.drawSprite = null;
		this.fps = 5;
		this.startAnim(0, this.pAnimation.defaultAnim);
	}
	
	event ( ct, evt ) {
		var state = this.pAnimation.graph[ this.currAnim ];
		var next = state.transitions[evt];
		if(next) {
			//console.log("anIn move from " + this.currAnim + " to " + next);
			this.startAnim(ct, next);
			return true;
		}else {
			if(evt != this.currAnim) console.warn("failed to handle event "+ evt)
		}
		return false;
	}
	startAnim( ct, animState, fps ) {
		animState = animState || this.pAnimation.defaultAnim;
		this.currAnim = animState;
		this.startTime = ct;
		
		this.drawFrame = 0;
		this.drawSprite = this.pAnimation.sprites[ this.currAnim ];
		
		var state = this.pAnimation.graph[ this.currAnim ];
		this.fps = state.fps || this.drawSprite.getFPS();

		if(!this.drawSprite) {
			console.warn("no sprite for startAnim("+animState+")");
		}
	}
	
	Update( ct ) {
		//var state = this.graph[ this.currAnim ];
		var sprite = this.drawSprite;
		var numFrames =  sprite.getNumFrames();
		var animLengthS = numFrames / this.fps;
		var dt = ct - this.startTime;
		
		if(dt > animLengthS) {
			//handle end of animation
			//var endTime = this.startTime + animLengthS;
			//console.log("anim " + this.currAnim + " ended")
			this.event(ct, "end");
			return;
		}
		else {
			this.drawFrame = Math.floor((dt / animLengthS) * numFrames);
		}
	}
	
	Draw(gfx, x, y, hFlip) {
		this.drawSprite.drawFrame(gfx, x,y, this.drawFrame, hFlip);
	}
	
	getCurrentSprite() {
		return this.drawSprite;
	}
	
}