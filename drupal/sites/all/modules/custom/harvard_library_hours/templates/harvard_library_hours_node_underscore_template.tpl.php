<?php
/**
 * @file
 * Client side template for the Harvard library widgets.
 *
 * Is not really a template in Drupal-sense, mainly a container for the
 * markup necessary to render the opening hours interface.
 * KB added extra classes print_closed and x_closed for temporary responsive solution
 */

?>
<script type="text/template" id="hlh-widget-node-day-template">
  <td class="day <%= even_odd %>">
    <%= instances %>
  </td>
</script>

<script type="text/template" id="hlh-widget-node-instance-template">
  <div class="instance" data-instance-id="<%= id %>">
  <% if (closed) { %>
    <span class="closed"><?php echo t('Closed'); ?></span>
  <% } else { %>
    <span class="start_time" title="<?php echo t('Opening time'); ?>"><%= start_time %></span> –
    <span class="end_time" title="<?php echo t('Closing time'); ?>"><%= end_time %></span>
  <% } %>

  <% if (category) { %>
    <span class="category"><%= category %></span>
  <% } %>

  <% if (notice) { %>
    <span class="notice"><%= notice %></span>
  <% } %>
  </div>
</script>