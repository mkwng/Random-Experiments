<!-- //////////////////////////////////////////////// -->
<!-- //////////////// ANIMATED SPRITE /////////////// -->
<!-- //////////////////////////////////////////////// -->

// ------------ JODO ------------
// Module : Animated Sprite
// Version : 2.0
// Modified : 2011-04-13
// ------------------------------

/*
Content-Type: multipart/related; boundary="_"

--_
Content-Location:blank.gif
Content-Type:image/gif
Content-Transfer-Encoding:base64

R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==
--_--
*/

function AnimatedSprite($target, sprite, opts) {
	var th=this, prevID, tempID;
	
	if(!$target.is("img") || !sprite) return false;
	
	$target.bind({
		"load.animatedSprite" : function() {
			// Unbind this loader so it doesn't trigger again farther down when the src is set to our 1x1 gif
			$(this).unbind("load.animatedSprite");
			
			$.extend(
				th,
				{
					"fps" : 30, // Frames per second. Note that this will end up being approximate, thanks to weird JS timer issues
					"playing" : true, // Should the animation begin playing as soon as the sprite is loaded?
					"loop" : true, // Can pass in a boolean or an integer. The first play doesn't count as a loop, so if you pass in 2, the animation will play 3 times
					"startingFrame" : 0, // Which frame to start on
					"forward" : true, // True if playing forward, false if playing backward
					"frameWidth" : $target.width(), // If the width is anything other than the placeholder width, declare it here
					"frameHeight" : $target.height(), // If the height is anything other than the placeholder height, declare it here
					"numFrames" : false, // If false, numFrames will be auto-computed
					"orientation" : "h" // How the frames are stacked in the sprite. "h" for horizontal, "v" for vertical, "b" for both
				},
				opts,
				{
					$el : $target,
					// $loader : null,
					spriteLoaded : false,
					frame : {h:0,v:0},
					origSrc : $target.attr("src"), // Save this to set everything back if AnimatedSprite.destruct() is called
					sprite : sprite,
					timer : {h:null,v:null}
				}
			);
			
			function propToHVObj(prop) {
				var o;
				if($.isPlainObject(prop)) {
					o = {
						h : prop.h === undefined ? 0 : typeof prop.h == "number" ? parseInt(prop.h) : !!prop.h,
						v : prop.v === undefined ? 0 : typeof prop.v == "number" ? parseInt(prop.v) : !!prop.v
					};
				} else {
					switch(th.orientation) {
						case "b": o = {h:(typeof prop=="number")?parseInt(prop):!!prop, v:(typeof prop=="number")?parseInt(prop):!!prop}; break;
						case "h": o = {h:(typeof prop=="number")?parseInt(prop):!!prop, v:(typeof prop=="number")?0:false}; break;
						case "v": o = {h:(typeof prop=="number")?0:false, v:(typeof prop=="number")?parseInt(prop):!!prop}; break;
					}
				}
				return o;
			}
			
			th.orientation = (th.orientation==="b" || th.orientation==="h" || th.orientation==="v") ? th.orientation : "h";
			
			th.fps = propToHVObj(th.fps);
			th.fps.h = parseInt(th.fps.h) > 0 ? parseInt(th.fps.h) : 30; 
			th.fps.v = parseInt(th.fps.v) > 0 ? parseInt(th.fps.v) : 30;
			
			th.playing = propToHVObj(th.playing);
			th.loop = propToHVObj(th.loop);
			th.startingFrame = propToHVObj(th.startingFrame);
			th.forward = propToHVObj(th.forward);
			th.numFrames = propToHVObj(th.numFrames);
			th.speed = {h:(1000/th.fps.h), v:(1000/th.fps.v)};
			
			// Set up a dummy img to load the sprite asset in the background.
			th.$loader = $("<img/>", {
				src : sprite,
				load : function() {
					var wd, ht, maxFrames;
					
					th.$el.trigger("spriteLoad.animatedSprite");
					th.spriteLoaded = true;
					
					// Gotta put it in the DOM real quick so we can check the width and height of the sprite image
					$(this).appendTo("body");
					wd = $(this).width();
					ht = $(this).height();
					$(this).remove();
					
					// What's the maximum number of frames the sprite supports, given this.frameWidth and this.frameHeight
					maxFrames = {h : Math.floor(wd/th.frameWidth), v : Math.floor(ht/th.frameHeight)};
					
					// Use maxFrames to determine this.numFrames if necessary.
					th.numFrames.h = (th.numFrames.h === false || th.numFrames.h < 1 || th.numFrames.h > maxFrames.h) ? maxFrames.h : th.numFrames.h;
					th.numFrames.v = (th.numFrames.v === false || th.numFrames.v < 1 || th.numFrames.v > maxFrames.v) ? maxFrames.v : th.numFrames.v;
					
					// Make sure this.startingFrame is valid
					th.startingFrame.h = th.startingFrame.h < th.numFrames.h ? th.startingFrame.h : th.numFrames.h-1;
					th.startingFrame.v = th.startingFrame.v < th.numFrames.v ? th.startingFrame.v : th.numFrames.v-1;
					
					// Set the src of the $target image to our 1x1 transparent gif and save this AnimatedSprite object as jQ data.
					th.$el.bind("error.animatedSprite", function() {
						th.$el.unbind("error.animatedSprite");
						// 			prevID = th.$el.attr("id");
						// 			tempID = "jodotemp";
						// 			while($("#"+tempID).length) { tempID = "jodotemp"+Math.floor((Math.random()*1E4)).toString(16); }
						// 			th.$el.attr("id", tempID);
						// 			// Document.write
						// 			var docloc = document.location.href+"jodo.animatedsprite.2.0.js";
						// 			var scrpt = document.createElement("script");
						// 			scrpt.type = "text/javascript";
						// 			scrpt.text = 'document.getElementById("'+tempID+'").src = "mhtml:'+docloc+'!blank"; alert(document.getElementById("'+tempID+'").src);';
						// 			document.body.appendChild(scrpt);
						// 			
						// 			document.body.removeChild(scrpt);
						// 			!!prevID ? th.$el.attr("id", prevID) : th.$el.removeAttr("id");
						// 			//alert(document.location.href);
						// 			//th.$el.attr("src", "mhtml:"+document.location.href+"/jodo.animatedsprite.2.0.js!blank.gif");
						th.$el.attr("src", "about:blank");
					});
					
					/*
					if ($.browser.msie && $.browser.version < 8){
						th.$el.attr("src", "xbaseURLx/img/exp_blankForIE7_en_US.png").data("animatedSprite", th);
					} else {
						// Nasty string is the data URI for a 1x1 transparent gif
						th.$el.attr("src", "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==").data("animatedSprite", th);
						//th.$el.attr("src", "http://blank").data("animatedSprite", th);
					}
					*/
					th.$el.attr("src", "xbaseURLx/img/exp_blankForIE7_en_US.png").data("animatedSprite", th);

					// Explicitly set the $target image dimensions to this.frameHeight and this.frameWidth
					th.$el.width(th.frameWidth).height(th.frameHeight).css({
						// Set the sprite as the background image
						backgroundImage : "url('"+th.sprite+"')",
						backgroundRepeat : "no-repeat",
						backgroundPosition : "0px 0px"
					});
					
					th.goToFrame(th.startingFrame.h, "h");
					th.goToFrame(th.startingFrame.v, "v");
					
					// Auto-play if this.playing is true
					th.playing.h && !(th.playing.h = false) && th.play("h");
					th.playing.v && !(th.playing.v = false) && th.play("v");
				}
			});
		}
	});
	
	// If the image is already loaded by the time the Animated Sprite object is instantiated, this will fire and trigger the load function anyway
	$target.get(0).complete && $target.width() > 0 && $target.trigger("load");
};

