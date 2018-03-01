var prices;

Template.ticketStore.created = function(){
	//HELPCOMMENT Defines User Location (Default is Office Location) and Interests
	document.title = "CheQitout Ticket Store | Buy tickets to local events";
	userLoc = new ReactiveVar({location: {type: "Point", coordinates: [45.6387, -122.6615]}});
	//console.log(userLoc.get());
	interestsDb = new ReactiveVar([]);
};
Template.ticketStore.rendered = function(){
	// USED FOR TRACKER ****
	Session.set( "admin", true);
	date = new Date();
	date = date.toString();
	Session.set('sessionStartDate', date);
	if (localStorage.getItem('returnVisit') == null) {
		if (Meteor.userId() == null) {
			userID = 0;
		} else {
			userID = Meteor.userId();
		}
		Session.set( "admin", false);
		Meteor.call('insertTrackerStart', userID, date, "Deal");
	}
	//HELPCOMMENT On Page Transition
	prices = document.getElementsByClassName('price');
	//console.log(prices.length);
	for(var i = 0; i < prices.length; ++i){
		//console.log(prices[i].scrollWidth);
		if(prices[i].scrollWidth > 47){
			$(prices[i]).parent().children('.subscription-indicator').css({'font-size' : '1em'});
		}
	}
	Session.set('settingsActive', false);
	Session.set('catActive', false);
	Session.set('storeActive', true);
	Session.set('mapActive', false);
	Session.set('notificationState', false);
	Session.set('notificationOpen', false);
	userLoc.set(places.findOne({ref: Meteor.userId()}));
	interestsDb.set(interests.find({user: Meteor.userId()}, {limit: 1, sort: {date: -1}}).fetch());
	Session.set('interests', interestsDb.get());
	checkInterests();
	$(window).scroll(function() {
		if($(window).scrollTop() + $(window).height() == $(document).height()) {
			loadMore();
		}
	});

	function loadMore(){
		Session.set('loading', true);
		storeLevel = Session.get('storeLevel');
		storeLevel += 32;
		Session.set('storeLevel', storeLevel);
		Session.set('storeLoadLevel', storeLevel);
		console.log("loading more...");
	}

	Tracker.autorun(function () {
		//console.log("resubbing");
	  Meteor.subscribe("deals", Session.get('storeLevel'), Session.get('storeCity'));
	});
	Tracker.autorun(function () {
	//MARK IF NOTIFICATIONS ARE OPEN THEN IF IT GETS CLOSED AT ANY TIME CHANGE IT
		if (Session.get('notificationState') === true && Session.get('notificationOpen') === false) {
			Session.set('notificationOpen', true);
		}
		if (Session.get('notificationState') === false && Session.get('notificationOpen') === true) {
			Session.set('notificationOpen', false);
			Session.set('unseenCount', 0);
			Meteor.call('noteSeenAll');
		}
	});
};

