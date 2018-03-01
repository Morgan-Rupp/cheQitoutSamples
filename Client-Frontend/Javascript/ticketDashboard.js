Template.ticketDashboard.created = function(){
  Meteor.subscribe('gifts', Meteor.user().emails[0].address);
};

Template.ticketDashboard.helpers({
  'ticketTotal': function(){
    var currentUser = this.createdBy;
    var id = this._id;
    var quantity = 0;
    var numberTickets = sales.find( { merchant: currentUser, ticket: true, redeemed: true, 'item._id': id  } ).fetch();
    var numberGifts = gifts.find( { merchant: currentUser, ticket: true, redeemed: true, 'item._id': id  } ).fetch();
    console.log(numberTickets);
    console.log(numberGifts);
    for (i = 0; i < numberTickets.length; i++) {
      //console.log(numberTickets[i].quantity);
      quantity = quantity + numberTickets[i].quantity;
    }
    for (i = 0; i < numberGifts.length; i++) {
      //console.log(numberTickets[i].quantity);
      newQuantity = parseInt(numberGifts[i].quantity);
      quantity = quantity + newQuantity;
    }
    newContent = '<div class="ticketArt firstTicket"><p class="ticketNumber" id="numberRedeemed">' + quantity + '</p><div class="dashedLine"></div><p class="textTicket">REDEEMED</p></div>';
    return newContent;
  },
  'ticketRemaining': function(){
    var currentUser = this.createdBy;
    var id = this._id;
    var quantity = 0;
    var numberTickets = sales.find( { merchant: currentUser, ticket: true, redeemed: false, 'item._id': id  } ).fetch();
    var numberGifts = gifts.find( { merchant: currentUser, ticket: true, redeemed: false, 'item._id': id  } ).fetch();
    console.log(numberTickets);
    console.log(numberGifts);
    for (i = 0; i < numberTickets.length; i++) {
      //console.log(numberTickets[i].quantity);
      quantity = quantity + numberTickets[i].quantity;
    }
    for (i = 0; i < numberGifts.length; i++) {
      //console.log(numberTickets[i].quantity);
      newQuantity = parseInt(numberGifts[i].quantity);
      quantity = quantity + newQuantity;
    }
    return quantity;
  },
  'eventLogo': function(){
    url = this.smallImgUrl;
    return url;
  },
  'client': function(){
    client = this.merchantName;
    return client;
  },
  'event': function(){
    clientEvent = this.name;
    return clientEvent;
  },
  'date': function(){
    eventTime = this.eventStart;
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
    var result = dateArray[1] + ". " + dateArray[2] + ", " + dateArray[3];
    return result;
  },
});

Template.ticketDashboard.events({
  //HELPCOMMENT Logs user out when clicked
  'click #signOut': function(){
    Meteor.logout();
    Router.go('/login');
  },
});