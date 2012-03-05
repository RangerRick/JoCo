var jocoOnline = false;

define(['./dao'], function(dao) {
	var pendingUpdates = [];

	var _updateData = function(obj) {
		if (pendingUpdates.length == 0) {
			log.debug("update data called, but no updates pending");
			return;
		}
		obj.updateDataFunc(pendingUpdates.shift());
	};

	var _refresh = function(obj) {
		obj.refreshFunc();
	};
	

	return {
		toString: function() {
			return "[calendarSource]";
		},
		addUpdate: function(update) {
			pendingUpdates.push(update);
		},
		refreshFunc: function() {
			log.debug("refreshFunc() called");
		},
		updateDataFunc: function(update) {
			log.debug("updateDataFunc() called (update = " + update.name + ")");
		},
		updateDataIfOnline: function() {
			jocoOnline = false;

			/*
			if (pendingUpdates.length > 0) {
				// we're already doing this; skip
				log.debug("updateDataIfOnline: no pending updates, skipping");
				_refresh(this);
				return;
			}
			*/

			if (navigator.onLine) {
				log.debug("navigator.onLine == true, checking if online.html is responsive");
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
					url: "online.html",
					success: function(data, status) {
						_updateData(me)
					},
					error: function (req, status, ex) {
						if (jocoOnline) {
							_updateData(me);
							return;
						}
						log.warn("Error: request = " + window.JSON.stringify(req) + ", status = " + status, ex);
						// We might not be technically "offline" if the error is not a timeout, but
						// otherwise we're getting some sort of error when we shouldn't, so we're
						// going to treat it as if we're offline.
						// Note: This might not be totally correct if the error is because the
						// manifest is ill-formed.
						_refresh(me);
					}
				});
			} else {
				log.debug("navigator.onLine == false, skipping update");
				_refresh(me);
			}
		}
	};
});
