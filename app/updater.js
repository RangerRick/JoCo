define(function() {
	var lastUpdated = new Date(0);
	var func;

	var self = {
		lastUpdated: function() {
			return lastUpdated;
		},
		passed: function() {
			lastUpdated = new Date();
		},
		runImmediately: function() {
			if (!f) {
				log.debug("runImmediately called, but run() has never been called!");
				return;
			}
			
			f(self);
		},
		run: function(f, interval) {
			func = f;
			if (!interval) {
				interval = (60 * 60 * 1000);
			}
			if (func == undefined) {
				log.warn("no valid function passed to the updater");
				return;
			}
			var now = new Date();
			var next = new Date(lastUpdated.getTime() + interval);

			if (now.isAfter(next)) {
				log.debug("running updater");
				func(self);
			}
			setTimeout(function() {
				self.run(func, interval);
			}, 1000);
		}
	};
	
	return self;
});