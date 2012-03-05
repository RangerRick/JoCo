require(['domReady'], function(domReady) {
	require(['appcache', 'dao', 'calendarSource'], function(appcache, dao, calendarSource) {
		log.debug("dao and calendarSource loaded " + calendarSource);
		calendarSource.addUpdate({name:"official", url:
			"http://www.google.com/calendar/feeds/" +
			"nh76o8dgn9d86b7n3p3uofg1q0%40group.calendar.google.com" +
			"/public/full?alt=json-in-script" +
	//		"&ctz=Etc/UTC" +
			"&ctz=America/New_York" +
			"&orderby=starttime" +
			"&sortorder=ascending" +
			"&max-results=10000" +
			"&start-min=2012-01-01T00:00:00-05:00" +
			"&callback=?"
		});
		calendarSource.updateDataIfOnline();
	});
});

/*
require(['appcache', 'date', 'storage', 'dao', 'favorites', 'app'], function() {
	console.log("all done!");
});
*/