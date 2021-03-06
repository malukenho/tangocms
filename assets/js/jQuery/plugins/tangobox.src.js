/*!
 * Tangobox, part of the TangoCMS Project
 * --- jQuery plugin based upon FancyBox by Janis Skarnelis, and ideas taken from jQuery
 * lightbox by Leandro Vieira Pinho.
 *
 * http://tangocms.org/projects/tangobox
 * @patches submit all patches to patches@tangocms.org
 *
 * @author Alex Cartwright
 * @copyright Copyright (C) 2009, 2010 Alex Cartwright
 * @license http://www.gnu.org/licenses/old-licenses/gpl-2.0.html GNU/GPL 2
 */

jQuery(document).ready(
	function() {
		// Add support for selectors, so all you need to do is add this JS file.
		jQuery("a[rel=modal],a[rel=modalImage]").tangobox();
	}
);

(function($) {
	$.fn.tangobox = function( settings ) {
		var settings = $.extend(
								{
									imageScale:				true,
									zoomOpacity:			true,
									zoomSpeedIn:			500,
									zoomSpeedOut:			"slow",
									frameWidth:				560,
									frameHeight:			340,
									overlayShow:			true,
									overlayOpacity:			0.7,
									overlayColor:			"#585858",
									slideshowAutostart:		false,
									slideshowDelay:			5200, // Delay of 0 disables slideshow
									displayMeta:			true, // Display title and controls for images?
									callbackOnStart:		null,
									callbackOnShow:			null,
									callbackOnClose:		null
								},
								settings
							  );
		var matchedGroup = this; // 'this' refers to the match items passed into the plugin, from the selector.
		var elem, // Element the user 'clicked' on.
			slideshowLength = matchedGroup.length,
			itemArray = [],	itemIndex = 0,
			busy = false, slideshowId,
			imageRegExp = /\.(jpe?g|gif|png)($|\?)?$/i,
			tbOuter, tbContent, tbMeta; // Store the selectors, saves selecting every time

		/**
		 * Begin the whole process of the Tangobox
		 *
		 * @return bool false
		 */
		function _initialize() {
			if ( !busy ) {
				elem = this;
				if ( $.isFunction( settings.callbackOnStart ) ) {
					settings.callbackOnStart();
				}
				// Allow you to close Tangobox before it has started
				$(document).bind("keyup",
							function(e) {
								if ( e.keyCode === 27 ) {
									busy = true;
									tbClose();
								}
							});
				if ( !$("#tbOverlay").length ) {
					var html = '<div id="tbOverlay"></div> \
								<div id="tbWrap"> \
									<div id="tbOuter"> \
										<div id="tbInner"> \
											<div id="tbContent"></div> \
											<div id="tbNav"> \
												<a id="tbNavPrev">Prev</a> \
												<a id="tbNavNext">Next</a> \
											</div> \
											<div id="tbMeta"><div id="tbClose"><a>Close</a></div></div> \
										</div> \
									</div> \
								</div>';
					$(html).appendTo("body");
				}
				tbOuter = $("#tbOuter");
				tbContent = $("#tbContent");
				tbMeta = $("#tbMeta");
				// Update the overlay and change item to the first one.
				if ( settings.overlayShow ) {
					var overlayCss = {backgroundColor: settings.overlayColor};
					if ( jQuery.support.opacity ) {
						overlayCss.opacity = settings.overlayOpacity;
					} else {
						overlayCss.filter = "alpha(opacity="+(settings.overlayOpacity*100)+")";
					}
					$("#tbOverlay").css(overlayCss).fadeIn(200);
				} else {
					$("#tbOverlay").hide();
				}
				// Only use the clicked element if it has the class "tbNoSlideshow"
				if ( $(elem).hasClass("tbNoSlideshow") ) {
					slideshowLength = 1;
					matchedGroup = [elem];
				}
				for( var i = 0; i < slideshowLength; i++ ) {
					itemArray[i] = {
									elem: matchedGroup[i],
									href: $(matchedGroup[i]).attr("href"),
									title: $(matchedGroup[i]).attr("title"),
									alt: $(matchedGroup[i]).find("> img").attr("alt"),
									rel: $(matchedGroup[i]).attr("rel")
									};
					if ( itemArray[i].href == $(elem).attr("href") ) {
						itemIndex = i;
					}
				}
				tbChangeContent();
				if ( settings.slideshowAutostart ) {
					tbStartSlideshow();
				}
			}
			return false;
		};

		/**
		 * Starts the automatic slideshow using the delay provided. If
		 * the delay is set to zero, the slideshow wont start.
		 *
		 * @return bool
		 */
		function tbStartSlideshow() {
			if ( settings.slideshowDelay <= 0 ) {
				return false;
			}
			slideshowId = setInterval( function() {
											if ( !busy ) {
												if ( itemIndex == slideshowLength-1 ) {
													itemIndex = 0;
												} else {
													++itemIndex;
												}
												tbChangeContent();
											}
									   },
									   settings.slideshowDelay
									 );
			return true;
		};

		/**
		 * Stops the current running slideshow (if any)
		 *
		 * @return void
		 */
		function tbStopSlideshow() {
			clearInterval( slideshowId );
			slideshowId = null;
		}

		/**
		 * Changes the content that is to be displayed in the main content
		 * area. The itemIndex of the item which was shown will be returned.
		 *
		 * @return int|bool
		 */
		function tbChangeContent() {
			if ( busy ) {
				return false;
			}
			busy = true;
			var currentItem = itemArray[ itemIndex ];
			var cTitle = currentItem.alt || currentItem.title || "";
			$("#tbNavPrev, #tbNavNext, #tbClose, #tbMeta").hide();
			if ( tbOuter.is(":visible") === false ) {
				tbOuter.css("top", "120px").show();
			}
			tbOuter.addClass("inProgress");
			if ( currentItem.href.match(/#/) ) {
				// Display an element within the content
				tbOuter.addClass("typeInline");
				tbSetContent( $(window.location.hash).html(), cTitle, settings.frameWidth, settings.frameHeight );
			} else if ( elem.rel == "modalImage" || currentItem.href.match(imageRegExp) ) {
				// Display image
				tbOuter.addClass("typeImage");
				if ( tbContent.is(":visible") ) {
					tbContent.fadeOut();
				}
				var imgPreload = new Image;
				imgPreload.onload = function() {
											var imgX = imgPreload.width, imgY = imgPreload.height,
												vpX = $(window).width() - 120, vpY = $(window).height() - 120; // Viewport Height/Width
											if ( settings.displayMeta ) {
												// We will be displaying the meta title bar, so shrink image even more.
												vpY -= tbMeta.outerHeight();
											}
											if ( settings.imageScale && (imgX > vpX || imgY > vpY) ) {
												var ratio = Math.min( Math.min(vpX, imgX) / imgX, Math.min(vpY, imgY) / imgY );
												imgX = Math.round( ratio * imgX );
												imgY = Math.round( ratio * imgY );
											}
											tbSetContent( '<img alt="" id="tbImage" src="'+imgPreload.src+'" height="'+imgY+'" width="'+imgX+'">',
														  cTitle, imgX, imgY
														);
										};
				imgPreload.src = currentItem.href;
			} else {
				// Display 'AJAX' content.
				tbOuter.addClass("typeAjax");
				$.get( currentItem.href, function(data) {
											// Get all query string args to check for width/height
											var args = {}, splitQuery = currentItem.elem.search.replace("?", "").split("&"), tmpVal;
											var splitCount = splitQuery.length;
											for( var i = 0; i < splitCount; i++ ) {
												tmpVal = splitQuery[i].split("=");
												args[ tmpVal[0] ] = tmpVal[1];
											}
											tbSetContent( '<div id="tbInline">'+data+'</div>',
														  cTitle,
														  (args.width || settings.frameWidth),
														  (args.height || settings.frameHeight)
														);
										 }
					 );
			}
			return itemIndex;
		};

		/**
		 * Sets the content that is to be shown.
		 *
		 * @return void
		 */
		function tbSetContent( content, cTitle, cWidth, cHeight ) {
			cWidth = parseInt( cWidth );
			cHeight = parseInt( cHeight );
			// Get viewports height/width to center the content
			var vpY = $(window).height(), vpScrollY = $(window).scrollTop(),
				tbPadding = tbOuter.css("paddingTop").replace(/[^\d\.]/g, "") * 2;
			var cTop = (cHeight + tbPadding) / 2;
			var tbOuterCssTop = (vpY/2 - cTop)+vpScrollY;
			if ( tbOuter.is(":visible") && cWidth == tbOuter.width() && cHeight == tbOuter.height() ) {
				var dimSettings = {width: cWidth}; // just to keep jQuery happy, it needs some animation.
			} else {
				var dimSettings = {
									height: cHeight+"px",
									width: cWidth+"px"
								  };
			}
			// If displaying meta bar, bring tbOuter up by the height of the meta bar.
			tbMeta.find("> div[id!=tbClose]").remove();
			if ( settings.displayMeta ) {
				tbOuterCssTop = (tbOuterCssTop - tbMeta.outerHeight()/2)+"px";
				tbMeta.prepend('<div><p id="tbMetaTitle">'+cTitle+'</p></div>');
				if ( itemArray.length > 1 ) {
					tbMeta.find("> div:first").append('<p id="tbMetaInfo">Viewing '+(itemIndex+1)+' of '+itemArray.length+'</p>');
					if ( settings.slideshowDelay ) {
						tbMeta.find("> div:first p:last").append( $('<span><a href="" id="tbMetaSlideshow">'+(slideshowId ? "Stop" : "Start")+' slideshow</a></span>') );
						tbMeta.find("> div:first p:last a").click(function() {
														if ( slideshowId ) {
															$(this).html("Start slideshow");
															$("#tbNav").show();
															tbStopSlideshow();
														} else {
															$(this).html("Stop slideshow");
															$("#tbNav").hide();
															tbStartSlideshow();
														}
														return false;
													});
					}
				}
			} else {
				tbOuterCssTop += "px";
			}
			if ( tbOuterCssTop !== tbOuter.css("top") ) {
				dimSettings.top = tbOuterCssTop;
				if ( tbOuter.is(":visible") == false && vpScrollY !== 0 && dimSettings.top.replace(/[^\d\.]/g, "") > vpScrollY ) {
					// Bring the initial tbOuter into the viewport, then resize from there.
					tbOuter.css("top", vpScrollY+"px");
				}
			}
			tbOuter.show();
			tbContent.css("opacity", 1)
					 .fadeOut("normal", function() {
											tbContent.empty()
											tbContent.html( $(content) ).hide();
											tbOuter.animate( dimSettings, settings.zoomSpeedIn, tbAnimateLoading );
										}
							 );
		}

		/**
		 * Does various animations to make a prettyfull transition of loading
		 * the new content (it has already been set, we just show it now)
		 *
		 * @return void
		 */
		function tbAnimateLoading() {
			tbContent.fadeIn("normal", function() {
											tbOuter.removeClass("inProgress");
											if ( settings.displayMeta ) {
												// Slide in the meta bar
												tbOuter.animate( {height: tbOuter.height()+tbMeta.outerHeight()+"px"},
																 settings.zoomSpeedIn,
																 function() {
																	$("#tbClose, #tbMeta").show();
																	tbFinish();
																 }
															   );
											} else {
												tbFinish();
											}
									   }
							);
		};

		/**
		 * Handles finishing up of loading the content (from tbSetContent)
		 *
		 * @return void
		 */
		function tbFinish() {
			// Preload neighbour images
			var preloadImgs = [];
			if ( (itemArray.length - 1) > itemIndex ) {
				preloadImgs[0] = itemArray[ itemIndex+1 ];
			}
			if ( itemIndex > 0 ) {
				preloadImgs[1] = itemArray[ itemIndex-1 ];
			}
			for( var i in preloadImgs ) {
				var imgItem = preloadImgs[i];
				if ( imgItem.rel == "modalImage" || imgItem.href.match(imageRegExp) ) {
					objNext = new Image();
					objNext.src = imgItem.href;
				}
			}
			/**
			 * Setup the navigation (Next/Prev) buttons for images only
			 */
			if ( itemArray[ itemIndex ].rel == "modalImage" || itemArray[ itemIndex ].href.match(imageRegExp) ) {
				if ( itemIndex !== 0 ) {
					$("#tbNavPrev").show().unbind().click( function() {
																--itemIndex;
																tbChangeContent();
																return false;
															}
														  );
				}
				if ( itemIndex !== (itemArray.length-1) ) {
					$("#tbNavNext").show().unbind().click( function() {
																++itemIndex;
																tbChangeContent();
																return false;
															}
														  );
				}
			}
			if ( slideshowId != null ) {
				$("#tbNav").hide();
			}
			// Different ways of closing the modal box
			$("#tbOuter.typeImage #tbContent, #tbClose").bind("click", tbClose);
			if ( $.isFunction( settings.callbackOnShow ) ) {
				settings.callbackOnShow( itemArray[ itemIndex ] );
			}
			busy = false;
		};

		/**
		 * Handles closing of the Tangobox
		 *
		 * @return void
		 */
		function tbClose() {
			tbStopSlideshow();
			$(document).unbind();
			tbContent.unbind().empty().stop();
			tbOuter.stop().css( {height: "250px", width: "250px", top: "0"} ).hide().removeAttr("class");
			$("#tbOverlay").fadeOut( settings.zoomSpeedOut );
			if ( $.isFunction( settings.callbackOnClose ) ) {
				settings.callbackOnClose( itemArray[ itemIndex ] );
			}
			busy = false;
			return false;
		};

		return this.unbind("click").bind("click", _initialize);

	};

})(jQuery);
