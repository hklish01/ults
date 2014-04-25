/**
 * @file
 * JavaScript code for presenting Harvard library opening hours.
 */

(function ($) {
  "use strict";
  
  // Transform timestamps to U.S.-style (with am/pm).
  var usTimeFormatter = function (time) {
    var parts = time.split(':');
    var suffix = 'a<span class="ampm">m</span>';

    // Converts hours into an integer. This has the intended side effect
    // of removing the leading zero.
    parts[0] = parseInt(parts[0], 10);

    // Noon and thereafter is considered 'pm';
    if (parts[0] > 11) {
      suffix = 'p<span class="ampm">m</span>';

      // If not noon, remove the first 12 hours from the value.
      if (parts[0] !== 12) {
        parts[0] = parts[0] - 12;
      }
    }

    // If parts = 0, add 12 (for midnight) -- CB 20130730
    if (parts[0] == 0) {
      parts[0] = parts[0] + 12;
    }

    // Don't show :00 when its right on hour.
    if (parts[1] === '00') {
      parts.pop(); // Remove the last value from the array.
    }



    return parts.join(':') + suffix;
  };

  // View prototype to manage each week presentation’s state.
  Drupal.OpeningHours.HarvardLibraryNodeView = function (options) {
    var self = this;

    self.constructor = function () {
      self.el = $(options.el);
      self.nid = options.nid;
      self.hoursNids = [];
      self.hoursElems = {};
      self.options = options;
      self.week = options.week;

      // Set up binding for navigation.
      self.el.find('.prev').click(self.goToPreviousWeek);
      self.el.find('.next').click(self.goToNextWeek);

      // Find the nids of referenced nodes belonging to this 
      self.el.find('.referenced-node').each(function () {
        var $refNode = $(this);
        var refNid = parseInt($refNode.data('nid'), 10);

        if (refNid) {
          self.hoursNids.push(refNid);
          self.hoursElems[refNid] = $refNode;
        }
      });

      return self;
    };

    // Get data for the current week.
    self.getData = function (callback) {
      var from_date = self.week.dates[0].getISODate(),
          to_date = self.week.dates[6].getISODate();

      // nids for the nodes to load data for.
      var loadDataNids = [];

      // Check that we have data for all our hours nodes.
      _.each(self.hoursNids, function (nid) {
        if (!(Drupal.OpeningHours.dataStore[self.nid] &&
              _.isArray(Drupal.OpeningHours.dataStore[self.nid][from_date]) &&
              _.isArray(Drupal.OpeningHours.dataStore[self.nid][to_date]))) {
          loadDataNids.push(nid);
        }
      });

      // If we need to load data, get to it.
      if (loadDataNids.length > 0) {
        Drupal.OpeningHours.getInstances({
          from_date: from_date,
          nids: loadDataNids,
          to_date: to_date,
          week: self.week,
          success: callback
        });
      }
      // If not, call the callback immediately and get on with it.
      else {
        callback();
      }

      return self;
    };

    self.goToPreviousWeek = function (event) {
      var date = new Date(self.week.dates[0].getTime());

      if ($(this).hasClass('disabled')) {
        return false;
      }

      // Subtract seven days to get the first date of the previous week,
      // and use the router to navigate back to that.
      date.setDate(date.getDate() - 7);

      // Clear the current day highlight, since it's only relevant in
      // the current week. (Unnecessary since Prev never goes before current week --TD)
      // self.highlightCurrentDayClear();

      // Change the date of the view and re-render it.
      self.week = new Drupal.OpeningHours.Week(date.getISODate(), self.week.firstDayOfWeek);
      self.render();

      // Added by TD 02-03-14
      if (self.week.isCurrentWeek()) {
           //KB took out TD's code and added call to highlightCurrentDay()
          self.highlightCurrentDay();
      }

      event.preventDefault();
    };

    self.goToNextWeek = function (event) {
      var date = new Date(self.week.dates[6].getTime());

      // Add one day to the last date of the previous week,
      // and use the router to navigate back to that.
      date.setDate(date.getDate() + 1);

      // Clear the current day highlight, since it's only relevant in
      // the current week.
      self.highlightCurrentDayClear();

      // Change the date of the view and re-render it.
      self.week = new Drupal.OpeningHours.Week(date.getISODate(), self.week.firstDayOfWeek);
      self.render();

      event.preventDefault();
    };

    // Highlight the current day by adding a class to it.
    self.highlightCurrentDay = function () {
      var day=new Date().getDay();
      
    self.el.find('.daynames .'+day).addClass('highlight_today');
    };

    // Clear the day highlight, if present.
    self.highlightCurrentDayClear = function () {
      self.el.find('.daynames .highlight_today').removeClass('highlight_today');
    };
    
    // Render the week as soon as data is available.
    self.render = function () {
      // Fade out the element while we're waiting on data.  
      // CB commented out fadeOut fast to prevent flow from changing (choppiness effect) -- 20130806
      //self.el.fadeOut('fast');
        // Wait till we have data available before rendering.
      self.getData(function (data) {
        // Fill in the header.
        self.el.find('.from_date').text($.datepicker.formatDate('MM d', self.week.dates[0]));
        self.el.find('.to_date').text($.datepicker.formatDate('MM d', self.week.dates[6]));
        // Use the middle day of the week to get the week number, to
        // dodge off-by-one-errors in older versions of jQuery UI.
        self.el.find('.week_num').text($.datepicker.iso8601Week(self.week.dates[3]));

        // If we're at the current week, disable the back arrow.
        if (self.week.isCurrentWeek()) {
          self.el.find('.prev').addClass('disabled');
        } else {
          self.el.find('.prev').removeClass('disabled');
        }

        // Render each hours node.
        self.renderHoursNodes();

        // Fade back in when we're done rendering.
        self.el.fadeIn('fast');

        self.el.removeClass('placeholder');
      });

      return self;
    };

    self.renderHoursNodes = function () {
      _.each(self.hoursNids, function (nid) {
        var daysContainer = self.hoursElems[nid];

        // Clear out previously rendered days.
        daysContainer.find('.day').remove();

        // Helper variables to add even/odd classes to rows.
        var flip = { 'even' : 'odd', 'odd' : 'even' };
        var even_odd = 'even';

        // Render each day.
        _.each(self.week.dates, function (date) {
          var dateStr = date.getISODate(),
              renderedInstances = [];

          // Render each instance for this day.
          _.each(Drupal.OpeningHours.dataStore[nid][dateStr], function (instance) {
            var category = '';

            if (instance.category_tid && Drupal.settings.OpeningHours.categories) {
              category = Drupal.settings.OpeningHours.categories[instance.category_tid];
            }

            renderedInstances.push(self.options.instanceTemplate({
              id: instance.instance_id,
              start_time: usTimeFormatter(instance.start_time),
              end_time: usTimeFormatter(instance.end_time),
              closed: (instance.start_time === '00:00' && instance.end_time === '00:00'),
              category: category,
              notice: instance.notice || ''
            }));
          });

          // Render the day container with the instances in it (or a
          // simple "closed" notice.
          daysContainer.append(self.options.dayTemplate({
            name: $.datepicker.formatDate('DD', date),
            instances: renderedInstances.join("") || Drupal.t('<span class="closed">Closed</span>'),
            even_odd: even_odd
          }));

          // Flip the even/odd value every time an instance is added.
          even_odd = flip[even_odd];
        });
 
        // Convert all notices to Tipsy tooltips.
        daysContainer.find('.instance').each(function () {
          var $instance = $(this),
              notices = [];

          // Get the text of all notices, both categories and free-form
          // text field.
          $instance.find('.category,.notice').each(function () {
            // Save the note for later.
            notices.push(this.textContent);

            // Hide the original text.
            $(this).hide();
          });

          if (notices.length > 0) {
            // Replace the notice with a star, and add a class for
            // styling that.
            $('<span class="notice-star">')
              .text('*')
              .appendTo($instance);


            $instance.attr('title', notices.join(' – ')).tipsy({
              fade: true
            });
          }
        });
      });
    };

    return self.constructor();
  };


  // When the document is ready, set up our app.
  $(function () {
    var curDate = new Date().getISODate(),
        dayTemplate = _.template($('#hlh-widget-node-day-template').html()),
        instanceTemplate = _.template($('#hlh-widget-node-instance-template').html()),
        hoursNids = [],
        views = [],
        week = new Drupal.OpeningHours.Week(curDate, Drupal.settings.OpeningHours.firstDayOfWeek);

    // Find and configure each widget.
    $('.harvard-library-hours-node-widget').each(function () {
      var $widget = $(this);
      var nid = parseInt($widget.data('nid'), 10);

      // Don't render an opening hours presentation if we don't have a
      // node ID.
      if (!nid) {
        return;
      }

      // Generate a view for each widget.
      var view = new Drupal.OpeningHours.HarvardLibraryNodeView({
        date: curDate,
        dayTemplate: dayTemplate,
        el: this,
        firstDayOfWeek: Drupal.settings.OpeningHours.firstDayOfWeek,
        instanceTemplate: instanceTemplate,
        nid: nid,
        week: week
      });

      // Add the view to our list, but do not render it yet, as we want
      // to fetch data for all of them in bulk.
      views.push(view);

      // Add our hoursNids to the array.
      hoursNids = _.union(hoursNids, view.hoursNids);

      // Save the view instance for later reference.
      $widget.data('weekPresentationViewInstance', view);
    });

    if (hoursNids.length > 0) {
      // Now we have generated our presentationViews, we want to get data
      // for all of them, and render them.
      // This extra step is necesarry to avoid each view making its own
      // AJAX-request for data, which would be harmful when viewing a list
      // of libraries.
      Drupal.OpeningHours.getInstances({
        nids: hoursNids,
        week: week,
        success: function () {
          _.invoke(views, 'highlightCurrentDay');
          _.invoke(views, 'render');

          // Let anyone who cares know that we're done loading and ready for business.
          $(window).trigger('OpeningHoursLoaded');
        }
      });
    }
  });
}(jQuery));