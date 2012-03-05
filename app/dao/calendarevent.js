function CalendarEvent(id, creator, title, start, end, location, content) {
	this.id       = id;
	this.creator  = creator;
	this.title    = title;
	this.start    = start;
	this.end      = end;
	this.location = location;
	this.content  = content;
	
	this.toString = function() {
		return this.title + ' (' + this.start + ' to ' + this.end + ')';
	};
}

var CalendarEventDao = function(callback) {
	var queue, database, that = this;

	this._prepareDatabase = function() {
		log.debug("opening database");

		queue.pause();

		var db = window.openDatabase(
			'eventmonkey',
			'1.0',
			'Event Monkey Database',
			1*1024*1024
		);

		queue.add(function(q) {
			log.debug("creating database");

			var onSuccess = function(tx, results) {
				log.debug("_prepareDatabase: got " + results.rows.length + " results (" + results + ")");
				q.run();
			};

			var onFailure = function(tx, err) {
				errorCallback("failed prepareDatabase call", err);
				q.failure("failed prepareDatabase call", err);
			};

			q.pause();

			db.transaction(function(tx) {
				tx.executeSql('DROP TABLE IF EXISTS events');
				tx.executeSql('CREATE TABLE IF NOT EXISTS events (' +
					'id TEXT UNIQUE NOT NULL, ' +
					'creator TEXT, ' +
					'title TEXT NOT NULL, ' +
					'start TEXT NOT NULL, ' +
					'end TEXT, ' +
					'location TEXT, ' +
					'content TEXT NOT NULL ' +
					')'
				);
				tx.executeSql("INSERT INTO EVENTS (id, title, start, end, content) " +
					"VALUES ('1', 'Test Event', '2010-01-01T04:30:00', '2012-01-01T00:00:00', 'Content!')",
					[],
					onSuccess,
					onFailure
				);
			});
		});

		queue.run();

		return db;
	};

	this.errorCallback = function(message, err) {
		if (err === undefined) {
			log.error(message);
		} else {
			log.error(message, err);
		}
	};

	this.save = function(calendarEvent, successCallback) {
		var checkIdExists = function(q) {
			var data = q.lastCallbackData();
			log.debug("checkIdExists(q, " + calendarEvent.id + ")");

			var errorCallback = this.errorCallback;

			var onSuccess = function(tx, results) {
				log.debug("_idExists: got " + results.rows.length + " results (" + results + ")");
				q.storeData(results);
				q.run();
			};

			var onFailure = function(tx, err) {
				errorCallback("failed idExists call", err);
				q.failure("failed idExists call", err);
			};

			q.pause();

			database.readTransaction(function(tx) {
				tx.executeSql(
					"SELECT id FROM events WHERE id = ?",
					[calendarEvent.id],
					onSuccess,
					onFailure
				);
			});
		};

		var saveResults = function(q) {
			var results = q.lastCallbackData();
			log.debug("_save(q), results = " + results + ")");

			var rows = results.rows;
			var errorCallback = this.errorCallback;

			var onSuccess = function(tx, results) {
				log.debug("save succeeded");
				q.run();
			};

			var onFailure = function(tx, err) {
				errorCallback("failed saveResults call", err);
				q.failure("failed saveResults call", err);
			};

			q.pause();

			var numRows = rows.length;
			log.debug("got " + numRows + " rows");
			database.transaction(function(tx) {
				if (numRows == 0) {
					t.executeSql(
						"INSERT INTO events (id, creator, title, start, end, location, content) VALUES (?, ?, ?, ?, ?, ?, ?)",
						[calendarEvent.id, calendarEvent.creator, calendarEvent.title, calendarEvent.start, calendarEvent.end, calendarEvent.location, calendarEvent.content],
						onSuccess,
						onFailure
					);
				} else {
					t.executeSql(
						"UPDATE events SET creator=?, title=?, start=?, end=?, location=?, content=? WHERE id=?",
						[calendarEvent.creator, calendarEvent.title, calendarEvent.start, calendarEvent.end, calendarEvent.location, calendarEvent.content, calendarEvent.id],
						onSuccess,
						onFailure
					);
				}
			});
		}

		log.debug("saving " + calendarEvent.toString());

		queue.pause();

		queue.add(checkIdExists);
		queue.add(saveResults);
		queue.add(function(q) {
			successCallback();
		});

		queue.run();
	};
	
	this.findAllEvents = function(callback, where, orderBy) {
		log.debug("findAllEvents where(" + where + "), orderBy(" + orderBy + ")")

		var errorCallback = this.errorCallback;

		queue.pause();
		
		queue.add(function(q) {
			database.transaction(function(tx) {
				var selectStatement = "SELECT id, creator, title, start, end, location, content FROM events";
				if (where) {
					selectStatement += " WHERE " + where;
				}
				if (orderBy) {
					selectStatement += " ORDER BY " + orderBy;
				} else {
					selectStatement += " ORDER BY start ASC, end ASC, title ASC";
				}
				tx.executeSql(
					selectStatement,
					[],
					function(tx, results) {
						log.debug("got " + results.rows.length + " results");

						var events = [];
						for (i = 0; i < results.rows.length; i++) {
							var item = results.rows.item(i);
							events.push(new CalendarEvent(item.id, item.creator, item.title, item.start, item.end, item.location, item.content));
						}
						callback(events);
					},
					errorCallback
				);
			});
		});
		
		queue.run();
	};
	
	queue    = new $.AsyncQueue();
	queue.pause();

	database = this._prepareDatabase();
	
	queue.run();
}
