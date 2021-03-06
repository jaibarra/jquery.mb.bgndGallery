/*******************************************************************************
 jquery.mb.components
 Copyright (c) 2001-2011. Matteo Bicocchi (Pupunzi); Open lab srl, Firenze - Italy
 email: mbicocchi@open-lab.com
 site: http://pupunzi.com

 Licences: MIT, GPL
 http://www.opensource.org/licenses/mit-license.php
 http://www.gnu.org/licenses/gpl.html
 ******************************************************************************/

/*
 * Name:jquery.mb.bgndGallery
 * Version: 1.1
 *
 */

(function($){

	$.mbBgndGallery ={
		name:"mb.bgndGallery",
		author:"Matteo Bicocchi",
		version:"1.1",
		defaults:{
			containment:"body",
			images:[],
			shuffle:false,
			controls:null,
			effect:{enter:{left:0,opacity:0},exit:{left:0,opacity:0}, enterTiming:"ease-in", exitTiming:"ease-in"},
			timer:4000,
			raster:false, //"inc/raster.png"
			effTimer:3000,
			folderPath:false,
			autoStart:true,
			grayScale:false,
			activateKeyboard:true,
			preserveTop:false,
			onStart:function(){},
			onChange:function(idx){}, //idx=the zero based index of the displayed photo
			onPause:function(){},
			onPlay:function(opt){},
			onNext:function(opt){},
			onPrev:function(opt){}
		},
		clear:false,

		buildGallery:function(options){
			var opt = {};
			$.extend(opt, $.mbBgndGallery.defaults,options);
			opt.galleryID= new Date().getTime();
			var el= $(opt.containment).get(0);
			el.opt= opt;

			if(el.opt.onStart)
				el.opt.onStart();

			opt.gallery= $("<div/>").attr({id:"bgndGallery_"+el.opt.galleryID}).addClass("mbBgndGallery");
			var pos= opt.containment=="body"?"fixed":"absolute";
			opt.gallery.css({position:pos,top:0,let:0,width:"100%",height:"100%",overflow:"hidden"});

			var containment = el.opt.containment;

			if(containment !="body" && $(containment).text().trim()!=""){
				var wrapper=$("<div/>").css({"position":"absolute",minHeight:"100%", minWidth:"100%", zIndex:3});
				$(containment).wrapInner(wrapper);
				if($(containment).css("position")=="static")
					$(containment).css("position","relative");
			}

			if(opt.raster){
				var raster=$("<div/>").css({position:"absolute",top:0,left:0,width:"100%",height:"100%",background:"url("+opt.raster+")",zIndex:1});
				opt.gallery.append(raster);
			}

			$(containment).prepend(opt.gallery);

			if(el.opt.folderPath && el.opt.images.length==0)
				opt.images=jQuery.loadFromSystem(el.opt.folderPath);

			var images= opt.images;

			if(opt.shuffle)
				images= $.shuffle(images);

			var totImg= images.length;

			var loadCounter=0;

			$.mbBgndGallery.preload(images[0],el);
			$(opt.gallery).bind("imageLoaded_"+opt.galleryID,function(){
				loadCounter++;
				if(loadCounter==totImg){
					$(opt.gallery).unbind("imageLoaded_"+opt.galleryID);
					return;
				}
				$.mbBgndGallery.preload(images[loadCounter],el);
			});

			opt.imageCounter=0;

			$.mbBgndGallery.changePhoto(images[opt.imageCounter],el);

      if (!opt.autoStart){
				opt.paused=true;
				$(opt.gallery).trigger("paused");
			}


			$(opt.gallery).bind("imageReady_"+opt.galleryID,function(){

				if(opt.paused)
					return;
				$.mbBgndGallery.play(el);
			});

			$(window).bind("resize",function(){
				var image=$("#bgndGallery_"+el.opt.galleryID+" img");
				$.mbBgndGallery.checkSize(image,el);
			});

			var controls = el.opt.controls;
			if(controls){
				var counter=$(opt.controls).find(".counter");
				counter.html(opt.imageCounter+1+" / "+opt.images.length);

				$.mbBgndGallery.buildControls(controls,el);
				$(opt.containment).bind("paused",function(){
					$(opt.controls).find(".play").show();
					$(opt.controls).find(".pause").hide();
				});
				$(opt.containment).bind("play",function(){
					$(opt.controls).find(".play").hide();
					$(opt.controls).find(".pause").show();
				});
			}
		},

		preload:function(url,el){
			if($.mbBgndGallery.clear){
				$(el.opt.gallery).remove();
				return;
			}

			var img= $("<img/>").load(function(){
				$(el.opt.gallery).trigger("imageLoaded_"+el.opt.galleryID);
			}).attr("src",url);
		},

		checkSize:function(image,el){

			if($.mbBgndGallery.changing)
				return;

			if($.mbBgndGallery.clear){
				$(el.opt.gallery).remove();
				return;
			}

			return image.each(function(){
				var image=$(this);
				var w= image.attr("w");
				var h= image.attr("h");

				var containment = el.opt.containment == "body"? window : el.opt.containment;
				var aspectRatio= w/h;
				var wAspectRatio=$(containment).width()/$(containment).height();
				if(aspectRatio>=wAspectRatio){
					image.css("height","100%");
					image.css("width","auto");
				} else{
					image.css("width","100%");
					image.css("height","auto");
				}
				image.css("margin-left",(($(containment).width()-image.width())/2));

				if(!el.opt.preserveTop)
					image.css("margin-top",(($(containment).height()-image.height())/2));
			});
		},

		changePhoto:function(url,el){
			if($.mbBgndGallery.clear){
				$(el.opt.gallery).remove();
				return;
			}

			$.mbBgndGallery.changing=true;

			if(el.opt.onChange)
				el.opt.onChange(el.opt.imageCounter);

			var image=$("<img/>").hide().load(function(){
				var image=$(this);

				var tmp=$("<div/>").css({position:"absolute",top:-5000});
				tmp.append(image);
				$("body").append(tmp);
				image.attr("w", image.width());
				image.attr("h", image.height());
				tmp.remove();

				$("#bgndGallery_"+el.opt.galleryID+" img").CSSAnimate(el.opt.effect.exit,el.opt.effTimer,el.opt.effect.exitTiming,"opacity, left, top, width, height",function(){
					$("#bgndGallery_"+el.opt.galleryID+" img:first").remove();
				});
				image.css({position:"absolute"});
				$("#bgndGallery_"+el.opt.galleryID).append(image);

				//todo: add a property to let height for vertical images
				$.mbBgndGallery.changing=false;

				$.mbBgndGallery.checkSize(image, el);

				image.css(el.opt.effect.enter).show().CSSAnimate({top:0,left:0,opacity:1},el.opt.effTimer,el.opt.effect.enterTiming,"opacity, left, top, width, height",function(){
					$(el.opt.gallery).trigger("imageReady_"+el.opt.galleryID);
        });
			}).attr("src",url);

			if(el.opt.grayScale){
				image.greyScale();

			}

			var counter=$(el.opt.controls).find(".counter");
			counter.html(el.opt.imageCounter+1+" / "+el.opt.images.length);

		},

		play:function(el){
			if($.mbBgndGallery.clear){
				$(el.opt.gallery).remove();
				return;
			}

			if(el.opt.onPlay)
				el.opt.onPlay(el.opt);

			el.opt.changing=setTimeout(function(){
				if(el.opt.paused)
					return;
				if (el.opt.imageCounter>=el.opt.images.length-1)
					el.opt.imageCounter=-1;

				el.opt.imageCounter++;

				$.mbBgndGallery.changePhoto(el.opt.images[el.opt.imageCounter],$(el.opt.containment).get(0));
			},el.opt.paused?0:el.opt.timer);

			$(el.opt.gallery).trigger("play");

		},

		pause:function(el){
			if($.mbBgndGallery.clear){
				$(el.opt.gallery).remove();
				return;
			}

			clearTimeout(el.opt.changing);
			el.opt.paused=true;
			$(el.opt.gallery).trigger("paused");

			if(el.opt.onPause)
				el.opt.onPause();
		},

		next:function(el){
			if($.mbBgndGallery.clear){
				$(el.opt.gallery).remove();
				return;
			}

			if(el.opt.onNext)
				el.opt.onNext(el.opt);
			$.mbBgndGallery.pause(el);
			clearTimeout(el.opt.changing);
			if (el.opt.imageCounter==el.opt.images.length-1)
				el.opt.imageCounter=-1;

			el.opt.imageCounter++;

			$.mbBgndGallery.changePhoto(el.opt.images[el.opt.imageCounter],el);
		},

		prev:function(el){
			if($.mbBgndGallery.clear){
				$(el.opt.gallery).remove();
				return;
			}

			if(el.opt.onPrev)
				el.opt.onPrev(el.opt);

			$.mbBgndGallery.pause(el);
			clearTimeout(el.opt.changing);
			if (el.opt.imageCounter==0)
				el.opt.imageCounter=el.opt.images.length;

			el.opt.imageCounter--;

			$.mbBgndGallery.changePhoto(el.opt.images[el.opt.imageCounter],el);
			el.opt.paused=true;
			$(el.opt.gallery).trigger("paused");

		},

		loader:{
			show:function(){},
			hide:function(){}
		},

		keyboard:function(el){
			$(document).bind("keydown.bgndGallery",function(e){
				switch(e.keyCode){
					case 32:
						if(el.opt.paused){
							$.mbBgndGallery.play(el);
							el.opt.paused=false;
						}else{
							el.opt.paused=true;
							$.mbBgndGallery.pause(el);
						}
						e.preventDefault();
						break;
					case 39:
						$.mbBgndGallery.next(el);
						e.preventDefault();

						break;
					case 37:
						$.mbBgndGallery.prev(el);
						e.preventDefault();

						break;
				}
			})
		},

		buildControls:function(controls,el){
			var pause=$(controls).find(".pause");
			var play=$(controls).find(".play");
			var next=$(controls).find(".next");
			var prev=$(controls).find(".prev");
			if(el.opt.autoStart)
				play.hide();

			pause.bind("click",function(){
				$.mbBgndGallery.pause(el);
				$(this).hide();
				play.show();
			});

			play.bind("click",function(){
				if(!el.opt.paused) return;
				clearTimeout(el.opt.changing);
				$.mbBgndGallery.play(el);
				el.opt.paused=false;
			});

			next.bind("click",function(){
				$.mbBgndGallery.next(el);
				pause.hide();
				play.show();

			});

			prev.bind("click",function(){
				$.mbBgndGallery.prev(el);
				pause.hide();
				play.show();
			});

			if(el.opt.activateKeyboard)
				$.mbBgndGallery.keyboard(el);
		},

		changeGallery:function(el,array){

			$(el.gallery).fadeOut();

			$.mbBgndGallery.pause(el);

			el.opt.images=array;
			var images= el.opt.images;
			var totImg= images.length;
			var loadCounter=0;

			$.mbBgndGallery.preload(images[0],el);
			$(el.opt.gallery).bind("imageLoaded_"+el.opt.galleryID,function(){
				loadCounter++;
				if(loadCounter==totImg){
					$(el.opt.gallery).unbind("imageLoaded_"+el.opt.galleryID);
					$(el.gallery).fadeIn();
					$.mbBgndGallery.play(el);
					el.opt.paused=false;
					return;
				}
				$.mbBgndGallery.preload(images[loadCounter],el);
			});
			el.opt.imageCounter=0;
		}
	};


  /*Browser detection patch*/
  $.browser.mozilla = /firefox/.test(navigator.userAgent.toLowerCase());
  $.browser.webkit = /webkit/.test(navigator.userAgent.toLowerCase());
  $.browser.opera = /opera/.test(navigator.userAgent.toLowerCase());
  $.browser.msie = /msie/.test(navigator.userAgent.toLowerCase());

  $.fn.CSSAnimate = function(opt, duration, delay, ease, properties, callback) {
    return this.each(function() {

      var el = $(this);

      if (el.length === 0 || !opt) {return;}

      if (typeof duration == "function") {callback = duration; duration = $.fx.speeds["_default"];}
      if (typeof delay == "function") {callback = delay; delay=0}
      if (typeof ease == "function") {callback = ease; ease = "cubic-bezier(0.65,0.03,0.36,0.72)";}
      if (typeof properties == "function") {callback = properties; properties = "all";}


      if(typeof duration == "string"){
        for(var d in $.fx.speeds){
          if(duration==d){
            duration= $.fx.speeds[d];
            break;
          }else{
            duration=null;
          }
        }
      }

      //http://cssglue.com/cubic
      //  ease  |  linear | ease-in | ease-out | ease-in-out  |  cubic-bezier(<number>, <number>,  <number>,  <number>)

      if (!jQuery.support.transition) {

        for(var o in opt){
          if (o==="transform"){
            delete opt[o];
          }
        }

        for(var o in opt){
          if (opt[o]==="auto"){
            delete opt[o];
          }
        }
        if(!callback || typeof callback==="string")
          callback ="linear";

        el.animate(opt, duration, callback);
        return;
      }

      console.debug($.browser.mozilla)

      var sfx = "";
      var transitionEnd = "transitionEnd";
      if ($.browser.webkit) {
        sfx = "-webkit-";
        transitionEnd = "webkitTransitionEnd";
      } else if ($.browser.mozilla) {
        sfx = "-moz-";
        transitionEnd = "transitionend";
      } else if ($.browser.opera) {
        sfx = "-o-";
        transitionEnd = "oTransitionEnd";
      } else if ($.browser.msie) {
        sfx = "-ms-";
        transitionEnd = "msTransitionEnd";
      }

      for(var o in opt){
        if (o==="transform"){
          opt[sfx+"transform"]=opt[o];
          delete opt[o];
        }
        if (o==="transform-origin"){
          opt[sfx+"transform-origin"]=opt[o];
          delete opt[o];
        }
      }

      if (properties === "transform")
        properties = sfx+properties;


      el.css(sfx + "transition-property", properties);
      el.css(sfx + "transition-duration", duration + "ms");
      el.css(sfx + "transition-delay", delay + "ms");
      el.css(sfx + "transition-timing-function", ease);
      el.css(sfx + "backface-visibility","hidden");

      setTimeout(function() {
        el.css(opt);
      }, 10);


      var endTransition = function(e) {
        this.removeEventListener(transitionEnd, endTransition, false);
        $(this).css(sfx + "transition", "");
//      $(this).css(sfx + "backface-visibility", "visible");
        e.stopPropagation();


        if (typeof callback == "function"){

          callback();
        }

        return false;
      };


      this.addEventListener(transitionEnd, endTransition, false);
      this.addEventListener(transitionEnd, endTransition, false);
    })
  };

  $.fn.CSSAnimateStop=function(){
    var sfx = "";
    if ($.browser.webkit) {
      sfx = "-webkit-";
    } else if ($.browser.mozilla) {
      sfx = "-moz-";
    } else if ($.browser.opera) {
      sfx = "-o-";
    } else if ($.browser.msie) {
      sfx = "-ms-";
    }
    $(this).css(sfx + "transition", "");
  };

// jQuery.support.transition
// to verify that CSS3 transition is supported (or any of its browser-specific implementations)
  $.support.transition = (function() {
    var thisBody = document.body || document.documentElement;
    var thisStyle = thisBody.style;
    return thisStyle.transition !== undefined || thisStyle.WebkitTransition !== undefined || thisStyle.MozTransition !== undefined || thisStyle.MsTransition !== undefined || thisStyle.OTransition !== undefined;
  })();


	jQuery.loadFromSystem=function(folderPath, type){

		// if directory listing is enabled on the remote server.
		// if you run the page locally you need to run it under a local web server (Ex: http://localhost/yourPage)
		// otherwise the directory listing is unavailable.

		if(!folderPath)
			return;
		if(!type)
			type="jpg" || "jpeg";
		var arr=[];
		$.ajax({
			url:folderPath,
			async:false,
			success:function(response){
				var tmp=$(response);
				var els= tmp.find("[href*='."+type+"']");
				els.each(function(){
					arr.push(folderPath+$(this).attr("href"));
				});
				tmp.remove();
			}
		});
		return arr;
	};

	$.fn.greyScale = function() {
		return this.each(function() {

			if ($.browser.msie && $.browser.version<9) {
				this.style.filter = "progid:DXImageTransform.Microsoft.BasicImage(grayScale=1)";
			} else {
				this.src = grayScaleImage(this);
			}

		})
	};

	$.shuffle = function(arr) {
		var newArray = arr.slice();
		var len = newArray.length;
		var i = len;
		while (i--) {
			var p = parseInt(Math.random()*len);
			var t = newArray[i];
			newArray[i] = newArray[p];
			newArray[p] = t;
		}
		return newArray;
	};

	function grayScaleImage(imgObj){
		var canvas = document.createElement('canvas');
		var canvasContext = canvas.getContext('2d');

		var imgW = imgObj.width;
		var imgH = imgObj.height;
		canvas.width = imgW;
		canvas.height = imgH;

		canvasContext.drawImage(imgObj, 0, 0);
		var imgPixels = canvasContext.getImageData(0, 0, imgW, imgH);

		for(var y = 0; y < imgPixels.height; y++){
			for(var x = 0; x < imgPixels.width; x++){
				var i = (y * 4) * imgPixels.width + x * 4;
				var avg = (imgPixels.data[i] + imgPixels.data[i + 1] + imgPixels.data[i + 2]) / 3;
				imgPixels.data[i] = avg;
				imgPixels.data[i + 1] = avg;
				imgPixels.data[i + 2] = avg;
			}
		}
		canvasContext.putImageData(imgPixels, 0, 0, 0, 0, imgPixels.width, imgPixels.height);
		return canvas.toDataURL();
	}

})(jQuery);