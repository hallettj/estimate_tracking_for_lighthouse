// Estimate Tracking for Lighthouse
// version 0.1 BETA!
// 2008-06-20
// Copyright (c) 2008, Jesse Hallett
// Released under the GPL license
// http://www.gnu.org/copyleft/gpl.html
//
// --------------------------------------------------------------------
//
// This is a Greasemonkey user script.
//
// To install, you need Greasemonkey: http://greasemonkey.mozdev.org/
// Then restart Firefox and revisit this script.
// Under Tools, there will be a new menu item to "Install User Script".
// Accept the default configuration and install.
//
// To uninstall, go to Tools/Manage User Scripts,
// select "Estimate Tracking for Lighthouse", and click Uninstall.
//
// --------------------------------------------------------------------
//
// ==UserScript==
// @name          Estimate Tracking for Lighthouse
// @namespace     http://sitr.us/
// @description   Displays the total time left on open tickets on the milestone page of Lighthouse.
// @include       http://*.lighthouseapp.com/projects/*/milestones/*
// ==/UserScript==

function FormatFloat(pFloat, pDp){
    var m = Math.pow(10, pDp);
    return parseInt(pFloat * m, 10) / m;
}

function formatTime(hours, useDays) {
  var timeDisp = '';
  if (useDays && hours >= 8.0) {
    var days = Math.floor(userHours / 8.0);
    if (days == 1) {
      timeDisp += days + ' day ';
    } else {
      timeDisp += days + ' days ';
    }
    hours = hours % 8.0
      }
  if (hours > 0 && hours < 1) {
    var minutes = Math.floor(hours * 60.0);
    if (minutes == 1) {
      timeDisp += minutes + ' minute';
    } else {
      timeDisp += minutes + ' minutes';
    }
  } else if (hours > 0) {
    if (hours == 1.0) {
      timeDisp += FormatFloat(hours, 2) + ' hour';
    } else {
      timeDisp += FormatFloat(hours, 2) + ' hours';
    }
  }
  return timeDisp;
}

// Find the divs containing the lists of tickets assigned to each
// user. The divs are identified by an id of the format, 'tickets-userId'.
var ticketLists = document.evaluate(
  '//div[contains(@id,"tickets-")]',
  document,
  null,
  XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
  null);

// Add up the hours listed for each ticket in each ticket list
var useDays = false;
for (var i=0; i < ticketLists.snapshotLength; i++) {
  var userHours = 0.0;

  // Tickets within the list are identified as links inside list item
  // nodes
  var tickets = document.evaluate(
    'ul/li/a',
    ticketLists.snapshotItem(i),
    null,
    XPathResult.ANY_TYPE,
    null);
  
  var thisTicket = tickets.iterateNext();
  while(thisTicket) {
    
    // Add hours listed in the ticket title to the user's total
    if (/(\d+(\.\d+)?) *h((ou)?r)?s?/i.test(thisTicket.innerHTML)) {
      userHours += parseFloat(RegExp.$1);
    }
    
    // Add minutes too, if they are there
    if (/(\d+(\.\d+)?) *m(in(ute)?)?s?/i.test(thisTicket.innerHTML)) {
      userHours += parseFloat(RegExp.$1) / 60.0;
    }
    
    // Also add days, converting 1 day to 8 hours
    if (/(\d+(\.\d+)?) *d(a?y)?s?/i.test(thisTicket.innerHTML)) {
      userHours += parseFloat(RegExp.$1) * 8.0;

      // If the user uses days in their estimates, we assume that they
      // want totals to be displayed using days as well.
      useDays = true;
    }
    
    thisTicket = tickets.iterateNext();
  }
  
  if (userHours > 0.0) {

    // Format time as desired. Use days as a measurement if the user
    // also used days somewhere.
    timeDisp = formatTime(userHours, useDays);

    // Find ticket list heading
    var heading = document.evaluate('h3', ticketLists.snapshotItem(i), null, XPathResult.ANY_TYPE, null);

    // Append user's total hours to heading text
    heading.iterateNext().innerHTML += ' - ' + timeDisp + ' left';
  }
}
