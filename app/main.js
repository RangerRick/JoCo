require(['appcache']);

require(['domReady'], function(domReady) {
	require(['dao', 'calendarSource', 'updater', 'paxparser'], function(dao, calendarSource, updater, paxparser) {
		log.debug("dao and calendarSource loaded " + calendarSource);
		
		calendarSource.updateDataFunc = function(update) {
			if (dao.isReady) {
				log.debug("update succeeded");
				updater.passed();

				$.ajax({
					type: "GET",
					url: update.url,
					dataType: "xml",
					success: function(xml) {
						var events = paxparser.parseXml(xml);
						$.each(events, function(i, ev) {
							log.debug("found event: " + ev.title);
						});
					}
				});

			} else {
				log.debug("dao is not ready yet");
			}
		};

		var updateThings = function(updater) {
			if (dao.isReady) {
				calendarSource.addUpdate({name:"pax", url: "http://east.paxsite.com/schedule.xml"
				
				/*
					"http://www.google.com/calendar/feeds/" +
					"nh76o8dgn9d86b7n3p3uofg1q0%40group.calendar.google.com" +
					"/public/full?alt=json-in-script" +
					// &ctz=Etc/UTC" +
					"&ctz=America/New_York" +
					"&orderby=starttime" +
					"&sortorder=ascending" +
					"&max-results=10000" +
					"&start-min=2012-01-01T00:00:00-05:00" +
					"&callback=?"
				*/
				});
				calendarSource.updateDataIfOnline();
			}
		}
		
		updater.run(updateThings);
	});
});

/*
require(['appcache', 'date', 'storage', 'dao', 'favorites', 'app'], function() {
	console.log("all done!");
});
*/