var storageVersion = 5;
var includeTestEvent = false;
var favorites = new Favorites();
var jocoOnline = false;
var normalTheme = 'c';
var hilightTheme = 'e';

var data = [];
var pendingUpdates = [];

function phoneGapAvailable() {
  var ret = (typeof(PhoneGap) != 'undefined');
	log.trace("phoneGapAvailable = " + ret + ", typeof = " + typeof(PhoneGap));
	return ret;
}

function updateType(type) {
	setType(type);
	refresh();
	return true;
}
function setType(type) {
	if (type == undefined) {
		type = $("input[name='type-choice']:checked").val();
	}
	save('calendarType', type);
	return true;
}

function getType() {
	var type = get('calendarType');
	if (type == 'official' || type == 'unofficial' || type == 'favorite') {
		return type;
	}
	return 'official';
}

function toggleFavorite(entryId) {
	var scheduleId = scheduleIds[entryId];
	if (scheduleId == undefined) {
		log.warn("Couldn't toggle " + scheduleId + "!");
		return;
	}

	if (favorites.contains(scheduleId)) {
		favorites.remove(scheduleId);
		$('#favorite-' + entryId).attr('data-theme', normalTheme);
	} else {
		favorites.add(scheduleId);
		$('#favorite' + entryId).attr('data-theme', hilightTheme);
	}
	refresh();
}

function checkForReminders() {
	if (!phoneGapAvailable()) {
		log.debug("not in an app, skip reminder support");
		return;
	}
	var lastCheck = new Date(get('lastCheck', 0));
	now = new Date();

	$.each(['official', 'unofficial'], function(i, type) {
		log.debug("checking for reminders (" + type + ")");
		var entries = get(type);
		if ((!entries) || entries.length === 0) {
			log.debug("no entries found");
			return;
		}
		$.each(entries, function(j, entry) {
			if (favorites.contains(entry.id)) {
				log.debug('('+type+') ' + entry.title + " is a favorite.... checking for alarms");
				// alarm 15 minutes before the event
				startTime = getDateFromString(entry.start);
				var alarmDate = new Date(startTime.getTime() - (60 * 1000 * 15));

				log.debug("lastCheck  = " + lastCheck);
				log.debug("now        = " + now);
				log.debug("alarm      = " + alarmDate);
				log.debug("event      = " + entry.start);

				if (alarmDate.between(lastCheck, now)) {
					log.info("BEEP!");

					var title = formatTime(getDateFromString(entry.start)) + ' - ' + entry.title;
					var header = title;
					var contents = entry.contents;

					if (phoneGapAvailable()) {
						navigator.notification.alert(title, function() {}, contents, 'OK');
						navigator.notification.vibrate(500);
					} else {
						$('#alert-title').html(title);
						$('#alert-header').html(header);
						$('#alert-text').html(contents);
						$.mobile.changePage("#alert");
						$('#alert-title').html(title);
					}
				} else {
					log.debug(alarmDate + " is not between " + lastCheck + " and " + now);
				}
			}
		});
	});
	
	save('lastCheck', now.getTime());
}

var scheduleIds = [];

function getAllEvents() {
	var events = [];
	$.each(['official', 'unofficial'], function(i, type) {
			var typeEvents = get(type);
			if ((!typeEvents) || typeEvents.length === 0) {
				return;
			}
			$.each(typeEvents, function(i, entry) {
				events.push(entry);
			});
		}
	);
	events.sort(function(a, b) {
		return a.start - b.start;
	});
	return events;
}

