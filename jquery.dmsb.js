// Just in case the browser doesn't support Array#filter()
// Source: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/filter
if (!Array.prototype.filter)
{
	Array.prototype.filter = function(fun /*, thisp */)
	{
		"use strict";
		
		if (this == null)
			throw new TypeError();
		
		var t = Object(this);
		var len = t.length >>> 0;
		if (typeof fun != "function")
			throw new TypeError();
		
		var res = [];
		var thisp = arguments[1];
		for (var i = 0; i < len; i++)
		{
			if (i in t)
			{
				var val = t[i]; // in case fun mutates this
				if (fun.call(thisp, val, i, t))
					res.push(val);
			}
		}
		
		return res;
	};
}
// End Array#filter()

/*
 * Dynamic Multi-Select Tool Plugin
 */
(function($) {
	
	if(!$.nu)
		$.nu = {};
	
	/**
	 * 
	 * Available Options:
	 * <ul>
	 *	<li>container - String/DOM Element - The containing element.</li>
	 *	<li>selectOptions - object - An associative array of the full list of options.</li>
	 *	<li>distinctOptions - bool (Default: true) - Define whether or not a single option may be selected more than once.</li>
	 * </ul>
	 * 
	 * @param {object} options
	 * @returns {object}
	 */
	$.nu.dynamicMultiSelectTool = function(options)
	{
		var obj = $.extend({}, dynamicMultiSelectTool, options);
		obj.init();
		
		return obj;
	};
	
	$.fn.arrayDiff = function(arr) {
		var out = [];
		
		if(this && $.isArray(this))
		{
			if(arr && $.isArray(arr))
			{
				$.grep(arr, function(val) {
					if($.inArray(val, this) == -1)
						out.push(val);
				});
			}
			else //Else return a clone
				out = this.slice();
		}
		
		return out;
	}
	
	$.fn.objectDiff = function(obj) {
		var out = {};
		
		if(this && $.isArray(this))
		{
			if(obj && $.isArray(obj))
			{
				$.each(obj, function(key, val) {
					if(!this[key] || this[key] != val)
						out[key] = val;
				});
			}
			else //Else return a clone
				out = $.extend({}, this);
		}
		
		return out;
	}
	
	// Private Scope -----------------------------------------------------------
	
	var dynamicMultiSelectTool = {
		/**
		 * Boolean flag representing whether (false) or not (true) a single option
		 * may be selected more than once.
		 */
		distinctOptions: true,
		
		/**
		 * Name and value used to denote a non-value within a select box.
		 */
		nonValue: {
			name: 'None',
			value: '-1'
		},
		
		/**
		 * The CSS class used to denote a select box as a member of this object.
		 */
		selectBoxClass: 'dmstSelect',
		
		/**
		 * The containing element. Typically a div.
		 */
		container: null,
		
		/**
		 * Associative array of key-value pairs which represent the available options.
		 */
		baseSelectOptions: {},
		
		/**
		 * The base select box element which will be cloned.
		 */
		baseSelect: null,
		
		/**
		 * Associative array of currently selected options. Each selection
		 * associates an element with a value.
		 */
		currentlySelected: {},
		
		/**
		 * Initialize the Dynamic Multi-Select object:
		 * - Generate the base select box
		 * - Clone the first select box
		 */
		init: function()
		{
			//Generate list of option elements from the given list of selectOptions
			var options = [
				$('<option>', {
					value: this.nonValue.value,
					text: this.nonValue.name
				})
			];
			
			$.each(this.baseSelectOptions, function(key, val) {
				var opt = $('<option>', {
					value: val,
					text: key
				});
				
				options.push(opt);
			});
			
			//Generate the select box which will be hidden and cloneable
			this.baseSelect = $('<select>', {
				class: this.selectBoxClass
			});
			
			var self = this;
			
			//Add onChange handler
			this.baseSelect.on('change', function() {
				if($(this).find('option:selected').val() != self.nonValue.value)
					self.cloneSelect();
			});
			
			//Append option elements
			$(this.baseSelect).append(options);
			
			//Clone the first select box
			this.cloneSelect();
		},
		
		/**
		 * Get all the valid selected values of all the container's select boxes.
		 * @returns {array}
		 */
		getSelectedValues: function()
		{
			var nonval = this.nonValue.value;
			var values = [];
			$(this.container).find('.' + this.selectBoxClass).each(function(i, el) {
				var val = $(el).find('option:selected').val();
				if(val && val != nonval)
					values.push(val);
			});
			
			return values;
		},
		
		getSelectedNameValuePairs: function()
		{
			var nonval = this.nonValue.value;
			var out = {};
			$(this.container).find('.' + this.selectBoxClass).each(function(i, el) {
				var selected = $(el).find('option:selected');
				var val = $(selected).val();
				if(val && val != nonval)
					out[$(selected).text()] = val;
			});
			
			return out;
		},
		
		/**
		 * Remove select boxes from the container which meet the following conditions:
		 * <ul>
		 *	<li>Current value equates to the defined non-value</li>
		 *	<li>If distinctOptions is true: All values have been selected</li>
		 *	<li>If distinctOptions is false: Is not the final select box in the container</li>
		 * </ul>
		 */
		prune: function()
		{
			var selector = '.' + this.selectBoxClass;
			if(!(this.distinctOptions && this.baseSelectOptions.length == this.getSelectedValues().length))
				selector += ':not(:lastchild)';
			selector += ' option[value="' + this.nonValue.value + '"]:selected';
			
			$(this.container).find(selector).each(function(i, opt) {
				$(opt).parent().remove();
			});
		},
		
		/**
		 * Clone the base select box and append the clone to the container element.
		 */
		cloneSelect: function()
		{
			var clone = $(this.baseSelect).clone(true, true);
			
			this.normalizeOptions(clone);
			
			$(this.container).append(clone);
		},
		
		/**
		 * 
		 */
		addOption: function(element, name, value) {
			var opt = $('<option>', {
				name: name,
				value: value
			});
			
			$(element).append(opt);
		},
		
		/**
		 * If distinctOptions is true, trim the options of all active select boxes
		 * such that only one of each value may be selected. Otherwise does nothing.
		 */
		normalizeAllOptions: function()
		{
			if(this.distinctOptions)
			{
				var selectedValues = this.getSelectedValues();
				var normalize = this.normalizeOptions;
				$(this.container).find('.' + this.selectBoxClass).each(function(i, el) {
					normalize(el, selectedValues);
				});
				
				this.prune();
			}
		},
		
		/**
		 * Remove selected options, and replace deselected options, within <code>element</code>.
		 * If <code>distinctOptions</code> is set to false, this method does nothing.
		 * @param {String/DOM Element} element The element containing the option elements to be modified.
		 * @param {Array} selectedValues (Optional) The array of values against which to compare.
		 * If not set, the array of currently selected values is used instead.
		 */
		normalizeOptions: function(element, selectedValues)
		{
			if(this.distinctOptions)
			{
				if(!selectedValues)
					selectedValues = this.getSelectedValues();
				
				//Remove newly selected options
				$(element).find('option').each(function(i, opt)
				{
					if($.inArray($(opt).val(), selectedValues) !== -1)
						$(opt).remove();
				});
				
				//Detect which options are not currently selected (i.e. the options which should be displayed in the select boxes)
				var shouldExistOptions = $(this.baseSelectOptions).objectDiff(this.getSelectedNameValuePairs());
				
				//Detect the current list of options in the defined element
				var currentOptions = {};
				$(element).find('option').each(function(i, opt) {
					currentOptions[$(opt).text()] = $(opt).val();
				});
				
				//Calculate which options need to be added
				var optionsToAdd = $(shouldExistOptions).objectDiff(currentOptions);
				
				//Add the options to the element
				$.each(optionsToAdd, function(key, val) {
					this.addOption(element, key, val);
				});
			}
		}
	};
})(jQuery);