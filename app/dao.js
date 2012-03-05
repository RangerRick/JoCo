persistence.store.websql.config(persistence, 'monkey', 'The *Monkey Database', 1 * 1024 * 1024);

var Calendar = persistence.define('Calendar', {
	creator: "TEXT",
	name: "TEXT",
	description: "TEXT"
});

var CalendarEvent = persistence.define('CalendarEvent', {
	eventId: "TEXT",
	creator: "TEXT",
	title: "TEXT",
	start: "DATE",
	end: "DATE",
	location: "TEXT",
	content: "TEXT",
	lastUpdated: "DATE"
});

CalendarEvent.index('eventId', {unique:true});

Calendar.hasMany('calendarEvents', CalendarEvent, 'calendar');

persistence.defineMigration(1, {
 	up: function() {
		this.dropTable('Calendar');
		this.createTable('Calendar', function(t) {
			t.text('creator');
			t.text('name');
			t.text('description');
		});
		this.dropTable('CalendarEvent');
		this.createTable('CalendarEvent', function(t) {
			t.text('eventId');
			t.text('creator');
			t.text('title');
			t.date('start');
			t.date('end');
			t.text('location');
			t.text('content');
			t.date('lastUpdated');
		});
	},
	down: function() {
		this.dropTable('CalendarEvent');
		this.dropTable('Calendar');
	}
});

persistence.migrations.init(function() {
	log.debug("migrations initialized");
	persistence.migrate(function() {
		log.debug("database migrated");
	});
});