function refresh() {
	if (getCurrentPage() != 'schedule') {
		log.debug("skipping refresh, we're not on the schedule page");
		return;
	}

	var html = '';
	var last_date = '';
	var type = getType();
	var events = [];
	
	if (type == 'favorite') {
		$.each(getAllEvents(), function(i, entry) {
			// log.trace("event = " + entry.title);
			if (favorites.contains(entry.id)) {
				// log.trace("favorite = " + entry.title);
				events.push(entry);
			}
		});
	} else {
		events = get(type);
	}

	if ((!events) || events.length === 0) {
		return;
	}

	scheduleIds = [];
	var scheduleEntry = 0;

	$.each(events, function(i, entry) {
		if (entry.title != undefined && entry.title['$t'] != undefined) {
			// old storage format found; return
			return;
		}

		var header = entry.title;

		if (entry.start != undefined) {
			var startDate = formatDate(getDateFromString(entry.start));
			if (last_date != startDate) {
				html += '<li data-role="list-divider">' + startDate + '</li>' + "\n";
				last_date = startDate;
			}
			header += '<br /><span class="headersmall">Time: <span class="headertime">' + formatTime(getDateFromString(entry.start)) + '-' + formatTime(getDateFromString(entry.end)) + '</span></span>';
		}
			
		if (entry.location != undefined) {
			header += '<br /><span class="headersmall">Location: ' + entry.location + '</span>';
		}

		scheduleIds[scheduleEntry] = entry.id;
		var buttonThemeColor = normalTheme;
		if (type != 'favorite') {
			buttonThemeColor = (favorites.contains(entry.id)? hilightTheme:normalTheme);
		}

		html += '<li data-theme="'+buttonThemeColor+'" data-icon="star" id="favorite-'+scheduleEntry+'"><a href="javascript:toggleFavorite('+scheduleEntry+');">' + "\n" +
			'<div>' + "\n" +
			'<h3 style="white-space:normal">' + header + '</h3>' + "\n" +
			'<p style="white-space:normal; font-size:13px">' + entry.content + '</p>' + "\n" +
			'</div>' + "\n" +
			'</a>' + "\n";

			scheduleEntry++;
	});

	if(getCurrentPage() == 'schedule') {
		$('#calendar-list').html(html);
		favorites.save();
		$('#calendar-list').listview('refresh');
	}
}

function processUpdate(updateName, json) {
	log.debug("processUpdate(" + updateName + ")");

	var calendarEvents = [];

	persistence.transaction(function(tx) {
		var now = new Date();
		var calendar = new Calendar({name: updateName});

		if (includeTestEvent) {
			var nowTime = now.getTime();
			var calendarStart = new Date(nowTime - (nowTime % 1000) + (60 * 1000 * 17));
			var calendarEnd   = new Date(calendarStart.getTime() + (60 * 1000 * 60));

			var calendarEvent = new CalendarEvent();
			calendarEvent.eventId=updateName + '-monkey';
			calendarEvent.title = "Test Event";
			calendarEvent.content = "This is a test event.";
			calendarEvent.location = "Someplace";
			calendarEvent.start = calendarStart;
			calendarEvent.end = calendarEnd;
			calendarEvent.lastUpdated = now;
			calendarEvent.calendar = calendar;
			
			persistence.add(calendarEvent);
			calendarEvents.push(calendarEvent);
		}

		if (json != undefined && json.feed != undefined && json.feed.entry != undefined) {
			$.each(json.feed.entry, function(i, entry) {
				calendarEvent = new CalendarEvent();

				calendarEvent.eventId = entry.id['$t'];
				calendarEvent.title = entry.title['$t'];
				calendarEvent.content = entry.content['$t'];
				if (entry['gd$where'] && entry['gd$where'].length > 0) {
					calendarEvent.location = entry['gd$where'][0].valueString;
				}

				if (entry['gd$when']) {
					calendarEvent.start = getDateFromString(entry['gd$when'][0].startTime.replace('.000', ''));
					calendarEvent.end   = getDateFromString(entry['gd$when'][0].endTime.replace('.000', ''));
				}

				calendarEvent.lastUpdated = now;
				calendarEvent.calendar = calendar;

				persistence.add(calendarEvent);
				calendarEvents.push(calendarEvent);
			});
		}

		persistence.flush(tx, function() {
			var allEvents = CalendarEvent.all().order("start", true);
			allEvents.list(tx, function(results) {
				log.debug("got results = " + results);
				results.forEach(function (r) {
					log.debug("found event: " + r.toString());
				});
			});
		});
	});
	
	// log.trace(window.JSON.stringify(json));
	save(updateName, calendarEvents);
}