// AnimatedSprite.isPlaying() lets you check the status of either (or both) axes of sprite animations.
AnimatedSprite.prototype.isPlaying = function(direction) {
	var th = this, dir = (direction==="b" || direction==="h" || direction==="v") ? direction : th.orientation;
	return dir === "b" ? (th.playing["h"] && th.playing["v"]) : th.playing[dir];
};

// AnimatedSprite.play() starts the frameloop of the animation and handles all looping logic
AnimatedSprite.prototype.play = function(direction) {
	var th = this, dir;
	function fGo(g) {
		th.goToFrame(g, dir);
		th.timer[dir] = setTimeout(tick, th.speed[dir]);
	}
	function tick() {
		// Increment of decrement this.frame based on the value of this.forward
		var f = th.frame[dir] + (th.forward[dir] ? 1 : -1);
		
		// If f is in the middle of the sprite, we can handle this frame normally
		if(f >= 0 && f < th.numFrames[dir]) {
			fGo(f)
		// If f is not in the middle of the sprite, check to see if we should loop
		} else if(!!th.loop[dir]) {
			// If this.loop is a number, decrement it (since it'll act like a counter)
			th.loop[dir] !== true && th.loop[dir]--;
			
			// Normalize f to between 0 and this.numframes
			f = (f+th.numFrames[dir]) % th.numFrames[dir];
			
			th.$el.trigger({type:"loop.animatedSprite", direction:dir});
			fGo(f);
		} else {
			// If f is less than 0 or greater than this.numFrames and this.loop is false, pause the animation
			th.playing[dir] = false;
			// If the opposite orientation (h or v) isn't playing either, remove the class
			th.playing[(dir === "h" ? "v" : "h")] || th.$el.removeClass("playing");
		}
	}
	
	dir = (direction==="b" || direction==="h" || direction==="v") ? direction : th.orientation;
	
	// If the direction is "b" for "both", play() for both orientations.
	if(dir === "b") { return th.play("h").play("v"); }
	
	if(th.spriteLoaded && !th.playing[dir]) {
		th.$el.trigger({type:"play.animatedSprite", direction:dir});
		th.playing[dir] = true;
		th.$el.addClass("playing");
		
		fGo(th.frame[dir]);
	}
	return this;
};

