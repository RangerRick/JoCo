function get(name) {
	try {
//		if (phoneGapAvailable()) {
			val = window.localStorage.getItem(name);
			if (val) {
				return window.JSON.parse(window.localStorage.getItem(name), function(key, value) {
					if (key == 'start' || key == 'end') {
						value = getDateFromString(value.replace('.000', ''));
					}
					return value;
				});
			}
//		} else {
//			return $.Storage.loadItem(name);
//		}
	} catch (e) {
		log.warn("failed to get " + name, e);
	}
	return undefined;
}
	
function save(name, obj) {
	if (obj == undefined) {
//		log.trace("removing item " + name);
//		if (phoneGapAvalable()) {
			return window.localStorage.removeItem(name);
//		} else {
//			return $.Storage.deleteItem(name);
//		}
	}
//	if (phoneGapAvailable()) {
		var stringify = window.JSON.stringify(obj);
//		log.trace("saving " + name);
		return window.localStorage.setItem(name, stringify);
//	} else {
//		return $.Storage.saveItem(name, obj);
//	}
}

