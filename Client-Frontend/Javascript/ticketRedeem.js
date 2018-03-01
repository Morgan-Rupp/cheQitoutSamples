Template.ticketRedeem.created = function(){
  Session.setDefault('redeemDeal', {item: {city: ""}});
  Session.setDefault('businessLogo', "");
  Session.set('redeemConfirmVisible', false);
};

Template.ticketRedeem.rendered = function(){
    //var hammer = new Hammer(document.getElementsByClassName('redeemDiv'), {cssProps: {userSelect: false}});
    Hammer(document.getElementById("swipeIcon")).on("swiperight", function(e) {
      document.getElementById('swipeIcon').style.left = "90px";
			Session.set('redeemConfirmVisible', true);
		});
};

Template.ticketRedeem.helpers({
  //HELPCOMMENT Next Function helpers will check if an item is redeemed or not
  'key': function(){
    return this.key;
  },
  'visible': function(){
    if(Session.get('redeemConfirmVisible')){
      return 'visible';
    } else {
      return 'hidden';
    }
  },
  //HELPCOMMENT Changes visibility of the redeem slider if the item is already redeemed
  'changeVisibility': function(redeemedStatus){
    if(redeemedStatus){
      return "hidden";
    } else {
      return "visible";
    }
  },
  'saleItem': function(){
    Meteor.call('getSale', this.key, function(error, success){
      if(error){
        alert(error);
      } else {
        Session.set('redeemDeal', success);
      }
    });
    return Session.get('redeemDeal');
  },
  'isMobile': function(){
    return window.mobileAndTabletcheck();
  },
  'cityLocation': function(cityName){
    cityLowered = cityName.toLowerCase();
    cityUppercaseLetter = cityLowered.charAt(0).toUpperCase() + cityLowered.slice(1);
    return cityUppercaseLetter;
  },
  //HELPCOMMENT Formatting/Converting the time on the ticket
  'eventTime': function(eventTime){
    eventTime = eventTime.toString();
    var dateArray = eventTime.split(' ');
    time = dateArray[4].split(':');
    if (time[0] > 12 && time[0] < 24) {
      intTime = parseInt(time[0]) - 12;
      strTime = intTime.toString();
      newTime = strTime + ":" + time[1] + "PM";
    } else if (time[0] == 12) {
      newTime = time[0] + ":" + time[1] + "PM";
    } else if (time[0] == 24 || time[0] == 0) {
      newTime = "12:" + time[1] + "AM";
    } else {
      newTime = time[0] + ":" + time[1] + "AM";
    }
    var result = dateArray[1] + ". " + dateArray[2] + ", " + dateArray[3] + "<br>" + newTime;
    return result;
  },
  'businessImage': function(merchantID){
    Meteor.call('returnMerchantWithID', merchantID, function(error, success){
      if(error){
        alert(error);
      } else {
        return Session.set('businessLogo', success.logo);
      }
    });
    return Session.get('businessLogo');
  }
});

Template.ticketRedeem.events({
  //HELPCOMMENT On confirmation redeems item if it has not been redeemed already and inforation is valdi and then times out to my deals
  'click .btn-confirm': function(event){
    event.preventDefault();
    document.getElementById('swipeIcon').style.left = "-100px";
    event.target.innerHTML = '<i style="font-size: 3em; color: #fff" class="fa fa-circle-o-notch fa-spin"></i>';
    var key = event.target.id;
    Meteor.call('redeemItem', key, function(error, success){
      if(error){
        console.log(error.message);
        alert(error.reason);
      } else {
        event.target.style.background = "green";
        event.target.style.color = "#fff";
        event.target.innerHTML = '<i style="font-size: 4em" class="fa fa-check"></i>';
        setTimeout(function(){
          Router.go('/my-tickets');
        }, 5000);

      }
    });
    //Router.go('/my-deals');
  },
  //HELPCOMMENT Gets rid of confirmation popup (cancel/decline)
  'click .btn-decline': function(event){
    document.getElementById('swipeIcon').style.left = "-100px";
    Session.set('redeemConfirmVisible', false);
  }
});