Template.ticketStore.helpers({
	'cordova': function(){
		//HELPCOMMENT Checks if App
		return Session.get('cordova');
	},
	'pricePerPerson': function(){
		ppp = this.perPerson;
		pppNum = parseFloat(ppp);
		price = this.price;
		price = (price * (this.addedFeePercent * 0.01)) + price;
		price = price / ppp;
		price = price.toFixed(2);
		return "$" + price + " per person";
	},
	'isPricePerPerson': function(){
		ppp = this.perPerson;
		if (ppp == null || ppp == 1 || ppp == 0) {
			return "none";
		} else {
			return "inline-block";
		}
	},
	'percentOff': function(){
		//HELPCOMMENT Compares usual price to current price with percentage off
		if('startPrice' in this){
			var org = this.startPrice;
			var price = this.price;
			price = (price * (this.addedFeePercent * 0.01)) + price;
			var dollarsOff = org - price;
			var percent = Math.ceil((1 - (price / org)) * 100);

			if ((percent <= 0) || (dollarsOff <= 0)) {
				//return dollarsOff;
				return "none";
			} else {
				//return percent + "%<br>off";
				return "inline-block";
			}
		}
	},
	'beta': function(){
			//HELPCOMMENT checks if tester
		var betaCheck = Accounts.user().profile.beta;
		return betaCheck;
	},
	'isCustomer': function(){
			//HELPCOMMENT checks if customer
		var user = Accounts.user().profile.type;
		if(user == "Customer"){
			return true;
		} else {
			return false;
		}
	},
	'schema': function(){
			//HELPCOMMENT Gives Micro Data for SEO
		var schema = {
		  "@context": "http://schema.org",
		  "@type": "IndividualProduct",
		  "description": this.shortDescription,
		  "name": this.name
		};

		return JSON.stringify(schema);
	},
	'deals': function(){
		//HELPCOMMENT Lists out all available deals
		var count = 6;
		var thisUser = Meteor.userId();
		var now = new Date();
		if(Session.get("region")){
			dealList = deals.find({
				start: {$lt: now},
				end: {$gte: now},
				$or: [{region: Session.get("region")}, {region: null}],
				$and: [{ticket: true}]
			}, {
				sort: {createdAt: -1}}
				//limit: count}
			).fetch();
			Session.set('loading', false);
			return dealList;
		} else {
			dealList = deals.find({
				start: {$lt: now},
				end: {$gte: now},
				$or: [{region: 'newyork'}],
				$and: [{ticket: true}]
			}, {
				sort: {createdAt: -1}}
				//limit: count}
			).fetch();
			Session.set('loading', false);
			return dealList;
		}
	},
	//HELPCOMMENT For Fuctions below and Ending at the Bracket for Templates, Check mainLanding for Explaination.
	'expired': function(){
		var now = new Date();
		if(this.end < now){
			//console.log('expired');
			return "expired";
		}
	},
	'storeActive': function(){
		var state = Session.get('storeActive');
		if(state){
			return 'tab-active';
		} else {
			return 'tab-hidden';
		}
	},
	'adActive': function(){
		var state = Session.get('storeActive');
		if(state){
			return 'advisible';
		} else {
			return 'adhide';
		}
	},
	'catActive': function(){
		var state = Session.get('catActive');
		if(state){
			return 'tab-active';
		} else {
			return 'tab-hidden';
		}
	},
	'mapActive': function(){
		var state = Session.get('mapActive');
		if(state){
			setTimeout(function(){
				GoogleMaps.maps.storeMap.instance.setCenter(Session.get('storeMapCenter'));
			}, 200);
			return 'tab-active';
		} else {
			return 'tab-hidden';
		}
	},
	'setActive': function(){
		var state = Session.get('settingsActive');
		if(state){
			return 'settings-active';
		} else {
			return false;
		}
	},
	'setDisplay': function(){
		var state = Session.get('settingsActive');
		if(state){
			return 'settings-display';
		} else {
			return 'settings-hide';
		}
	},
	'loading': function(){
		var state = Session.get('loading');
		if(state){
			return "loading";
		} else {
			return "not-loading";
		}
	},
	'unseen': function(){
		return Session.get('unseenCount');
	},
	'unseenCounterVisible': function(){
		if(Session.get('unseenCount') < 1){
			return 'hidden';
		} else {
			return 'visible';
		}
	},
	'percent': function(){
		//HELPCOMMENT Compares usual price to current price with percentage off
		if('startPrice' in this){
			var org = this.startPrice;
			var price = this.price;
			price = (price * (this.addedFeePercent * 0.01)) + price;
			var dollarsOff = org - price;
			var percent = Math.ceil((1 - (price / org)) * 100);
			if (this.ticket) {
				return dollarsOff;
			} else {
				return percent + "%<br>off";
			}
		}
	},
	'ticketDeal': function(){
		//HELPCOMMENT Checks to see if item is a subscription of just a single deal
		if(this.ticket){
			return true;
		} else {
			return false;
		}
	},
	storeImage: function(id){
		var smallImg = this.smallImgUrl;
		var largeImg = this.imageurl;
		$('#'+id).css({'background-image' : 'url('+smallImg+')', '-webkit-filter': 'blur(10px) {{effects}}', 'filter': 'blur(10px) {{effects}}'});
		$('<img/>').attr('src', this.imageurl).on("load", function(){
			$(this).remove();
			$('#'+id).css({'background-image': 'url('+largeImg+')', '-webkit-filter': '{{effects}}', 'filter': '{{effects}}'});
		});
	},
	'subscriptionDetails': function(){
		if(this.subDetails.meter == "Monthly"){
			return "Per Month";
		} else {
			return "Full Membership";
		}
	},
	'priceDecimal': function(price){
		price = (price * (this.addedFeePercent * 0.01)) + price;
		if(price % 1 !== 0){
			return price.toFixed(2);
		} else {
			return price;
		}
	}
});

