<?php
/**
 * @file
 * Template to render the node hours widget.
 */

if (!empty($preface)) { echo $preface; }
?>
<table class="harvard-library-hours-node-widget placeholder" data-nid="<?php echo $node->nid; ?>">
  <thead>
    <tr class="header">
      <td class="navigation" colspan="8">
        <span class="datepaginationleftprevcr">
           <a class="prev" href="#prev"><span>prev</span></a>
        </span>
        <div class="from_to_date">
          <span class="from_date"></span> -  
          <span class="to_date"></span>
        </div>
        <span class="datepaginationrightnextcr">
           <a class="next" href="#next"><span>next</span></a>
        </span>
      </td>
    </tr>
    <tr class="daynames">
      <td class="pre"></td>
      <td class="0 sun">Sun</td>
      <td class="1 mon">Mon</td>
      <td class="2 tue">Tue</td>
      <td class="3 wed">Wed</td>
      <td class="4 thu">Thu</td>
      <td class="5 fri">Fri</td>
      <td class="6 sat">Sat</td>
    </tr>
  </thead>
  <tbody class="references">
  <?php foreach ($referenced_nodes as $refnode): ?>
    <?php // This template is just a placeholder. The hours themselves 
          // will be loaded and added to this container via JavaScript. ?>
    <tr class="referenced-node" data-nid="<?php echo $refnode->nid; ?>">
      <td class="title"><?php echo $refnode->field_hours_display_name[LANGUAGE_NONE][0]['safe_value']; ?></td>
    </tr>

  <?php endforeach; ?>
  </tbody>
</table>