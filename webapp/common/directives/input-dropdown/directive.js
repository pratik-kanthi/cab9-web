(function(angular) {
    var module = angular.module('cab9.common');
    module.directive('inputDropdown', inputDropdownDirective);

    inputDropdownDirective.$inject = ['$http', '$parse'];

    function inputDropdownDirective($http, $parse) {

        var templateString =
            '<div class="input-dropdown">' +
            '<input type="text"' +
            'name="{{::inputName}}"' +
            'placeholder="{{::inputPlaceholder}}"' +
            'autocomplete="off"' +
            'ng-model="inputValue"' +
            'class="{{::inputClassName}}"' +
            'ng-required="inputRequired"' +
            'ng-change="inputChange()"' +
            'ng-focus="inputFocus()"' +
            'ng-blur="inputBlur($event,  isFrom, isTo, fixed)"' +
            'ng-click="SaveChanges(fixed)">' +

            '<ul ng-if="dropdownVisible" style="line-height: 18px;border: 1px solid #ddd;overflow-y: auto;overflow-x: hidden;max-height: 200px;">' +
            '<li ng-repeat="item in dropdownItems track by $index"' +
            'ng-click="selectItem(item,  isFrom, isTo, fixed)"' +
            'ng-mouseenter="setActive($index)"' +
            'ng-mousedown="dropdownPressed()"' +
            'style="font-family: inherit;font-size: 13px;border-bottom: 1px solid #ddd; padding: 10px !important;" ng-class="{\'activetab\': activeItemIndex === $index}"' +
            '>' +
            '<span ng-show="item.Name">{{item.Name}}</span>' +
            '<span ng-show="!item.Name">{{item}}</span>' +
            '</li>' +
            '</ul>' +
            '</div>';

        return {
            restrict: 'E',
            replace: true,
            scope: {
                defaultDropdownItems: '=',
                selectedItem: '=',
                inputRequired: '=',
                inputName: '@',
                inputClassName: '@',
                inputPlaceholder: '@',
                filterListMethod: '&',
                itemSelectedMethod: '&',
                fixed: '=',
                isFrom: '=',
                isTo: '=',
                saveChanges: '&'
            },
            template: templateString,
            controller: ['$scope', '$http', function($scope, $http) {
                this.getSelectedItem = function() {
                    return $scope.selectedItem;
                };
                this.isRequired = function() {
                    return $scope.inputRequired;
                };
                this.getInput = function() {
                    return $scope.inputValue;
                };
            }],
            link: function(scope, element, attrs) {
                var pressedDropdown = false;
                var inputScope = element.find('input').isolateScope();
                scope.activeItemIndex = 0;
                scope.inputValue = '';
                scope.dropdownVisible = false;
                scope.dropdownItems = scope.defaultDropdownItems || [];


                scope.$watch('dropdownItems', function(newValue, oldValue) {
                    if (!angular.equals(newValue, oldValue)) {
                        // If new dropdownItems were retrieved, reset active item
                        scope.setInputActive();
                    }
                });

                scope.$watch('selectedItem', function(newValue, oldValue) {
                    if (newValue) {
                        // Update value in input field to match readableName of selected item
                        if (typeof newValue === 'string') {
                            scope.inputValue = newValue;
                        } else {
                            scope.inputValue = newValue.Name;
                            scope.inputId = newValue.Id;
                        }
                    }



                }, true);

                scope.SaveChanges = function(fixed) {}

                scope.setInputActive = function() {
                    scope.setActive(-1);

                    //TODO: Add active/selected class to input field for styling
                };

                scope.setActive = function(itemIndex) {
                    scope.activeItemIndex = itemIndex;
                };

                scope.inputChange = function() {
                    scope.selectedItem = null;
                    showDropdown();

                    if (!scope.inputValue) {
                        scope.dropdownItems = scope.defaultDropdownItems || [];
                        return;
                    }

                    if (scope.filterListMethod) {
                        var promise = scope.filterListMethod({ userInput: scope.inputValue });
                        if (promise) {
                            promise.then(function(dropdownItems) {
                                scope.dropdownItems = dropdownItems;
                            });
                        }
                    }
                };

                scope.inputFocus = function() {
                    scope.setInputActive();
                    showDropdown();
                };

                scope.inputBlur = function(event, isFrom, isTo, fixed) {
                    if (scope.inputId == undefined || scope.inputId == null) {
                        if (isFrom) {
                            fixed.FromPostcode = scope.inputValue;
                        }

                        if (isTo) {
                            fixed.ToPostcode = scope.inputValue;
                        }

                        if(attrs.client == "true") {
                            if(fixed.Id != null && fixed.Id != undefined){
                              $http.post($config.API_ENDPOINT + 'api/PricingModels/updateclientfixed', fixed)
                              .then(function () {
                              }, function () {
                                  console.log("Error occured");
                              });
                            }
                        } else {
                            if(fixed.Id != null && fixed.Id != undefined){
                              $http.post($config.API_ENDPOINT + 'api/PricingModels/updatefixed', fixed)
                              .then(function () {
                              }, function () {
                                  console.log("Error occured");
                              });
                            }
                        }

                    } else {
                        if (isFrom) {
                            fixed.FromId = scope.inputId;
                        }
                        if (isTo) {
                            fixed.ToId = scope.inputId;
                        }
                    }

                    if (pressedDropdown) {
                        // Blur event is triggered before click event, which means a click on a dropdown item wont be triggered if we hide the dropdown list here.
                        pressedDropdown = false;
                        return;
                    }
                    hideDropdown();
                };

                scope.dropdownPressed = function() {
                    pressedDropdown = true;
                };

                scope.selectItem = function(item, isFrom, isTo, fixed) {
                    scope.selectedItem = item;
                    hideDropdown();
                    scope.dropdownItems = [item];

                    if (scope.itemSelectedMethod) {
                        scope.itemSelectedMethod({ item: item });
                    }

                    if (isFrom) {
                        fixed.FromId = item.Id;
                    }

                    if (isTo) {
                        fixed.ToId = item.Id;
                    }

                    if (fixed.Id != null && fixed.Id != undefined) {
                        if (attrs.modelType == "clientpricingfixeds") {
                            $http.post($config.API_ENDPOINT + 'api/PricingModels/updateclientfixed', fixed)
                                .then(function() {}, function() {
                                    console.log("Error occured");
                                });
                        } else if (attrs.modelType == "DriverPaymentModelFixeds") {
                            $http.post($config.API_ENDPOINT + 'api/DriverPayments/updateDriverfixed', fixed)
                                .then(function() {}, function() {
                                    console.log("Error occured");
                                });
                        } else if (attrs.modelType = "pricingfixeds") {
                            $http.post($config.API_ENDPOINT + 'api/PricingModels/updatefixed', fixed)
                                .then(function() {}, function() {
                                    console.log("Error occured");
                                });
                        }
                    }

                };

                var showDropdown = function() {
                    scope.dropdownVisible = true;
                };
                var hideDropdown = function() {
                    scope.dropdownVisible = false;
                };

                var selectPreviousItem = function() {
                    var prevIndex = scope.activeItemIndex - 1;
                    if (prevIndex >= 0) {
                        scope.setActive(prevIndex);
                    } else {
                        scope.setInputActive();
                    }
                };

                var selectNextItem = function() {
                    var nextIndex = scope.activeItemIndex + 1;
                    if (nextIndex < scope.dropdownItems.length) {
                        scope.setActive(nextIndex);
                    }
                };

                var selectActiveItem = function() {
                    if (scope.activeItemIndex >= 0 && scope.activeItemIndex < scope.dropdownItems.length) {
                        scope.selectItem(scope.dropdownItems[scope.activeItemIndex]);
                    }
                };

                element.bind("keydown keypress", function(event) {
                    switch (event.which) {
                        case 38: //up
                            scope.$apply(selectPreviousItem);
                            break;
                        case 40: //down
                            scope.$apply(selectNextItem);
                            break;
                        case 13: // return
                            if (scope.dropdownVisible && scope.dropdownItems && scope.dropdownItems.length > 0 && scope.activeItemIndex !== -1) {
                                // only preventDefault when there is a list so that we can submit form with return key after a selection is made
                                event.preventDefault();
                                scope.$apply(selectActiveItem);
                            }
                            break;
                        case 9: // tab
                            if (scope.dropdownVisible && scope.dropdownItems && scope.dropdownItems.length > 0 && scope.activeItemIndex !== -1) {
                                scope.$apply(selectActiveItem);
                            }
                            break;
                    }
                });
            }
        }
    }

    angular.module('cab9.common').directive('context', function() {
        return {
            restrict: 'A',
            scope: '@&',
            compile: function compile(tElement, tAttrs, transclude) {
                return {
                    post: function postLink(scope, iElement, iAttrs, controller) {
                        var ul = $('#' + iAttrs.context),
                            last = null;

                        ul.css({
                            'display': 'none'
                        });

                        $(iElement).bind('contextmenu', function(event) {
                            event.preventDefault();
                            ul.css({
                                position: "fixed",
                                display: "inline-block",
                                left: event.clientX + 'px',
                                top: event.clientY + 'px'
                            });
                            last = event.timeStamp;
                        });

                        $(document).click(function(event) {
                            var target = $(event.target);
                            if (!target.is(".popover") && !target.parents().is(".popover")) {
                                if (last === event.timeStamp)
                                    return;
                                ul.css({
                                    'display': 'none'
                                });
                            }
                        });
                    }
                };
            }
        }
    });


})(angular);