(function(angular) {
    var module = angular.module('framework.directives.UI');

    module.directive('fieldFor', fieldForDirective);
    module.directive('formFor', formForDirective);
    module.directive('modelFilter', modelFilter);
    module.directive('dtPicker', dtPicker);
    module.directive('timePicker', timePicker);
    module.filter('propSearch', propertySearchFilter);

    formForDirective.$inject = ['Model'];


    function formForDirective(Model) {
        return {
            restrict: 'A',
            scope: true,
            transclude: true,
            template: function(element, attrs) {
                return '<ng-form name="formFor.form" class="transclude-target" autocomplete="off" novalidate></ng-form>';
            },
            link: function(scope, element, attrs, ctrls, transcludeFn) {
                scope.formFor = (scope.formFor || {});
                scope.formFor.target = scope.$eval(attrs.formFor);
                scope.formFor.schema = (attrs.schema) ? Model[attrs.schema].$schema : scope.target.$$schema;
                scope.formFor.mode = 'EDIT';
                scope.formFor.opened = {};

                scope.preventDefault = function($event) {
                }

                scope.$watch(function() {
                    return scope.$eval(attrs.formFor);
                }, function(newvalue) {
                    scope.formFor.target = newvalue;
                }, false);

                if (attrs.mode) {
                    scope.formFor.mode = attrs.mode;
                    attrs.$observe('mode', function(newvalue) {
                        scope.formFor.mode = newvalue;
                    });
                }

                transcludeFn(scope, function(clone, scope) {
                    element.children('.transclude-target').append(clone);
                });
            }
        }
    };

    fieldForDirective.$inject = ['Model', 'Localisation'];

    function fieldForDirective(Model, Localisation) {
        var defaults = {
            inputType: 'text',
            required: false,
            selectTheme: 'selectize',
            selectSelectedTemplate: '<div class="select-text"><img class="img-responsive img-circle" ng-if="$select.selected.ImageUrl" ng-src="{{$select.selected.ImageUrl}}" />{{$select.selected.Name}}</div>',
            selectOptionTemplate: '<div class="select-text-option"><img class="img-responsive img-circle" ng-src="{{::option.ImageUrl}}" ng-if="::option.ImageUrl" /><div ng-bind-html="option.Name | highlight: $select.search"></div><small class="text-muted" ng-show="::option.Description">{{::option.Description}}</small></div>'
        };


        return {
            restrict: 'A',
            scope: true,
            template: function(element, attrs) {
                var formParent = element.closest('[form-for]'),
                    subformParent = element.closest('[sub-form-for]'),
                    schemaName = ((subformParent.length) ? subformParent : formParent).attr('schema'),
                    ctor = Model[schemaName],
                    schema = ctor && ctor.$schema,
                    fieldDef = schema && schema[attrs.fieldFor],
                    subForm = subformParent.attr('sub-form-for') || '';
                if (!fieldDef) {
                    return;
                }

                var inputConfig = angular.extend({
                    display: attrs.fieldFor,
                    inputType: 'text',
                    tabIndex: attrs.tabIndex
                }, defaults, fieldDef, fieldDef.input, attrs);

                //need to fetch these.
                var labelText = attrs.display || attrs.fieldFor,
                    fieldName = attrs.fieldFor,
                    openName = attrs.openName || attrs.fieldFor,
                    selectFrom = attrs.selectFrom,
                    selectFilter = attrs.selectFilter;

                var template = '' +
                    '<div class="form-group" ng-click="groupClicked(\'input\')" style="position:relative">' +
                    '<label class="control-label" for="' + subForm + fieldName + 'Input">' + inputConfig.display + '</label>' +
                    '<div ng-if="formFor.mode === \'VIEW\'">';

                if (selectFrom) {
                    template += '' +
                        '<ui-select tabindex = "' + inputConfig.tabIndex + '" ng-model="formFor.target.' + ((subForm) ? (subForm + '.') : '') + fieldName + '" name="' + subForm + fieldName + 'Input" theme="' + inputConfig.selectTheme + '" ng-disabled="true" ng-required="' + inputConfig.required + '">' +
                        '<ui-select-match allow-clear="true" placeholder="' + (inputConfig.placeholder || 'Select..') + '">' + inputConfig.selectSelectedTemplate + '</ui-select-match>' +
                        '<ui-select-choices repeat="option.Id as option in ' + selectFrom + ' | filter: $select.search">' +
                        inputConfig.selectOptionTemplate +
                        '</ui-select-choices>' +
                        '</ui-select>';
                } else {
                    if (inputConfig.currency) {
                        template += '<p class="form-control-static"  ng-bind="formFor.target.' + ((subForm) ? (subForm + '.') : '') + (inputConfig.displayField || fieldName) + ("| Convert | Format ") + '"></p>';
                    } else if (inputConfig.prepend) {
                        template += '<p class="form-control-static">' + (inputConfig.prepend.text || '') + '{{formFor.target.' + ((subForm) ? (subForm + '.') : '') + (inputConfig.displayField || fieldName) + (inputConfig.displayFilters || '') + '}}</p>'; //
                    } else if (inputConfig.nullDisplay) {
                        template += '<p class="form-control-static"  ng-bind="(formFor.target.' + ((subForm) ? (subForm + '.') : '') + (inputConfig.displayField || fieldName) + ") ? (" + 'formFor.target.' + ((subForm) ? (subForm + '.') : '') + (inputConfig.displayField || fieldName) + (inputConfig.displayFilters || '') + ") : ('" + inputConfig.nullDisplay + "')\"></p>"; //
                    } else if (inputConfig.inputType == 'password') {
                        template += '<p class="form-control-static"><small class="text-muted">&lt;Hidden&gt;</small></p>';
                    } else if (inputConfig.type == 'Phone') {
                        template += '<a href="{{\'tel:\'+formFor.target.' + ((subForm) ? (subForm + '.') : '') + (inputConfig.displayField || fieldName) + '}}" ng-if="formFor.target.' + ((subForm) ? (subForm + '.') : '') + (inputConfig.displayField || fieldName) + '" class="form-control-static" ng-bind="formFor.target.' + ((subForm) ? (subForm + '.') : '') + (inputConfig.displayField || fieldName) + (inputConfig.displayFilters || '') + '"></a>';
                        template += '<small class="text-muted" ng-if="!formFor.target.' + ((subForm) ? (subForm + '.') : '') + (inputConfig.displayField || fieldName) + ' && ' + !inputConfig.emptyval + '" class="form-control-static">-</small>'; ////
                    } else if (inputConfig.type === Boolean) {
                        template += '<div class="">';
                        template += buildElement('input', {
                                class: 'check',
                                type: 'checkbox',
                                tabindex: (inputConfig.tabIndex) ? inputConfig.tabIndex : '',
                                name: subForm + fieldName + 'Check',
                                id: subForm + fieldName + 'Check',
                                ngModel: 'formFor.target.' + ((subForm) ? (subForm + '.') : '') + fieldName,
                                ngRequired: inputConfig.required,
                                ngDisabled: true,
                            }) +
                            '<label class="check-label" for="' + subForm + fieldName + 'Check"></label></div><br class="clearfix" />';
                    } else {
                        template += '<p ng-if="formFor.target.' + ((subForm) ? (subForm + '.') : '') + (inputConfig.displayField || fieldName) + '" class="form-control-static"  ng-bind="formFor.target.' + ((subForm) ? (subForm + '.') : '') + (inputConfig.displayField || fieldName) + (inputConfig.displayFilters || '') + '"></p>'; //
                        template += '<small class="text-muted" ng-if="!formFor.target.' + ((subForm) ? (subForm + '.') : '') + (inputConfig.displayField || fieldName) + ' && ' + !inputConfig.emptyval + '" class="form-control-static">-</small>'; ////
                        template += '<small class="text-muted" ng-if="!formFor.target.' + ((subForm) ? (subForm + '.') : '') + (inputConfig.displayField || fieldName) + ' && ' + !!inputConfig.emptyval + '" class="form-control-static">' + inputConfig.emptyval + '</small>'; ////
                    }
                    //ng-if="formFor.target.' + ((subForm) ? (subForm + '.') : '') + (inputConfig.displayField || fieldName) + (inputConfig.displayFilters || '') + '"
                    //template += '<p class="form-control-static text-muted"  style="white-space:pre;" ng-if="!(formFor.target.' + ((subForm) ? (subForm + '.') : '') + (inputConfig.displayField || fieldName) + (inputConfig.displayFilters || '') + ')">&lt;blank&gt;</p>';
                }

                template += '</div>' +
                    '<div class="form-edit" ng-if="formFor.mode === \'EDIT\' || formFor.mode === \'CREATE\'">';
                if (inputConfig.textarea) {
                    template += buildElement('textarea', {
                        class: 'form-control',
                        rows: inputConfig.textarea,
                        name: subForm + fieldName + 'Input',
                        tabindex: (inputConfig.tabIndex) ? inputConfig.tabIndex : '',
                        ngModel: 'formFor.target.' + ((subForm) ? (subForm + '.') : '') + fieldName,
                        ngRequired: inputConfig.required,
                        ngDisabled: angular.isDefined(inputConfig.editable) && (!inputConfig.editable || inputConfig.editable == 'false'),
                        style: 'height:initial;'
                    });
                } else if (inputConfig.enum) {
                    debugger;
                    template += '<select tabindex="' + (inputConfig.tabIndex || '') + '" class="form-control" ng-model="formFor.target.' + ((subForm) ? (subForm + '.') : '') + fieldName + '" name="' + subForm + fieldName + 'Input" ng-disabled="' + (angular.isDefined(inputConfig.editable) && !inputConfig.editable) + '" ng-required="' + inputConfig.required + '">';
                    if (typeof inputConfig.enum[0] === 'string') {
                        angular.forEach(inputConfig.enum, function(value) {
                            template += '<option value="' + value + '">' + value + '</option>';
                        });
                    } else {
                        angular.forEach(inputConfig.enum, function(value) {
                            template += '<option value="' + value.value + '">' + value.display + '</option>';
                        });
                    }
                    template += '</select>';
                } else if (selectFrom) {
                    template += '' +
                        '<ui-select tabindex = "' + inputConfig.tabIndex + '" class="edit" ng-model="formFor.target.' + ((subForm) ? (subForm + '.') : '') + fieldName + '" name="' + subForm + fieldName + 'Input" theme="' + inputConfig.selectTheme + '" ng-disabled="' + ((angular.isDefined(inputConfig.editable) && (!inputConfig.editable || inputConfig.editable == 'false')) || inputConfig.ngDisabled || false) + '" ng-required="' + inputConfig.required + '">' +
                        '<ui-select-match allow-clear="true" placeholder="' + (inputConfig.placeholder || 'Select..') + '">' + inputConfig.selectSelectedTemplate + '</ui-select-match>' +
                        '<ui-select-choices repeat="option.Id as option in ' + selectFrom + (selectFilter ? (' | filter:' + selectFilter) : '') + ' | filter: $select.search">' +
                        inputConfig.selectOptionTemplate +
                        '</ui-select-choices>' +
                        '</ui-select>';
                    if (!inputConfig.required && !(angular.isDefined(inputConfig.editable) && (!inputConfig.editable || inputConfig.editable == 'false'))) {
                        template += '<a ng-click="formFor.target.' + ((subForm) ? (subForm + '.') : '') + fieldName + ' = null;" style="position:absolute;right:0px;top:2px;font-size:11px;" ng-show="formFor.target.' + ((subForm) ? (subForm + '.') : '') + fieldName + ' && !' + (inputConfig.ngDisabled || 'false') + '" class="red">Clear</a>';
                    }
                } else if (inputConfig.type === moment && inputConfig.inputType != "time") {
                    template += '' +
                        '<div class="input-group">' +
                        buildElement('input', {
                            class: 'form-control',
                            type: 'text',
                            name: subForm + fieldName + 'Input',
                            ngModel: 'formFor.target.' + ((subForm) ? (subForm + '.') : '') + fieldName,
                            ngModelOptions: "{ 'timezone':'+0000' }",
                            ngRequired: inputConfig.required,
                            datepickerPopup: 'shortDate',
                            tabindex: (inputConfig.tabIndex) ? inputConfig.tabIndex : '',
                            isOpen: 'formFor.opened.' + subForm + openName + 'Input',
                            placeholder: '{{DATETIME_FORMAT}}',
                            ngDisabled: angular.isDefined(inputConfig.editable) && (!inputConfig.editable || inputConfig.editable == 'false'),
                            showWeeks: false,
                            showButtonBar: false,
                            //dtPicker:''
                        }) +
                        '<span class="input-group-btn">' +
                        '<button type="button" class="btn btn-default" ng-click="openCalendar($event, \'' + subForm + openName + 'Input' + '\')"><i class="glyphicon glyphicon-calendar"></i></button>' +
                        '</span>' +
                        '</div>';
                } else if (inputConfig.type == "Phone") {
                    template += '' +
                        '<input class="form-control" tabindex="' + inputConfig.tabIndex + '"  type="text" international-phone-number name="' + ((subForm) ? (subForm) : '') + fieldName +
                        'Input" ng-model-options="{allowInvalid:true}" ng-model="formFor.target.' + ((subForm) ? (subForm + '.') : '') + fieldName + '"' +
                        ' ng-required="' + inputConfig.required + '"' +
                        ' ng-disabled="' + (angular.isDefined(inputConfig.editable) && !inputConfig.editable) + '"' +
                        '/></div>';
                } else if (inputConfig.type == Number) {
                    template += '' +
                        '<input class="form-control" tabindex="' + inputConfig.tabIndex + '" type="number" name=' + ((subForm) ? (subForm) : '') + fieldName +
                        'Input ng-model=formFor.target.' + ((subForm) ? (subForm + '.') : '') + fieldName +
                        ' ng-required=' + inputConfig.required +
                        ' ng-disabled=' + (angular.isDefined(inputConfig.editable) && (!inputConfig.editable || inputConfig.editable == 'false'));
                    if (angular.isDefined(inputConfig.min))
                        template += ' min=' + inputConfig.min
                    if (angular.isDefined(inputConfig.max))
                        template += ' max=' + inputConfig.max
                    template += ' /></div>';
                } else if (inputConfig.inputType == "time") {
                    template += '' +
                        '<div class="input-group" dropdown is-open="formFor.opened.' + subForm + fieldName + 'Input" auto-close="outsideClick">' +
                        buildElement('input', {
                            class: 'form-control',
                            type: 'time',
                            name: subForm + fieldName + 'Input',
                            ngModel: 'formFor.target.' + ((subForm) ? (subForm + '.') : '') + fieldName,
                            ngModelOptions: inputConfig.timezone ? "{ 'timezone':'+0000' }" : null,
                            //ngModelOptions: "{ 'timezone':'+0100' }",
                            tabindex: (inputConfig.tabIndex) ? inputConfig.tabIndex : '',
                            ngRequired: inputConfig.required,
                            placeholder: 'HH:MM',
                            ngDisabled: angular.isDefined(inputConfig.editable) && (!inputConfig.editable || inputConfig.editable == 'false'),
                            //timePicker:''
                        }) +
                        '<ul class="dropdown-menu timepicker">' +
                        '<li>' +
                        '<timepicker ng-model="formFor.target.' + ((subForm) ? (subForm + '.') : '') + fieldName + '" ' + (inputConfig.timezone ? "ng-model-options=\"{ 'timezone':'+0000' }\"" : '') + ' hour-step="1" minute-step="5" show-meridian="false"></timepicker>' +
                        '</li>' +
                        '</ul>' +
                        '<span class="input-group-btn">' +
                        '<button type="button" class="btn btn-default" ng-click="openCalendar($event, \'' + subForm + fieldName + 'Input' + '\')"><i class="glyphicon glyphicon-time"></i></button>' +
                        '</span>' +
                        '</div>';
                } else if (inputConfig.type === Boolean) {
                    template += '<div class="">';
                    template += buildElement('input', {
                            class: 'check',
                            type: 'checkbox',
                            name: subForm + fieldName + 'Check',
                            id: subForm + fieldName + 'Check',
                            tabindex: (inputConfig.tabIndex) ? inputConfig.tabIndex : '',
                            ngModel: 'formFor.target.' + ((subForm) ? (subForm + '.') : '') + fieldName,
                            ngRequired: inputConfig.required,
                            ngDisabled: angular.isDefined(inputConfig.editable) && (!inputConfig.editable || inputConfig.editable == 'false'),
                        }) +
                        '<label class="check-label" for="' + subForm + fieldName + 'Check"></label></div><br class="clearfix" />';
                } else {
                    if (inputConfig.append || inputConfig.prepend) {
                        template += '<div class="input-group">';
                    }
                    if (inputConfig.prepend) {
                        template += '<span class="input-group-btn">' +
                            '<button type="button" class="btn btn-default currency" ng-style="{ \'background-color\': (type == \'currency\') ? \'#2AA2AB\' : \'#eee\' }" ng-click="' + inputConfig.prepend.click + '"><i class="' + inputConfig.prepend.icon + '"></i>' + inputConfig.prepend.text + '</button>' +
                            '</span>'
                    }
                    if (inputConfig.modelFilter) {
                        template += buildElement('input', {
                            class: 'form-control',
                            type: inputConfig.inputType,
                            name: subForm + fieldName + 'Input',
                            tabindex: (inputConfig.tabIndex) ? inputConfig.tabIndex : '',
                            step: inputConfig.step,
                            ngModel: 'formFor.target.' + ((subForm) ? (subForm + '.') : '') + fieldName,
                            ngDisabled: angular.isDefined(inputConfig.editable) && (!inputConfig.editable || inputConfig.editable == 'false'),
                            ngRequired: inputConfig.required,
                            placeholder: inputConfig.placeholder,
                            modelFilter: ''
                        });
                    } else {
                        template += buildElement('input', {
                            class: 'form-control',
                            type: inputConfig.inputType,
                            tabindex: (inputConfig.tabIndex) ? inputConfig.tabIndex : '',
                            name: subForm + fieldName + 'Input',
                            step: inputConfig.step,
                            min: inputConfig.min,
                            max: inputConfig.max,
                            ngModel: 'formFor.target.' + ((subForm) ? (subForm + '.') : '') + fieldName,
                            ngDisabled: angular.isDefined(inputConfig.editable) && (!inputConfig.editable || inputConfig.editable == 'false'),
                            ngRequired: inputConfig.required,
                            placeholder: inputConfig.placeholder
                        });
                    }
                    if (inputConfig.append) {
                        template += '<span class="input-group-btn">' +
                            '<button type="button" class="btn btn-default" ng-style="{ \'background-color\': (type == \'percent\') ? \'#2AA2AB\' : \'#eee\' }" ng-click="' + inputConfig.append.click + '"><i class="' + inputConfig.append.icon + '"></i>' + inputConfig.append.text + '</button>' +
                            '</span>'
                    }
                    if (inputConfig.append || inputConfig.prepend) {
                        template += '</div>';
                    }
                }

                if (inputConfig.helpText) {
                    template += '<small class="help-block text-muted">' + inputConfig.helpText + '</small>';
                }

                template += '' +
                    '<div ng-messages="formFor.form.' + subForm + fieldName + 'Input.$error" class="help-block">' +
                    '<div ng-message="required">' + inputConfig.display + ' is required.</div>' +
                    '<div ng-message="parse">' + inputConfig.display + ' is incorrectly formatted.</div>' +
                    '<div ng-message="email">' + inputConfig.display + ' is not a valid e-mail.</div>' +
                    '<div ng-message="min">' + inputConfig.display + ' has minimum value ' + inputConfig.min + '</div>' +
                    '<div ng-message="internationalPhoneNumber">' + inputConfig.display + ' is not a valid phone number.</div>' +
                    '</div>' +
                    '</div>';
                template += '</div>';
                return template;
            },
            link: function(scope, element, attrs) {
                scope.openCalendar = function(event, name) {
                    scope.formFor.opened[name] = true;
                    event.preventDefault();
                    event.stopPropagation();
                }
                scope.current = Localisation.currency().getCurrent();

                scope.type = '';
                scope.$watch('type', function(oldVal, newVal) {
                    if (oldVal != newVal) {
                        scope.$apply();
                    }
                })
            }
        };
    };

    function propertySearchFilter() {
        return function(items, props) {
            var out = [];

            if (angular.isArray(items)) {
                items.forEach(function(item) {
                    var itemMatches = false;

                    var keys = Object.keys(props);
                    for (var i = 0; i < keys.length; i++) {
                        var prop = keys[i];
                        var text = props[prop].toLowerCase();
                        if (item[prop] && item[prop].toString().toLowerCase().indexOf(text) !== -1) {
                            itemMatches = true;
                            break;
                        }
                    }

                    if (itemMatches) {
                        out.push(item);
                    }
                });
            } else {
                // Let the output be the input untouched
                out = items;
            }

            return out;
        };
    };

    function buildElement(elementType, attrs) {
        var result = '<' + elementType + ' ';

        angular.forEach(attrs, function(value, key) {
            if (angular.isDefined(value) && value !== null)
                result += normalise(key) + '="' + value + '"';
        });

        if (elementType === 'input') {
            result += ' />';
        } else {
            result += ' ></' + elementType + '>';
        }
        return result;
    }

    function normalise(input) {
        var result = '';
        for (var i = 0; i < input.length; i++) {
            var char = input[i];
            if (char == char.toUpperCase()) {
                result += '-' + char.toLowerCase();
            } else {
                result += char;
            }
        }
        return result;
    }

    modelFilter.$inject = ['Localisation', '$filter']

    function modelFilter(Localisation, $filter) {
        return {
            require: 'ngModel',
            link: function(scope, element, attrs, modelCtrl) {
                scope.$watch(function() {
                    scope.current = Localisation.currency().getCurrent();
                    return scope.current;
                }, function(newval, oldVal) {
                    var transformedInput = $filter('Convert')(modelCtrl.$modelValue);
                    modelCtrl.$setViewValue(transformedInput);
                    modelCtrl.$render();
                }, false);
            }
        };
    };

    function dtPicker() {
        return {
            require: 'ngModel',
            link: function(scope, element, attrs, modelCtrl) {
                modelCtrl.$parsers.push(function(viewValue) {
                    viewValue.setMinutes(viewValue.getMinutes() - viewValue.getTimezoneOffset());
                    return viewValue.toISOString().substring(0, 10);
                });

                modelCtrl.$formatters.push(function(modelValue) {
                    if (!modelValue) {
                        return undefined;
                    }
                    var dt = new Date(modelValue);
                    dt.setMinutes(dt.getMinutes() + dt.getTimezoneOffset());
                    return dt.toISOString().substring(0, 10);
                });
            }
        };
    };
    timePicker.$inject = ['$parse'];

    function timePicker($parse) {
        return {
            require: 'ngModel',
            link: function(scope, element, attr, modelCtrl) {
                var currValue = scope.$eval(attr.ngModel);

                if (currValue === undefined)
                    return;

                var dt = new Date(currValue);

                dt.setMinutes(dt.getMinutes() + dt.getTimezoneOffset());

                var model = $parse(attr.ngModel);
                model.assign(scope, dt);
            }
        };
    }

}(angular));
