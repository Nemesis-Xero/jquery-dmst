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

(function($) {
	/**
	 * Custom BRIC namespace
	 */
	$.bric = {};
	
	/**
	* Helper function for performing a JSON AJAX POST request.
	*/
	$.bric.jjax = function(uri, json, success, error, complete)
	{
		if(!json)
			json = {};
		if(!success)
			success = $.noop;
		if(!error)
			error = $.noop;
		if(!complete)
			complete = $.noop;
		
		$.ajax({
			url: uri,
			data: $.toJSON(json),
			type: 'POST',
			dataType: 'json',
			contentType: 'application/json'
		}).done(success)
			.fail(error)
			.complete(complete);
	}
	
	/**
	 * Returns a new array containing only those values which are not in both arrays.
	 * If one of the arguments is null or not an array, the other is returned.
	 * If both arguments are null or not arrays, an empty array is returned.
	 * 
	 * Test script:
		
		var arr1 = [];
		var arr2 = [];
		
		for(var i = 0; i < 50; i++)
		{
			if(i < 31)
				arr1.push(i);
			if(i > 19)
				arr2.push(i);
		}
		
		console.log('arr1:\n' + arr1);
		console.log('arr2:\n' + arr2);
		console.log('null, null:\nlength: ' + $.bric.arrayFilterInclusive(null, null).length);
		console.log('arr1, null:\n[' + $.bric.arrayFilterInclusive(arr1, null) + ']');
		console.log('null, arr2:\n[' + $.bric.arrayFilterInclusive(null, arr2) + ']');
		console.log('arr1, arr2:\n[' + $.bric.arrayFilterInclusive(arr1, arr2) + ']');
	 */
	$.bric.arrayFilterInclusive = function(arr1, arr2)
	{
		if(arr1 && $.isArray(arr1))
		{
			if(arr2 && $.isArray(arr2))
			{
				var new1 = arr1.filter(function(val, idx, obj) {
					return $.inArray(val, arr2) > -1;
				});
				
				return new1;
			}
			else
				return arr1;
		}
		else
			return arr2 && $.isArray(arr2) ? arr2 : [];
	}
	
	/**
	 * Get the array of values which are present in either <code>arr1</code>
	 * or <code>arr2</code>, but not present in both.
	 * 
	 * Test script:
		
		var arr1 = [];
		var arr2 = [];
		
		for(var i = 0; i < 50; i++)
		{
			if(i < 31)
				arr1.push(i);
			if(i > 19)
				arr2.push(i);
		}
		
		console.log('arr1:\n' + arr1);
		console.log('arr2:\n' + arr2);
		console.log('null, null:\nlength: ' + $.bric.arrayFilterExclusive(null, null).length);
		console.log('arr1, null:\n[' + $.bric.arrayFilterExclusive(arr1, null) + ']');
		console.log('arr1, arr2:\n[' + $.bric.arrayFilterExclusive(arr1, arr2) + ']');
		console.log('arr2, arr1:\n[' + $.bric.arrayFilterExclusive(arr2, arr1) + ']');
	 */
	$.bric.arrayFilterExclusive = function(arr1, arr2) {
		if(arr1 && $.isArray(arr1))
		{
			if(arr2 && $.isArray(arr2))
			{
				var ret = arr1.filter(function(val, idx, obj) {
					return $.inArray(val, arr2) < 0;
				});
				
				$(arr2.filter(function(val, idx, obj) {
					return $.inArray(val, arr1) < 0;
				})).each(function(i, v) {
					if($.inArray(v, ret) < 0)
						ret.push(v);
				});
				
				return ret;
			}
			else
				return arr1;
		}
		
		return [];
	}
	
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
	
	/**
	 * Bind event handlers to <code>this</code> element which add and remove the
	 * <code>downClass</code> css class name on mousedown and mouseup, respectively.
	 * If <code>downClass</code> is empty, it defaults to '<code>mouseDown</code>'.
	 * 
	 * Returns <code>$(this)</code> to allow for traditional jQuery chaining.
	 */
	$.fn.bindMouseDownClassHandlers = function(downClass) {
		if(!downClass)
			downClass = 'mouseDown';
		
		this.on({
			mousedown: function(event) {
				var self = $(this);
				onLeftClick(event, function(event) {
					self.addClass(event.data.downClass);
				});
			},
			mouseup: function(event) {
				var self = $(this);
				onLeftClick(event, function(event) {
					self.removeClass(event.data.downClass);
				});
			}
		},
		{ downClass: downClass });
		
		return $(this);
	}
	
	/**
	 * Give this element functionality commonly associated with being a form.
	 */
	$.fn.formenize = function(submitFunction, validationFunction) {
		if(submitFunction && typeof submitFunction === 'function')
		{
			this.on('keypress', function(event) {
				if(event.which === 13)
				{
					if(!validationFunction || (typeof validationFunction === 'function' && validationFunction()))
						submitFunction();
				}
			});
		}
	}
	
	/**
	 * Find form fields by name under <code>this</code> element. If no <code>tagName</code>
	 * is specified, searches for <code>input</code>, <code>select</code>, and
	 * <code>textarea</code> in that order.
	 */
	$.fn.findFormField = function(fieldName, tagName) {
		var ret = [];
		if(!tagName)
			ret = this.find('input[name=' + fieldName + '],select[name=' + fieldName + '],textarea[name=' + fieldName + ']')
		else
			ret = this.find(tagName + '[name=' + fieldName + ']');
		
		return ret;
	}
	
	$.fn.findLabel = function(fieldName) {
		return this.find('label[for=' + fieldName + ']');
	}
	
	/**
	 * Reset all input, select, and textarea elements such that their value is empty.
	 */
	$.fn.clearForm = function() {
		this.find('select').val(this.find('select option:first').attr('value'));
		this.find('input[type=text], textarea, .clearableField').val('');
		this.find('input[type=checkbox], input[type=radio]').filter(':checked').removeAttr('checked');
		this.find('label.error').removeClass('error');
	}
	
	$.fn.markErrors = function(fieldNames) {
		if(fieldNames)
		{
			if(!$.isArray(fieldNames))
				fieldNames = [fieldNames];
			
			var form = this;
			form.find('label.error').removeClass('error');
			$.each(fieldNames, function(i, name) {
				form.findLabel(name).addClass('error');
				/*
				var fieldName = name.substring(name.lastIndexOf('.') + 1);
				form.findLabel(fieldName).addClass('error');
				*/
			});
		}
	}
	
	//TODO: Something seems to go wrong when run multiple times on the same json object with varying sets of fieldNames. i.e. previous implementation of labelTemplateItem.js#validate()
	/**
	 * For the given JSON object, detect if there are any empty fields where empty
	 * is defined as being empty string, null, or undefined. Numeric zero 0 is allowed
	 * by the identity operator. If no empty fields are found, returns FALSE. Otherwise
	 * returns the array of field names which are empty.
	 * 
	 * This function will recurse through child JSON objects.
	 */
	$.fn.detectEmptyJsonFields = function(fieldNames) {
		var emptyFields = [];
		if(typeof this === 'object')
		{
			if(!fieldNames || !$.isArray(fieldNames) || fieldNames.length < 1)
			{
				//this is the jQuery-wrapped JSON object
				$.each(this, function() {
					//this is now the plain JSON object
					$.each(this, function(key, val) {
						//Recursion for child JSON objects
						if(val)
						{
							if($.isArray(val) && val.length < 1)
								emptyFields.push(key);
							else if($.isPlainObject(val))
							{
								var tempEmptyFields = $(val).detectEmptyJsonFields();
								if(tempEmptyFields)
								{
									var updatedEmptyFieldNames = [];
									$.each(tempEmptyFields, function(i, field) {
										updatedEmptyFieldNames.push(key + '.' + field);
									});
									emptyFields = $.merge(emptyFields, updatedEmptyFieldNames);
								}
							}
						}
						else if(val !== 0)
							emptyFields.push(key);
					});
				});
			}
			else
			{
				//this is the jQuery-wrapped JSON object
				$.each(this, function() {
					//this is now the plain JSON object
					$.each(this, function(key, val) {
						if($.inArray(key, fieldNames) > -1)
						{
							//Recursion for child JSON objects
							if(val)
							{
								if($.isArray(val) && val.length < 1)
									emptyFields.push(key);
								else if($.isPlainObject(val))
								{
									var tempEmptyFields = $(val).detectEmptyJsonFields(fieldNames);
									if(tempEmptyFields)
									{
										var updatedEmptyFieldNames = [];
										$.each(tempEmptyFields, function(i, field) {
											updatedEmptyFieldNames.push(key + '.' + field);
										});
										emptyFields = $.merge(emptyFields, updatedEmptyFieldNames);
									}
								}
							}
							else if(val !== 0)
								emptyFields.push(key);
						}
					});
				});
			}
		}
		return emptyFields.length > 0 ? emptyFields : false;
	}
})(jQuery);