Session.set('notificationState', false);
Template.ticketStore.events({
	'touchstart li': function(){
		//tap.play();
	},
	'touchstart .btn': function(){
		//tap.play();
	},
	'touchstart button': function(){
		//tap.play();
	},
	'touchstart .deal-background': function(){
		//beep.play();
	},
	'click #notification': function(){
		//HELPCOMMENT Alerts to new Notifications
		if(!Meteor.isCordova){
			if(Session.get('notificationState')){
				$('#notifications-wrapper').css({'transform' : 'scale(0)'});
				Session.set('notificationState', false);
			} else {
				$('#notifications-wrapper').css({'transform' : 'scale(1)'});
				Session.set('notificationState', true);
			}
			ga('send', 'event', 'store', 'Notifications Checked', 'storeEvents');
		}
	},
	'touchend #notification': function(){
		try{
			if(typeof device !== 'undefined'){
				if (device.platform !== 'iOS') {
					navigator.vibrate(25);
				}
			} else if(isMobile.Android()) {
				navigator.vibrate(25);
			}
		} catch(e){
		}

		if(Meteor.isCordova){
			if(Session.get('notificationState')){
				$('#notifications-wrapper').css({'transform' : 'scale(0)'});
				Session.set('notificationState', false);
			} else {
				$('#notifications-wrapper').css({'transform' : 'scale(1)'});
				Session.set('notificationState', true);
			}
			ga('send', 'event', 'store', 'Notifications Checked', 'storeEvents');
		}
	},
	'click #categories': function(){
		//HELPCOMMENT Takes User to Categories
		if(!Meteor.isCordova){
			Session.set('storeActive', false);
			Session.set('mapActive', false);
			Session.set('settingsActive', false);
			Session.set('catActive', true);
			Session.set('changingInterests', true);
			checkInterests();
			$('#notifications-wrapper').css({'transform' : 'scale(0)'});
			Session.set('notificationState', false);
			ga('send', 'event', 'store', 'Categories Tab Viewed', 'storeEvents');
		}
	},
	'touchend #categories': function(){
		try{
			if(typeof device !== 'undefined'){
				if (device.platform !== 'iOS') {
					navigator.vibrate(25);
				}
			} else if(isMobile.Android()) {
				navigator.vibrate(25);
			}
		} catch(e){
		}
		if(Meteor.isCordova){
			Session.set('storeActive', false);
			Session.set('mapActive', false);
			Session.set('settingsActive', false);
			Session.set('catActive', true);
			checkInterests();
			$('#notifications-wrapper').css({'transform' : 'scale(0)'});
			Session.set('notificationState', false);
			ga('send', 'event', 'store', 'Categories Tab Viewed', 'storeEvents');
		}
	},
	'click #map-store': function(){
		//HELPCOMMENT Takes User to the Map
		if(!Meteor.isCordova){
			Session.set('settingsActive', false);
			Session.set('catActive', false);
			Session.set('storeActive', false);
			Session.set('mapActive', true);
			Session.set('notificationState', false);
			window.dispatchEvent(new Event('resize'));
			//console.log('resizing from map-store');
			//GoogleMaps.maps.storeMap.instance.setCenter(Session.get('storeMapCenter'));
			$('#notifications-wrapper').css({'transform' : 'scale(0)'});
			ga('send', 'event', 'store', 'Map Viewed', 'storeEvents');
			if(Session.get('changingInterests')){
				Meteor.call('updateInterests', Session.get('interests'));
				Session.set('changingInterests', false);
			}
		}
	},
	'touchend #map-store': function(){
		try{
			if(typeof device !== 'undefined'){
				if (device.platform !== 'iOS') {
					navigator.vibrate(25);
				}
			} else if(isMobile.Android()) {
				navigator.vibrate(25);
			}
		} catch(e){
		}
		if(Meteor.isCordova){
			Session.set('settingsActive', false);
			Session.set('catActive', false);
			Session.set('storeActive', false);
			Session.set('mapActive', true);
			window.dispatchEvent(new Event('resize'));
			//console.log('resizing from map-store');
			//GoogleMaps.maps.storeMap.instance.setCenter(Session.get('storeMapCenter'));
			$('#notifications-wrapper').css({'transform' : 'scale(0)'});
			if(Session.get('changingInterests')){
				Meteor.call('updateInterests', Session.get('interests'));
				Session.set('changingInterests', false);
			}
			ga('send', 'event', 'store', 'Map Viewed (from app)', 'storeEvents');
		}
	},
	'click #settings': function(){
		//HELPCOMMENT Toggles Settings within store
		if(!Meteor.isCordova){
			if(Session.get('settingsActive')){
				Session.set('settingsActive', false);
			} else {
				Session.set('settingsActive', true);
			}
			$('#notifications-wrapper').css({'transform' : 'scale(0)'});
			Session.set('notificationState', false);
			ga('send', 'event', 'store', 'Settings Checked', 'storeEvents');
		}
	},
	'touchend #settings': function(){
		try{
			if(typeof device !== 'undefined'){
				if (device.platform !== 'iOS') {
					navigator.vibrate(25);
				}
			} else if(isMobile.Android()) {
				navigator.vibrate(25);
			}
		} catch(e){
		}
		if(Meteor.isCordova){
			if(Session.get('settingsActive')){
				Session.set('settingsActive', false);
			} else {
				Session.set('settingsActive', true);
			}
			$('#notifications-wrapper').css({'transform' : 'scale(0)'});
			Session.set('notificationState', false);
			ga('send', 'event', 'store', 'Settings Checked (from app)', 'storeEvents');
		}
	},
	'click #store': function(){
		//HELPCOMMENT Takes user back to store
		if(!Meteor.isCordova){
			Session.set('settingsActive', false);
			Session.set('catActive', false);
			Session.set('storeActive', true);
			Session.set('mapActive', false);
			Session.set('notificationState', false);
			window.dispatchEvent(new Event('resize'));
			//console.log('resizing from store');
			$('#notifications-wrapper').css({'transform' : 'scale(0)'});
			if(Session.get('changingInterests')){
				Meteor.call('updateInterests', Session.get('interests'));
				Session.set('changingInterests', false);
			}
			ga('send', 'event', 'store', 'Store Viewed', 'storeEvents');
		}
	},
	'touchend #store': function(){
		try{
			if(typeof device !== 'undefined'){
				if (device.platform !== 'iOS') {
					navigator.vibrate(25);
				}
			} else if(isMobile.Android()) {
				navigator.vibrate(25);
			}
		} catch(e){
		}
		if(Meteor.isCordova){
			Session.set('settingsActive', false);
			Session.set('catActive', false);
			Session.set('storeActive', true);
			Session.set('mapActive', false);
			window.dispatchEvent(new Event('resize'));
			//console.log('resizing from store');
			$('#notifications-wrapper').css({'transform' : 'scale(0)'});
			if(Session.get('changingInterests')){
				Meteor.call('updateInterests', Session.get('interests'));
				Session.set('changingInterests', false);
			}
			ga('send', 'event', 'store', 'Store Viewed (from app)', 'storeEvents');
		}
	},
	'click .down-arrow': function(){
		loadMore();
	},
	'click #logout': function(){
		//navigate();
		Meteor.logout();
		Router.go('/join');
	},
	'click #profile-setup': function(){
		Session.set('merchantReady', false);
		Session.set('memberReady', false);
		Router.go('/profile-setup');
		scrollToTop();
	},
	'click #interests': function(){
		Router.go('/interests');
		scrollToTop();
	},
	'click #braintree': function(){
		Router.go('/braintree');
		scrollToTop();
	},
	'click #myDeals': function(){
		Router.go('/my-deals');
		scrollToTop();
	},
	'click #merchant': function(){
		Router.go('/business-dashboard');
		scrollToTop();
	},
	'click #about': function(){
		Router.go('/about');
		scrollToTop();
	},
	'click #giftCards': function(){
		Router.go('/gift-cards');
		scrollToTop();
	},
	'click #myMemberships': function(){
		Router.go('/my-memberships');
		scrollToTop();
	},
	'click #support': function(){
		Router.go('/support');
		scrollToTop();
	},
	//Tracks a Click
	'click': function(){
			if (Meteor.userId() == null) {
				userID = 0;
			} else {
				userID = Meteor.userId();
			}
			if (localStorage.getItem('returnVisit') == null) {
				var date = new Date();
				date = date.toString();
				var x = event.clientX;
				var totalX = window.innerWidth;
				var y = event.clientY;
				var totalY = $(document).height();
				startDateObject = Session.get('sessionStartDate');
				Meteor.call('insertTracker', date, x, totalX, y, totalY, startDateObject);
			}
	},
	//END Tracks a Click
	'resize window': function(){
		if(window.innerWidth < 768){
			for(var i = 0; i < prices.length; ++i){
				if(prices[i].scrollWidth > 47){
					$(prices[i]).parent().children('.subscription-indicator').css({'font-size' : '1em'});
				}
			}
		}
	}
});

Template.ticketStore.uihooks({
	//HELPCOMMENT Used on Page Load
	'.deal': {
		container: ".panel-group",
		insert: function(node, next, tpl){
			//console.log(node);
			$(node).insertBefore(next);
			$(node).css({'transform': 'translateY(30px)', 'opacity': '0'});
			setTimeout(function(){
				$(node).css({'transform': 'translateY(0px)', 'opacity': '1'}, 1000);
			}, 100);
			//$(node).velocity({'transform' : 'translateX(0px)'});
		},
		move: function(node, net, tpl){
			//console.log('Moving ' + node);
		},
		remove: function(node, tpl){
			//console.log('removing ' + node);
			$(node).remove();
		}
	}
});