// AnimatedSprite.pause() stops the frameloop of the animation and clears the timer
AnimatedSprite.prototype.pause = function(direction) {
	var th=this, dir;
	
	dir = (direction==="b" || direction==="h" || direction==="v") ? direction : th.orientation;
	
	// If the direction is "b" for "both", pause() for both orientations.
	if(dir === "b") { return th.pause("h").pause("v"); }
	
	if(th.spriteLoaded && th.playing[dir]) {
		clearTimeout(th.timer[dir]);
		th.playing[dir] = false;
		// If the opposite orientation (h or v) isn't playing either, remove the class
		th.playing[(dir === "h" ? "v" : "h")] || th.$el.removeClass("playing");
		th.$el.trigger({type:"pause.animatedSprite", direction:dir});
	}
	return this;
};

// AnimatedSprite.goToFrame() handles the logic necessary to position the sprite and display a specific frame of the animation.
AnimatedSprite.prototype.goToFrame = function(i, direction) {
	var th=this, bp, dir;
	i = parseInt(i);
	
	dir = (direction==="b" || direction==="h" || direction==="v") ? direction : th.orientation;
	
	// If the direction is "b" for "both", goToFrame() for both orientations.
	if(dir === "b") { return th.goToFrame(i, "h").goToFrame(i, "v"); }
	
	if(th.spriteLoaded && i >= 0 && i < th.numFrames[dir]) {
		if(!!th.$el.css("backgroundPositionX")) {
			dir==="h" ? th.$el.css("backgroundPositionX", -1*i*th.frameWidth) : th.$el.css("backgroundPositionY", -1*i*th.frameHeight);
		} else {
			bp = parseInt(th.$el.css("backgroundPosition").split(" ")[dir==="h" ? 1 : 0]);
			th.$el.css({backgroundPosition : dir==="h" ? ("-"+(i*th.frameWidth)+"px "+bp+"px") : (bp+"px -"+(i*th.frameHeight)+"px")});
		}
		th.frame[dir] = i;
	}
	return this;
};

// AnimatedSprite.reverse() flips the bit on the this.forward property
AnimatedSprite.prototype.reverse = function(direction) {
	var dir = (direction==="b" || direction==="h" || direction==="v") ? direction : this.orientation;

	// If the direction is "b" for "both", goToFrame() for both orientations.
	if(dir === "b") { return th.reverse("h").reverse("v"); }

	if(this.spriteLoaded) {
		this.forward[dir] = !this.forward[dir];
		this.$el.trigger({type:"reverse.animatedSprite", direction:dir});
	}
	return this;
};

// AnimatedSprite.stop() pauses the animation, clears the timer, and jumps to this.startingFrame.
AnimatedSprite.prototype.stop = function(direction) {
	var th=this, dir = (direction==="b" || direction==="h" || direction==="v") ? direction : this.orientation;

	// If the direction is "b" for "both", goToFrame() for both orientations.
	if(dir === "b") { return th.stop("h").stop("v"); }
	
	if(th.spriteLoaded) {
		clearTimeout(th.timer[dir]);
		th.playing[dir] = false;
		// If the opposite orientation (h or v) isn't playing either, remove the class
		th.playing[(dir === "h" ? "v" : "h")] || th.$el.removeClass("playing");
		
		th.goToFrame(th.startingFrame[dir], dir);
		th.$el.trigger({type:"stop.animatedSprite", direction:dir});
	}
	return this;
};

// AnimatedSprite.destruct() will remove all evidence that this object ever existed amd returns the original $target
AnimatedSprite.prototype.destruct = function() {
	var th=this;
	clearTimeout(th.timer.h);
	clearTimeout(th.timer.v);
	th.playing = {h:false, v:false};
	th.$loader.remove();
	th.$el.removeClass("playing").css({
		backgroundImage : "inherit",
		backgroundRepeat : "inherit"
	}).attr("src", th.origSrc).removeData("animatedSprite").trigger("destruct.animatedSprite");
	th.$el.unbind("error.animatedSprite");
	return th.$el;
};

// jQuery bootstrapper for making an AnimatedSprite
// Call it on an element and pass in an optional map of options to override the AnimatedSprite defaults for instant AnimatedSprite fun.
// If the sprite argument is left out, the bootstrapper will look in the target element for an HTML5 data attribute called "sprite".
// Once that element has an AnimatedSprite associated with it, calling $.animatedSprite() on that object
// lets you access the AnimatedSprite's methods, like so: $(el).animatedSprite().play()
$.fn.animatedSprite = function(sprite, opts) {
	var $th = $(this).eq(0);
	if(!$th.is("img")) {
		return $(this);
	} else if($th.data("animatedSprite")) {
		return $th.data("animatedSprite");
	} else {
		return (sprite || typeof $th.data("sprite") === "string") ? (new AnimatedSprite($th, (sprite ? sprite : $th.data("sprite")), opts)) : false;
	}
}










