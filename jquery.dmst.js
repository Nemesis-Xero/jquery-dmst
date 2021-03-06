/*
 * Dynamic Multi-Select Tool Plugin
 */
(function($) {
	/**
	 * 
	 * @param {object} obj1
	 * @param {object} obj2
	 * @returns {object}
	 */
	function objectDiff(obj1, obj2)
	{
		var out = {};
		
		if(obj1 && $.type(obj1) == 'object')
		{
			if(obj2 && $.type(obj2) == 'object')
			{
				$.each(obj1, function(key, val) {
					if(!obj2[key])
						out[key] = val;
				});
				
				$.each(obj2, function(key, val) {
					if(!obj1[key])
						out[key] = val;
				});
			}
			else
				out = $.extend({}, obj1);
		}
		
		return out;
	};
	
	if(!$.nu)
		$.nu = {};
	
	//jQuery integration enabled by default but can be disabled via this property
	if($.nu.dmstJqueryIntegration !== false)
		$.nu.dmstJqueryIntegration = true;
	
	if($.nu.dmstJqueryIntegration)
	{
		$.nu.dmstDataName = 'dmst-instance';
		
		$.fn.dmst = function(action, options)
		{
			if(!action)
				action = '';
			
			if(!options)
				options = {};
			
			var instance = $(this).data($.nu.dmstDataName);
			
			switch(action)
			{
				case 'get-selected':
					if(instance)
					{
						var temp = instance.getSelectedValues();
						return temp;
					}
					return null;
				case 'get-selected-pairs':
					if(instance)
					{
						return instance.getSelectedNameValuePairs();
					}
					return null;
				case 'set-selected':
					if(instance && options.values)
					{
						instance.setSelectedValues(options.values);
					}
					break;
				case 'reset':
					if(instance)
					{
						instance.reset();
					}
					break;
				//Default action is to create a new instance
				case 'create':
				default:
					//This 
					var overrides = {
						container: this
					};
					
					var opts = $.extend(options, overrides);
					
					//Create and initialize the dmst
					var obj = $.nu.dmst(opts);
					
					$(this).data($.nu.dmstDataName, obj);
			}
		};
	}
	
	/**
	 * 
	 * Available Options:
	 * <ul>
	 *	<li>container - String/DOM Element - The containing element.</li>
	 *	<li>nonValue - object - Define the <code>name</code> and <code>value</code> of the non-value option.</li>
	 *	<li>selectOptions - object - An associative array of the full list of options.</li>
	 *	<li>distinctOptions - bool (Default: true) - Define whether or not a single option may be selected more than once.</li>
	 *	<li>customSelectBoxClass - String - Define one or more custom CSS classes to be applied to the select boxes.</li>
	 *	<li>funcLoadOptions - Function - Define a function to load in the available options for the base select box.</li>
	 * </ul>
	 * 
	 * @param {object} options
	 * @returns {object}
	 */
	$.nu.dmst = function(options)
	{
		var obj = $.extend({}, dynamicMultiSelectTool, options);
		obj.init();
		
		return obj;
	};
	
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
			defaultSelectionName: 'Please Choose',
			removeSelectionName: 'Remove',
			name: 'None',
			value: '-1'
		},
		
		/**
		 * The CSS class used to denote a select box as a member of this object.
		 */
		selectBoxClass: 'dmst-select',
		
		/**
		 * A string of one or more CSS classes used to allow custom styling of the
		 * select boxes.
		 */
		customSelectBoxClass: '',
		
		/**
		 * The containing element.
		 */
		container: null,
		
		/**
		 * Associative array of key-value pairs which represent the available options.
		 */
		baseSelectOptions: null,
		
		/**
		 * The base select box element which will be cloned.
		 * Generated in the init method.
		 */
		baseSelect: null,
		
		/**
		 * Optional function to call to load the options for the base select box.
		 * Takes one parameter, a reference to <code>this</code> object, to inject
		 * the options directly into <code>baseSelectOptions</code>.
		 */
		funcLoadOptions: null,
		
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
			
			if(this.funcLoadOptions)
			{
				this.funcLoadOptions(this);
			}
			
			if(this.baseSelectOptions)
			{
				$.each(this.baseSelectOptions, function(key, val) {
					var opt = $('<option>', {
						value: val,
						text: key
					});

					options.push(opt);
				});
			}
			
			//Generate the select box which will be hidden and cloneable
			this.baseSelect = $('<select>', {
				class: this.selectBoxClass + ' ' + this.customSelectBoxClass
			});
			
			//Append option elements
			$(this.baseSelect).append(options);
			
			//Self-reference for use within the event handler.
			var self = this;
			//Add onChange handler
			this.baseSelect.on({
				change: function() {
					var prev = $(this).data('last-chosen-value');
					
					//Clean up select boxes first
					self.prune();
					
					//Then, if this is the first change, append a new clone
					if(!prev)
						self.cloneSelect();
					
					$(this).data('last-chosen-value', $(this).find('option:selected').val());
				}
			});
			
			//Clone the first select box
			this.cloneSelect();
		},
		
		/**
		 * Get all the valid selected values of all the container's select boxes.
		 * @returns {array}
		 */
		getSelectedValues: function()
		{
			var self = this;
			var nonval = this.nonValue.value;
			var values = [];
			$(this.container).find('.' + this.selectBoxClass).each(function(i, el) {
				var val = self.getSelectedValue(el);
				if(val && val != nonval)
					values.push(val);
			});
			
			return values;
		},
		
		/**
		 * Get all the valid selected name-value pairs of all the container's select boxes.
		 * @returns {object}
		 */
		getSelectedNameValuePairs: function()
		{
			var self = this;
			var out = {};
			this.getAllSelectBoxes().each(function(i, el) {
				var selected = self.getSelectedOption(el);
				var val = $(selected).val();
				if(val && val != self.nonValue.value)
					out[$(selected).text()] = val;
			});
			
			return out;
		},
		
		/**
		 * 
		 * @param {array} arr
		 */
		setSelectedValues: function(arr)
		{
			this.reset();
			
			var self = this;
			$.each(arr, function(i, val) {
				self.selectNewValue(val);
			});
			
			this.prune();
		},
		
		/**
		 * Clear all selections and prune down to 1 select box.
		 */
		reset: function()
		{
			this.getAllSelectBoxes().val(this.nonValue.value);
			this.prune();
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
				selector += ':not(:last-child)';
			selector += ' option[value="' + this.nonValue.value + '"]:selected';
			
			$(this.container).find(selector).each(function(i, opt) {
				$(opt).parent().remove();
			});
			
			if(this.distinctOptions)
			{
				var self = this;
				this.getAllSelectBoxes().each(function(i, el) {
					self.normalizeOptions(el);
					self.sortOptionsByValue(el);
				});
			}
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
			if($(element).find('option[value="' + value + '"]').length < 1)
			{
				var opt = $('<option>', {
					value: value,
					text: name
				});
				
				$(element).append(opt);
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
				
				//Remove newly selected options from the other select boxes
				this.removeOptionsFromElement(element, selectedValues);
				
				//Detect which options are not currently selected (i.e. the options which should be displayed in the select boxes)
				var shouldExistOptions = objectDiff(this.baseSelectOptions, this.getSelectedNameValuePairs());
				
				//Detect the current list of options in the defined element
				var currentOptions = {};
				this.getAllOptions(element).each(function(i, opt) {
					currentOptions[$(opt).text()] = $(opt).val();
				});
				
				//Calculate which options need to be added
				var optionsToAdd = objectDiff(shouldExistOptions, currentOptions);
				//Remove the non-value option from optionsToAdd as this will always be present
				if(optionsToAdd[this.nonValue.name])
					delete optionsToAdd[this.nonValue.name];
				
				var self = this;
				//Add the options to the element
				$.each(optionsToAdd, function(key, val) {
					self.addOption(element, key, val);
				});
				
				this.sortOptionsByValue(element);
			}
		},
		
		//Abstractions
		removeOptionsFromElement: function(element, optionsToKeep)
		{
			this.getUnselectedOptions(element).each(function(i, opt)
			{
				if($.inArray($(opt).val(), optionsToKeep) != -1)
					$(opt).remove();
			});
		},
		
		selectNewValue: function(value)
		{
			var box = this.getLastSelectBox();
			box.val(value);
			if(box.val() != this.nonValue.value)
				this.cloneSelect();
		},
				
		sortOptionsByText: function(element)
		{
			var opts = this.getAllOptions(element).sort(function(a, b) {
				return $(a).text().toLowerCase().localeCompare($(b).text().toLowerCase());
			});
			
			this.getUnselectedOptions(element).remove();
			$(element).append(opts);
		},
		
		sortOptionsByValue: function(element)
		{
			var opts = this.getAllOptions(element).sort(function(a, b) {
				return $(a).val() > $(b).val();
			});
			
			this.getUnselectedOptions(element).remove();
			$(element).append(opts);
		},
		
		//Helper methods
		getAllSelectBoxes: function()
		{
			return $(this.container).find('.' + this.selectBoxClass);
		},
		
		getLastSelectBox: function()
		{
			return this.getAllSelectBoxes().filter(':last-child');
		},
		
		getSelectedOption: function(element)
		{
			return $(element).find('option:selected');
		},
		
		getAllOptions: function(element)
		{
			return $(element).find('option');
		},
		
		getUnselectedOptions: function(element)
		{
			return $(element).find('option:not(:selected)');
		},
		
		getSelectedValue: function(element)
		{
			return $(element).find('option:selected').val();
		}
	};
})(jQuery);
