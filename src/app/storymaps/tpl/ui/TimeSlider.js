define(["esri/dijit/TimeSlider",
	"esri/TimeExtent",
	"dojo/on",
	"dojo/date/locale",
	"dojo/topic",
	"lib-build/css!./TimeSlider"
	],function(EsriTimeSlider,
		EsriTimeExtent,
		on,
		locale,
		topic){
		/**
		* Time Slider
		* @class Time Slider
		*
		* NOTE: Requires Jquery
		**/

		return function TimeSlider(map,properties){
			var mapContainer = $(map.container);
			var el = $('<div class="timeslider"><div class="background-pane"></div></div>');
			var sliderPane = $('<div class="inner-pane"></div>');
			el.append(sliderPane);
			mapContainer.addClass('has-timeslider');
			mapContainer.append(el);

			if ($('.timeslider-stylesheet').length < 1){
				addStyles();
			}
			
			$(window).resize(function(){
				setLayout();
			});

			var timeSlider = new EsriTimeSlider({},sliderPane.get(0));

			var startTime = properties.startTime;
			var endTime = properties.endTime;
			var fullTimeExtent = new EsriTimeExtent(new Date(startTime), new Date(endTime));

			map.setTimeExtent(fullTimeExtent);
			map.setTimeSlider(timeSlider);

			timeSlider.setThumbCount(properties.thumbCount);
			timeSlider.setThumbMovingRate(properties.thumbMovingRate);

			if (properties.numberOfStops) {
				timeSlider.createTimeStopsByCount(fullTimeExtent, properties.numberOfStops);
			}
			else {
				timeSlider.createTimeStopsByTimeInterval(fullTimeExtent, properties.timeStopInterval.interval, properties.timeStopInterval.units);
			}

			if (properties.thumbCount === 2) {
				timeSlider.setThumbIndexes([0, 1]);
				el.addClass("time-range");
			}
			else if(properties.thumbCount === 1){
				el.addClass("time-instance");
			}
			else{
				el.addClass("time-progressive");
			}
					
			timeSlider.startup();

			var playButton = $('<div class="play-time"><div class="play-arrow"></div><div class="pause-icon"></div></div>');
			var rewind = $('<div class="rewind-time"><div class="rewind-arrow"></div><div class="rewind-block"></div></div>');
			var fastForward = $('<div class="fastForward-time"><div class="fastForward-arrow"></div><div class="fastForward-block"></div></div>');
			var timeDisplay = $('<h6 class="time-display"></h6>');
			el.find(".esriTimeSlider td[align=right]").addClass("fixed-width").empty().append(playButton);
			el.find(".esriTimeSlider td[width=30]").addClass("fixed-width").empty().append(rewind);
			el.find(".esriTimeSlider td:last").addClass("fixed-width").empty().append(fastForward);
			el.find(".esriTimeSlider .tsTmp").append(timeDisplay);

			el.find(".esriTimeSlider .dijitSliderImageHandle").append('<div class="slider-handle"></div></div><div class="slider-handle-point-border"></div><div class="slider-handle-point"></div>');

			timeDisplay.html(getTimeString(timeSlider.getCurrentTimeExtent()));
			setLayout();

			topic.subscribe("story-load-section", function(){
				stopAnimation();
			});

			playButton.click(function(){
				if ($(this).hasClass("paused")){
					stopAnimation();
				}
				else{
					playAnimation();
				}
			});

			rewind.click(function(){
				stopAnimation();
				timeSlider.previous();
			});

			fastForward.click(function(){
				stopAnimation();
				timeSlider.next();
			});

			timeSlider.on('time-extent-change',function(timeExtent){
				timeDisplay.html(getTimeString(timeExtent));
				setTimeout(function(){
					if (!timeSlider.loop){
						if (timeSlider.thumbCount === 1 && timeSlider.thumbIndexes[0] === timeSlider.timeStops.length - 1){
							stopAnimation();
						}
						else if (timeSlider.thumbCount === 2 && timeSlider.thumbIndexes[1] === timeSlider.timeStops.length - 1){
							stopAnimation();
						}
					}
				},100);
				timeSlider.pause();
				on.once("update-end",function(){
					if(playButton.hasClass("paused")){
						timeSlider.play();
					}
				});
			});

			function stopAnimation(){
				playButton.removeClass("paused");
				timeSlider.pause();
			}

			function playAnimation(){
				if (timeSlider.thumbCount === 1 && timeSlider.thumbIndexes[0] === timeSlider.timeStops.length - 1){
					timeSlider.setThumbIndexes([0, 1]);
				}
				else if (timeSlider.thumbCount === 2 && timeSlider.thumbIndexes[1] === timeSlider.timeStops.length - 1){
					timeSlider.setThumbIndexes([0, 1]);
				}
				playButton.addClass("paused");
				timeSlider.play();
			}

			function getTimeString(timeExtent){
				var datePattern;
				var timeString;
				
				if (properties.timeStopInterval && properties.timeStopInterval.units){

					switch (properties.timeStopInterval.units) {
					case 'esriTimeUnitsCenturies':
						datePattern = 'yyyy G';
						break;
					case 'esriTimeUnitsDecades':
						datePattern = 'yyyy';
						break;
					case 'esriTimeUnitsYears':
						datePattern = 'yyyy';
						break;
					case 'esriTimeUnitsWeeks':
						datePattern = 'MMMM d, yyyy';
						break;
					case 'esriTimeUnitsDays':
						datePattern = 'MMMM d, yyyy';
						break;
					case 'esriTimeUnitsHours':
						datePattern = 'h a';
						break;
					case 'esriTimeUnitsMilliseconds':
						datePattern = 'h:mm:ss:SSS a';
						break;
					case 'esriTimeUnitsMinutes':
						datePattern = 'h:mm a';
						break;
					case 'esriTimeUnitsMonths':
						datePattern = 'MMMM y';
						break;
					case 'esriTimeUnitsSeconds':
						datePattern = 'h:mm:ss a';
						break;
					}

					timeString = formatDate(timeExtent.startTime, datePattern) + " to " + formatDate(timeExtent.endTime, datePattern);


				}
				else{
					datePattern = 'MMMM d, yyyy';
					timeString = formatDate(timeExtent.endTime, datePattern);
				}

				return timeString;
			}

			function formatDate(date, datePattern)
			{
				var dateObj = date;
				
				if(!(date instanceof Date)){
					dateObj = new Date(date);
				}

				return locale.format(dateObj,{
					selector: 'date',
					datePattern: datePattern
				});
			}





			function addStyles(){
				var colors = app.data.getWebAppData().getColors();

				var sheet = (function() {
					var style = document.createElement("style");
					style.setAttribute("class", "timeslider-stylesheet");
					style.appendChild(document.createTextNode(""));
					document.head.appendChild(style);
					return style.sheet;
				})();

				// Main
				addCSSRule(sheet, ".timeslider .background-pane", "background-color: " + colors.panel);
				addCSSRule(sheet, ".timeslider .time-display", "color: " + colors.text);
				// Defaults
				addCSSRule(sheet, ".esriTimeSlider .tsTicks .dijitRuleMark", "border-color: " + colors.softBtn);
				addCSSRule(sheet, ".esriTimeSlider .dijitSliderImageHandle .slider-handle", "background-color: " + colors.dotNav);
				addCSSRule(sheet, ".esriTimeSlider .dijitSliderImageHandle .slider-handle", "border-color: " + colors.softBtn);
				addCSSRule(sheet, ".esriTimeSlider .dijitSliderImageHandle .slider-handle-point", "border-top-color: " + colors.dotNav);
				addCSSRule(sheet, ".esriTimeSlider .dijitSliderImageHandle .slider-handle-point-border", "border-top-color: " + colors.softBtn);
				addCSSRule(sheet, ".esriTimeSlider.time-range .dijitSliderProgressBar, .esriTimeSlider.time-range .dijitSliderProgressBar.dijitSliderThumbFocused, .esriTimeSlider.time-range .dijitSliderFocused .dijitSliderBar.dijitSliderProgressBar, .esriTimeSlider.time-progressive .dijitSliderProgressBar, .esriTimeSlider.time-progressive .dijitSliderProgressBar.dijitSliderThumbFocused, .esriTimeSlider.time-progressive .dijitSliderFocused .dijitSliderBar.dijitSliderProgressBar", "background: " + colors.dotNav + " !important");
				addCSSRule(sheet, ".dijitSlider .dojoxRangeSliderBarContainer .dijitSliderProgressBarH", "background: " + colors.dotNav + " !important");
				addCSSRule(sheet, ".esriTimeSlider .dijitSliderBar, .esriTimeSlider .dijitSliderBumper, .esriTimeSlider .dijitSliderFocused .dijitSliderBar", "background: " + colors.media + " !important");
				addCSSRule(sheet, ".esriTimeSlider .dijitSliderBar, .esriTimeSlider .dijitSliderBumper, .esriTimeSlider .dijitSliderFocused .dijitSliderBar", "border-color: " + colors.softBtn + " !important");
				// Controls
				addCSSRule(sheet, ".play-time, .rewind-time, .fastForward-time", "background-color: " + colors.dotNav);
				addCSSRule(sheet, ".play-arrow, .fastForward-arrow, .pause-icon", "border-left-color: #fff");
				addCSSRule(sheet, ".rewind-arrow, .pause-icon", "border-right-color: #fff");
				addCSSRule(sheet, ".fastForward-block, .rewind-block", "background: #fff");
				addCSSRule(sheet, ".play-time:hover .play-arrow, .fastForward-time:hover .fastForward-arrow, .play-time:hover .pause-icon", "border-left-color: " + colors.softBtn);
				addCSSRule(sheet, ".rewind-time:hover .rewind-arrow, .play-time:hover .pause-icon", "border-right-color: " + colors.softBtn);
				addCSSRule(sheet, ".fastForward-time:hover .fastForward-block, .rewind-time:hover .rewind-block", "background: " + colors.softBtn);
			}

			function addCSSRule(sheet, selector, rules, index) {
				if("insertRule" in sheet) {
					sheet.insertRule(selector + "{" + rules + "}", index);
				}
				else if("addRule" in sheet) {
					sheet.addRule(selector, rules, index);
				}
			}

			function setLayout(){
				var mcWidth = mapContainer.outerWidth();

				if ($('body').hasClass('mobile-view')){
					el.width(mcWidth);
				}
				else if (app.data.getWebAppData().getLayout().id === 'float' && app.data.getWebAppData().getLayoutOptions().layoutCfg.position === 'right'){
					el.width($('#floatingPanel').position().left - 50);
				}
				else if (app.data.getWebAppData().getLayout().id === 'float' && app.data.getWebAppData().getLayoutOptions().layoutCfg.position === 'left'){
					el.width($('body,html').width() - $('#floatingPanel').position().left - $('#floatingPanel').width() - 50);
				}
				else {
					el.width(mcWidth - 50);
				}
			}

		};

});