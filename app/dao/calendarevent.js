var _q = new $.AsyncQueue();
var _db = undefined;

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

_prepareDatabase = function(errorCallback) {
	if (!errorCallback) {
		errorCallback = function(err) {
			log.error(err);
		};
	}

	log.debug("opening database");
	var db = window.openDatabase(
		'eventmonkey',
		'1.0',
		'Event Monkey Database',
		1*1024*1024
	);

	_q.add(function(q) {
		log.debug("creating database");
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
				"VALUES ('1', 'Test Event', '2010-01-01T04:30:00', '2012-01-01T00:00:00', 'Content!')"
			);
		});
	});
	
	_q.run();

	return db;
};

var CalendarEventDao = function(callback) {
	this.pending = [];
		
	this.errorCallback = function(message, err) {
		if (err === undefined) {
			log.error(message);
		} else {
			log.error(message, err);
		}
	};

	this.save = function(calendarEvent, successCallback) {
		var checkIdExists = function(q, data) {
			log.debug("_idExists(q, " + calendarEvent.id + ")");

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

			_db.readTransaction(function(tx) {
				tx.executeSql(
					"SELECT id FROM events WHERE id = ?",
					[calendarEvent.id],
					onSuccess,
					onFailure
				);
			});
		};

		var saveResults = function(q, results) {
			log.debug("_save(q, " + results + ")");

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

			var rows = results.rows.length;
			log.debug("got " + rows + " rows");
			_db.transaction(function(tx) {
				if (rows == 0) {
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

		_q.pause();

		_q.add(checkIdExists);
		_q.add(saveResults);
		_q.add(function(q, results) {
			log.debug("results = " + results);
		});

		_q.run();
	};
	
	this.findAllEvents = function(callback, where, orderBy) {
		log.debug("findAllEvents where(" + where + "), orderBy(" + orderBy + ")")

		var errorCallback = this.errorCallback;

		_db.transaction(function(tx) {
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
				this.errorCallback
			);
		});
	};
	
	_db = _prepareDatabase();
}
