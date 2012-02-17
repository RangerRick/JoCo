var days = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ];
var months = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];

function formatTime(d, doSeconds) {
	var hour = String('0' + (d.getHours() % 12)).slice(-2);
	if (hour == '00') {
		hour = '12';
	}
	var ret = hour + ':' + String('0' + d.getMinutes()).slice(-2);
	
	if (doSeconds != undefined && doSeconds == true) {
		ret += ':' + String('0' + d.getSeconds()).slice(-2);
	}

	if ((d.getHours() % 12) == d.getHours()) {
		ret += 'AM';
	} else {
		ret += 'PM';
	}
	return ret;
}

function formatDate(d) {
	return days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate();
}

function getDateFromString(dateTime) {
	if (dateTime instanceof Date) {
		return new Date(dateTime.getUTCFullYear(), dateTime.getUTCMonth(), dateTime.getUTCDate(), dateTime.getUTCHours(), dateTime.getUTCMinutes(), 0, 0);
	}
	var dateTimeParts = dateTime.split('T');
	var dateParts = dateTimeParts[0].split('-');
	var timeParts = dateTimeParts[1].split(':');
	
	// console.log('year = ' + dateParts[0] + ', month = ' + dateParts[1] + ', day = ' + dateParts[2]);
	// console.log('hours = ' + timeParts[0] + ', minutes = ' + timeParts[1]);
	
	return new Date(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0], timeParts[1], 0, 0);
}

function getStringFromDate(d) {
	return d.getUTCFullYear() + '-'
		+ String('0' + d.getUTCMonth()).slice(-2)
		+ '-' + String('0' + d.getUTCDate()).slice(-2)
		+ 'T' + String('0' + d.getUTCHours()).slice(-2)
		+ ':' + String('0' + d.getUTCMinutes()).slice(-2)
		+ ':' + String('0' + d.getUTCSeconds()).slice(-2)
		+ '-00:00';
}