function handlePendingUpdates() {
	if (pendingUpdates.length > 0) {
		var update = pendingUpdates.shift();
		if (jocoOnline) {
			log.debug("handlePendingUpdates: " + update.name);
			$.getJSON(update.url, function(json) {
				processUpdate(update.name, json);
				handlePendingUpdates();
			});
		} else {
			log.debug("handlePendingUpdates: updates needed, but we are offline");
			handlePendingUpdates();
		}
	} else {
		log.info("handlePendingUpdates: no more updates needed");
		refresh();
	}
}

function updateData() {
	pendingUpdates.push({name:"official", url:
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
	pendingUpdates.push({name:"unofficial", url:
		"https://www.google.com/calendar/feeds/" +
		"6r0c1f3ltnhdlpbtpql79colos%40group.calendar.google.com" +
		"/public/full?alt=json-in-script" +
//		"&ctz=Etc/UTC" +
		"&ctz=America/New_York" +
		"&orderby=starttime" +
		"&sortorder=ascending" +
		"&max-results=10000" +
		"&start-min=2012-01-01T00:00:00-05:00" +
		"&callback=?"
	});
	handlePendingUpdates();
}

function updateDataIfOnline() {
	jocoOnline = false;

	if (pendingUpdates.length > 0) {
		// we're already doing this; skip
		return;
	}

	if (navigator.onLine) {
		// Just because the browser says we're online doesn't mean we're online. The browser lies.
		// Check to see if we are really online by making a call for a static JSON resource on
		// the originating Web site. If we can get to it, we're online. If not, assume we're
		// offline.
		$.ajax({
			async: true,
			cache: false,
			context: $(document.body),
			dataType: "jsonp",
			timeout: 5000,
			type: "GET",
			url: "http://www.raccoonfink.com/joco/online.html",
			success: function (data, status, req) {
				updateData();
			},
			error: function (req, status, ex) {
				if (jocoOnline) {
					updateData();
					return;
				}
				log.warn("Error: request = " + window.JSON.stringify(req) + ", status = " + status, ex);
				// We might not be technically "offline" if the error is not a timeout, but
				// otherwise we're getting some sort of error when we shouldn't, so we're
				// going to treat it as if we're offline.
				// Note: This might not be totally correct if the error is because the
				// manifest is ill-formed.
				refresh();
			}
		});
	} else {
		log.debug("not online");
		refresh();
	}
}

function updateMapImage() {
	$('#select-westerdam-image').attr('src', 'images/' + $('#select-westerdam').val());
	return false;
}

function onMenu(show) {
	return true;
}

function onSchedule(show) {
	if (show) {
		refresh();
		updateDataIfOnline();
	}
	return true;
}

function onMap(show) {
	return true;
}

function onDefault(show) {
	return true;
}

function nextDeckImage() {
	if (getCurrentPage() != 'map') { return; }
	var current = $('#select-westerdam option:selected');
	var nextObject = current.prev('option');
	if (nextObject != undefined && nextObject.val() != undefined) {
		current.removeAttr('selected');
		nextObject.attr('selected', 'selected');
		$('#select-westerdam').change();
	}
}

function previousDeckImage() {
	if (getCurrentPage() != 'map') { return; }
	var current = $('#select-westerdam option:selected');
	var previousObject = current.next('option');
	if (previousObject != undefined && previousObject.val() != undefined) {
		current.removeAttr('selected');
		previousObject.attr('selected', 'selected');
		$('#select-westerdam').change();
	}
}

function getCurrentPage() {
	return $.mobile.activePage.attr('id');
}

function freezeViewport() {
	log.debug("freezeViewport");
	$('meta[name=viewport]').attr('content', 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no');
}

function unfreezeViewport() {
	log.debug("unfreezeViewport");
	$('meta[name=viewport]').attr('content', 'width=device-width, initial-scale=1.0, user-scalable=yes');
}

$(document).bind('pageshow', function(event, data) {
	var activePage = getCurrentPage();
	log.debug('pageshow, active page = ' + activePage);

	switch(activePage) {
		case 'menu':     return onMenu(true);
		case 'schedule': return onSchedule(true);
		case 'map':      return onMap(true);
		default:         return onDefault(true);
	}
});

$('input, select, textarea').bind('focus blur',
	function(e) {
		$('meta[name="viewport"]').attr('content', 'width=device-width,initial-scale=1,maximum-scale=' + (e.type == 'blur' ? 10 : 1));
		// freezeViewport();
		// unfreezeViewport();
	}
);

/*
var viewportMeta = $('meta[name="viewport"]');
$('input, select, textarea').bind('focus blur', 
	function(event) {
		viewportMeta.attr('content', 'width=device-width,initial-scale=1,maximum-scale=' + (event.type == 'blur' ? 10 : 1));
	}
);
*/

$(document).bind('pagebeforehide', function(event, data) {
	var activePage = getCurrentPage();
	log.debug('pagebeforehide, active page = ' + activePage);

	switch(activePage) {
		case 'menu':     return onMenu(false);
		case 'schedule': return onSchedule(false);
		case 'map':      return onMap(false);
		default:         return onDefault(false);
	}
});

/*
$(document).bind('swipeleft', function(e, ui) {
	alert(e.type);
	if (getCurrentPage() == 'map') {
		nextDeckImage();
	}
});
$(document).bind('swiperight', function(e, ui) {
	alert(e.type);
	if (getCurrentPage() == 'map') {
		previousDeckImage();
	}
});
*/

$(document).bind('mobileinit',
	function() {
		$.support.cors = true;
		$.mobile.allowCrossDomainPages = true;
	}
);

var lastUpdated = new Date(0);
var doUpdates = function() {
	var now = new Date();
	// every hour
	var compareDate = new Date(lastUpdated.getTime() + (60 * 1000 * 60));
	if (compareDate.compareTo(now) < 1) {
		log.info("updateDataIfOnline is out of date, running");
		updateDataIfOnline();
		lastUpdated = now;
	}
	checkForReminders();
	setTimeout(doUpdates, (60 * 1000));
};

function addScript(file) {
	var script = document.createElement("script");
	script.type="text/javascript";
	script.src=file;
	document.body.appendChild(script);
}

$(document).ready(function() {
	var images = [
		"westerdam-11-sports.gif",
		"westerdam-10-observation.gif",
		"westerdam-09-lido.gif",
		"westerdam-08-navigation.gif",
		"westerdam-07-rotterdam.gif",
		"westerdam-06-upper-verandah.gif",
		"westerdam-05-verandah.gif",
		"westerdam-04-upper-promenade.gif",
		"westerdam-03-promenade.gif",
		"westerdam-02-lower-promenade.gif",
		"westerdam-01-main.gif"
	];
	
	$.each(images, function(i, image) {
		document.createElement('img').src = "images/" + image;
	});

	var currentStorageVersion = get('storageVersion');
	if (currentStorageVersion != storageVersion) {
		log.debug("current storage version (" + currentStorageVersion + ") does not match API storage version (" + storageVersion + ") -- resetting");
		window.localStorage.clear();
		save('storageVersion', storageVersion);
		
		addScript("official.js");
		addScript("unofficial.js");
	}

	$.mobile.defaultPageTransition = 'none';
	setType('official');
	if (getCurrentPage() == 'alert') {
		$.mobile.changePage("#menu");
	}
	
	setTimeout(doUpdates, (60 * 1000));
});