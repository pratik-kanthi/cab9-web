(function(angular) {
    var module = angular.module('cab9.settings');

    module.directive('bookingsFilter', bookingsFilter);

    bookingsFilter.$inject = ['$parse', '$http', '$config', '$filter'];

    function bookingsFilter($parse, $http, $config, $filter) {
        return {
            scope: { slot: '=', vehicleTypes: '=' },
            templateUrl: '/webapp/management/settings/integrations/filter-directive/partial.html',
            link: function(scope, elem, attrs) {
                scope.toggleDay = toggleDay;
                scope.addVehicleType = addVehicleType;
                scope.removeVehicleType = removeVehicleType;
                scope.saveSlot = saveSlot;
                scope.updateSlot = updateSlot;
                scope.deleteSlot = deleteSlot;
                scope._vehicleTypes = scope.vehicleTypes.slice();
                scope.timePattern = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/
                scope.week = [{
                    day: "Su",
                    value: 1,
                    selected: false,
                    full: "Sunday"
                }, {
                    day: "Mo",
                    value: 2,
                    selected: false,
                    full: "Monday"
                }, {
                    day: "Tu",
                    value: 4,
                    selected: false,
                    full: "Tuesday"
                }, {
                    day: "We",
                    value: 8,
                    selected: false,
                    full: "Wednesday"
                }, {
                    day: "Th",
                    value: 16,
                    selected: false,
                    full: "Thursday"
                }, {
                    day: "Fr",
                    value: 32,
                    selected: false,
                    full: "Friday"
                }, {
                    day: "Sa",
                    value: 64,
                    selected: false,
                    full: "Saturday"
                }];
                setupSlot();

                

                function addVehicleType(item) {
                    scope.slot.BypassVehicleTypes.push(item);
                    var found = scope._vehicleTypes.filter(function(vt) {
                        return vt.Id == item.Id
                    });
                    if (found[0])
                        scope._vehicleTypes.splice(scope._vehicleTypes.indexOf(found[0]), 1)
                    scope.selectedVehicleType = null;
                }

                function removeVehicleType(item) {
                    scope._vehicleTypes.push(item);
                    var found = scope.slot.BypassVehicleTypes.filter(function(vt) {
                        return vt.Id == item.Id;
                    })
                    if (found[0])
                        scope.slot.BypassVehicleTypes.splice(scope.slot.BypassVehicleTypes.indexOf(found[0]), 1)
                }

                function toggleDay(day) {
                    day.selected = !day.selected;
                }

                function parseDaystoInt(days) {
                    var value = 0;
                    days.map(function(day) {
                        if (day.selected == true) {
                            value += day.value;
                        }
                    });
                    if (value > 0) {
                        return value;
                    } else {
                        return null;
                    }
                }



                function setupSlot() {
                    arrangeDays();
                    arrangeVehicleTypes();
                }



                function arrangeDays() {
                    if (scope.slot.DaysOfWeek && scope.slot.DaysOfWeek.length > 0) {
                        scope.week.map(function(day) {
                            if (scope.slot.DaysOfWeek.indexOf(day.full) > -1) {
                                day.selected = true;
                            }
                        });
                    }
                }

                function arrangeVehicleTypes() {
                    var found = [];
                    if (scope.slot.BypassVehicleTypes) {
                        scope._vehicleTypes.map(function(vt) {
                            scope.slot.BypassVehicleTypes.map(function(bvt) {
                                if (vt.Id == bvt.Id) {
                                    found.push(scope._vehicleTypes.indexOf(vt));
                                }
                            });
                        });
                        found.map(function(f, index) {
                            scope._vehicleTypes.splice(f - index, 1);
                        })
                    }
                }

                function updateSlot() {
                    swal({
                        title: "Are you sure?",
                        text: "Are you sure you want to update this slot?",
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonText: "Confirm",
                        showLoaderOnConfirm: true,
                        closeOnConfirm: false
                    }, function() {
                        scope.slot.DaysOfWeek = parseDaystoInt(scope.week);
                        $http({
                            method: 'POST',
                            url: $config.API_ENDPOINT + "api/ot-integration/update-slot",
                            data: scope.slot
                        }).then(function successCallback(response) {
                            swal('Slot Updated', 'Slot has been updated.', 'success');
                        }, function errorCallback(response) {
                            swal('Error', 'There was an error updating the slot.', 'error');
                        });
                    }, function() {
                        swal('Error', 'There was an error updating the slot.', 'error');
                    });
                }

                function saveSlot() {
                    swal({
                        title: "Are you sure?",
                        text: "Are you sure you want to save this slot?",
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonText: "Confirm",
                        showLoaderOnConfirm: true,
                        closeOnConfirm: false
                    }, function() {
                        scope.slot.DaysOfWeek = parseDaystoInt(scope.week);
                        $http({
                            method: 'POST',
                            url: $config.API_ENDPOINT + "api/ot-integration/add-slot",
                            data: scope.slot
                        }).then(function successCallback(response) {
                            swal('Slot Saved', 'Slot has been saved.', 'success');
                            scope.slot.Id=response.data.Id;
                        }, function errorCallback(response) {
                            swal('Error', 'There was an error saving the slot.', 'error');
                        });
                    }, function() {
                        swal('Error', 'There was an error saving the slot.', 'error');
                    });
                }

                function deleteSlot() {
                    swal({
                        title: "Are you sure?",
                        text: "Are you sure you want to delete this slot?",
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonText: "Confirm",
                        showLoaderOnConfirm: true,
                        closeOnConfirm: false
                    }, function() {
                        $http({
                            method: 'POST',
                            url: $config.API_ENDPOINT + "api/ot-integration/delete-slot",
                            data: scope.slot
                        }).then(function successCallback(response) {
                            swal('Slot Deleted', 'Slot has been deleted.', 'success');
                            scope.$emit("SlotDeleted", scope.slot);
                        }, function errorCallback(response) {
                            swal('Error', 'There was an error deleting the slot.', 'error');
                        });
                    }, function() {
                        swal('Error', 'There was an error deleting the slot.', 'error');
                    });
                }

                function parseDaystoInt(days) {
                    var value = 0;
                    days.map(function(day) {
                        if (day.selected == true) {
                            value += day.value;
                        }
                    });
                    if (value > 0) {
                        return value;
                    } else {
                        return null;
                    }
                }
            }

        };
    }
})(angular);