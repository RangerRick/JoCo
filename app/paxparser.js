define(['dao'], function(dao) {
	
	var parseXml = function(xml) {
		var events = [];
		var now = new Date();

	    var counter = 0;
	    $(xml).find("panel").each(function() {

	        var counter = counter + 1;
	        var schedulecontent = "";
			var panelId = $(this).find("panelid").text();
	        var day = $(this).find("panelday").text();
	        var theatre = $(this).find("paneltheatre").text();
	        var title = $(this).find("paneltitle").text();
	        var time = $(this).find("paneltime").text();
	        var desc = $(this).find("paneldescription").text();
	        var tags = $(this).find("paneltags").text();
	        var panelists = ""
	        var panelisttitle = "";
	        var panelistarray = new Array();
	        var panelisttitlearray = new Array();
	        var x = 0;
	        var i = 0;
	        var nopublishme = "";

	        /* $('.content_cont').append($(this).find("panelpanelist").text()); */

	        for (i = 0; this.childNodes[i]; i = i + 1)
	        //Cycle through all xml tags in each panel.
	        {
	            if (this.childNodes[i].tagName == "panelpanelists")
	            //Find panelists
	            {
	                if (this.childNodes[i].childNodes[0].text)
	                // This is essentially for Internet Explorer.
	                {
	                    panelisttest = this.childNodes[i].childNodes[0].text;
	                    if (this.childNodes[i].childNodes[1])
	                    {
	                        panelisttitletest = this.childNodes[i].childNodes[1].text;
	                    }
	                    else
	                    {
	                        panelisttitletest = "";
	                    }
	                }

	                if (this.childNodes[i].childNodes[0].textContent)
	                // This is essentially for everything else.
	                {
	                    panelisttest = this.childNodes[i].childNodes[0].textContent;
	                    if (this.childNodes[i].childNodes[1])
	                    {
	                        panelisttitletest = this.childNodes[i].childNodes[1].textContent;
	                    }
	                    else
	                    {
	                        panelisttitletest = "";
	                    }
	                }

	                if (panelisttitletest)
	                {
	                    panelists = panelists + panelisttest + " " + panelisttitletest + ", ";
	                }
	                else
	                {
	                    panelists = panelists + panelisttest + ", ";
	                }
	            }
	        }

	        time = time.replace(/P.M./g, "pm");
	        time = time.replace(/A.M./g, "am");
	        time = time.replace(/Midnight/g, "12:00am");
	        time = time.replace(/Noon/g, "12:00pm");

			/*
	        time = day + " " + time;
	        timeprep = '';
	        timeend = '</div>';
	        time = timeprep + time + timeend + "\n";
			*/
			var start = time.replace(/ - .*$/, '');
			var end   = time.replace(/^.* - /, '');

	        desc = desc.replace(/{{/g, "<");
	        desc = desc.replace(/}}/g, ">");
	        desc = desc.replace(/\n/g, "<br />");


	        if (desc.substr(0, 12) == '<br /><br />') {
	            desc = desc.slice(12);
	        }

	        panelists = panelists.substring(0, panelists.length - 2);
	        //clears out comma at the end.
	        if (panelists) {
	            panelistsprep = '<div class="news"><i>Panelists include: ';


	            panelistsend = '</i></div>';
	            panelists = panelistsprep + panelists + panelisttitle + panelistsend + "\n\n\n";
	        }

	        schedulecontent = schedulecontent + title;
	        schedulecontent = schedulecontent + theatre;
	        schedulecontent = schedulecontent + time;
	        schedulecontent = schedulecontent + unescape(desc);
	        schedulecontent = schedulecontent + panelists;

	        var nopublishme = tags.indexOf("nopublish");

	        schedulecontent = schedulecontent;
	        schedulecontent = schedulecontent.replace(/~ampersand~/g, "&");

			var calendarEvent = new dao.CalendarEvent();
			calendarEvent.eventId=panelId;
			calendarEvent.title = title;
			calendarEvent.content = unescape(desc);
			calendarEvent.location = theatre;
			calendarEvent.start = new Date(2012, 3, 6, 0, 0, 0, 0);
			calendarEvent.end = new Date(2012, 3, 6, 0, 0, 0, 0);
			calendarEvent.lastUpdated = now;

			events.push(calendarEvent);


	        /* $('.content_cont').append(schedulecontent); */
	    });
	    /* $('.content_cont').append('<img src="img/cont_btm.png">'); < !--needs the footer--> */
	
		return events;
	};
	
	return {
		parseXml: parseXml
	};
});