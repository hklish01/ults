<?php
/**
 * @file
 * Panels content type to diplay opening hours for a library.
 */

$plugin = array(
  'single' => TRUE,
  'title' => t('Library opening hours for node'),
  'description' => t('Displays the library’s opening hours, by looking at referenced hours nodes.'),
  'required context' => new ctools_context_required(t('Node'), 'node'),
  'category' => t('Widgets'),
  'defaults' => array('field_name' => ''),
);

/**
 * Output function for the content type.
 */
function harvard_library_hours_node_content_type_render($subtype, $conf, $panel_args, $context) {
  $block = new stdClass();

  // If we didn't get a node or block is not properly configured, return 
  // no content.
  if (empty($context->data) || empty($conf['field_name'])) {
    return $block;
  }

  $node = $context->data;

  // Also return nothing if the node does not have any operating hours 
  // nodes refernces.
  if (empty($node->{$conf['field_name']}[LANGUAGE_NONE])) {
    return $block;
  }

  $block->content = harvard_library_hours_prepare_render($node, $node->{$conf['field_name']}[LANGUAGE_NONE]);

  return $block;
}

/**
 * Content type settings form callback.
 *
 * Returns an edit form for the custom type.
 */
function harvard_library_hours_node_content_type_edit_form($form, &$form_state) {
  // The current configuration.
  $conf = $form_state['conf'];

  // Get all node reference fields.
  $field_names = array();
  foreach (field_info_fields() as $field_name => $field) {
    if ($field['type'] == 'node_reference') {
      $field_names[$field_name] = $field_name;
    }
  }

  // This and the next one are normal FAPI form making.
  $form['field_name'] = array(
    '#type' => 'radios',
    '#options' => $field_names,
    '#title' => t('Node reference field'),
    '#description' => t('Select the node reference field that should be used to fetch related opening hours.'),
    '#default_value' => $conf['field_name'],
  );

  return $form;
}

/**
 * Submit handler for content type settings form.
 */
function harvard_library_hours_node_content_type_edit_form_submit(&$form, &$form_state) {
  // For each part of the form defined in the 'defaults' array set when you
  // defined the content type, copy the value from the form into the array
  // of items to be saved. We don't ever want to use
  // $form_state['conf'] = $form_state['values'] because values contains
  // buttons, form id and other items we don't want stored. CTools will handle
  // the actual form submission.
  foreach (array_keys($form_state['plugin']['defaults']) as $key) {
    $form_state['conf'][$key] = $form_state['values'][$key];
  }
}

/**
 * Pane admin title callback.
 */
function harvard_library_hours_node_content_type_admin_title($subtype, $conf, $context) {
  return t('“@s” library opening hours', array('@s' => $context->identifier));
}