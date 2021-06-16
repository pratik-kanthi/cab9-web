(function(angular) {
    var module = angular.module('cab9.settings');

    module.controller('DriverPaymentModelAdjustmentCreateController', driverPaymentModelAdjustmentCreateController);

    driverPaymentModelAdjustmentCreateController.$inject = ['$scope', '$stateParams', '$modalInstance', '$rootScope', '$state', '$q', '$config', '$UI', '$http', 'Model', 'rTaxes', 'rVehicleTypes'];

    function driverPaymentModelAdjustmentCreateController($scope, $stateParams, $modalInstance, $rootScope, $state, $q, $config, $UI, $http, Model, rTaxes, rVehicleTypes) {
        $scope.adjustment = new Model.DriverPaymentModelAdjustment();
        $scope.adjustment.TaxId = $scope.COMPANY.DefaultTaxId;
        $scope.adjustment.DriverPaymentModelId = $stateParams.Id;
        $scope.viewMode = 'CREATE';
        $scope.save = save;
        $scope.taxes = rTaxes;
        $scope.recurring = true;

        $scope.adjustment.Approved = true;
        $scope.adjustment.Recurring = "Recurring";
        $scope.adjustment.AmountType = 'Fixed';

        $scope.adjustment.$VehicleTypes = [];
        $scope.unlinkedVehicleTypes = rVehicleTypes;
        $scope.addVehicleType = addVehicleType;
        $scope.removeVehicleType = removeVehicleType;
        $scope.toggleDay = toggleDay;

        $scope.week = [{
            day: "Su",
            value: 1,
            selected: false,
            full: "Sunday"
        },{
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

        function addVehicleType(item) {
            $scope.adjustment.$VehicleTypes.push(item);
            var found = $scope.unlinkedVehicleTypes.filter(function(vt) {
                return vt.Id == item.Id
            });
            if (found[0])
                $scope.unlinkedVehicleTypes.splice($scope.unlinkedVehicleTypes.indexOf(found[0]), 1)
            $scope.selectedVehicleType = null;
        }

        function removeVehicleType(item) {
            $scope.unlinkedVehicleTypes.push(item);
            var found = $scope.adjustment.$VehicleTypes.filter(function(vt) {
                return vt.Id == item.Id;
            })
            if (found[0])
                $scope.adjustment.$VehicleTypes.splice($scope.adjustment.$VehicleTypes.indexOf(found[0]), 1)
        }

        function toggleDay(day) {
            day.selected = !day.selected;
        }

        function save() {
            try {

                if ($scope.adjustment.AppliesToBooking) {
                    $scope.adjustment.DaysOfWeek = parseDaystoInt($scope.week);
                    $scope.adjustment.StartTime = parseTimeToInt($scope.adjustment.$StartTime);
                    $scope.adjustment.EndTime = parseTimeToInt($scope.adjustment.$EndTime);
                    $scope.adjustment.VehicleTypes = parseVehicleTypesToString($scope.adjustment.$VehicleTypes);
                } else {
                    $scope.adjustment.DaysOfWeek = null;
                    $scope.adjustment.StartTime = null;
                    $scope.adjustment.EndTime = null;
                    $scope.adjustment.VehicleTypes = null;
                }


                $scope.adjustment.$save().then(function(response) {
                    swal({
                        title: "Adjustment Model Saved!",
                        text: "Changes have been updated.",
                        type: "success",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                    $modalInstance.close(response);
                }, function(err) {
                    swal({
                        title: "Some Error Occured.",
                        text: "Some error has occured.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                })
            } catch (exc) {
                swal({
                    title: "Some Error Occured.",
                    text: exc.message,
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            }
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

        function parseTimeToInt(timeStr) {
            if (timeStr && timeStr.length > 0) {
                if (timeStr.split(":").length == 2) {
                    return parseFloat(timeStr.split(":")[0] * 60) + parseFloat(timeStr.split(":")[1]);
                } else {
                    throw {
                        "message": "Time is not in correct format. Please check your input and try again."
                    }
                }
            } else {
                return null;
            }
        }

        function parseIntToTime(minutes) {
            if (minutes) {
                if (typeof minutes == "number") {
                    var hour = (Math.floor(minutes / 60) < 10) ? "0" + Math.floor(minutes / 60) : Math.floor(minutes / 60);
                    var minutes = ((minutes % 60) < 10) ? "0" + (minutes % 60) : (minutes % 60);
                    return hour + ":" + minutes;
                } else {
                    throw {
                        "message": "Time is not in correct format. Please check your input and try again."
                    }
                }
            } else {
                return null;
            }
        }

        function parseVehicleTypesToString(vehicleTypes) {
            if (vehicleTypes.length > 0) {
                var vtArr = vehicleTypes.map(function(vt) {
                    return vt.Id;
                });
                return vtArr.join(",");
            } else {
                return null;
            }
        }

    }
    module.controller('DriverPaymentModelAdjustmentEditController', driverPaymentModelAdjustmentEditController);

    driverPaymentModelAdjustmentEditController.$inject = ['$scope', '$stateParams', '$modalInstance', '$rootScope', '$state', '$q', '$config', '$UI', '$http', 'Model', 'rAdjustment', 'rTaxes', 'rVehicleTypes'];

    function driverPaymentModelAdjustmentEditController($scope, $stateParams, $modalInstance, $rootScope, $state, $q, $config, $UI, $http, Model, rAdjustment, rTaxes, rVehicleTypes) {
        $scope.taxes = rTaxes;
        $scope.adjustment = rAdjustment[0];
        $scope.viewMode = 'EDIT';
        $scope.save = save;

        $scope.addVehicleType = addVehicleType;
        $scope.removeVehicleType = removeVehicleType;
        $scope.toggleDay = toggleDay;

        $scope.unlinkedVehicleTypes = rVehicleTypes;


        $scope.week = [{
            day: "Su",
            value: 1,
            selected: false,
            full: "Sunday"
        },{
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


        formatAdjustment();

        function addVehicleType(item) {
            $scope.adjustment.$VehicleTypes.push(item);
            var found = $scope.unlinkedVehicleTypes.filter(function(vt) {
                return vt.Id == item.Id
            });
            if (found[0])
                $scope.unlinkedVehicleTypes.splice($scope.unlinkedVehicleTypes.indexOf(found[0]), 1)
            $scope.selectedVehicleType = null;
        }

        function removeVehicleType(item) {
            $scope.unlinkedVehicleTypes.push(item);
            var found = $scope.adjustment.$VehicleTypes.filter(function(vt) {
                return vt.Id == item.Id;
            })
            if (found[0])
                $scope.adjustment.$VehicleTypes.splice($scope.adjustment.$VehicleTypes.indexOf(found[0]), 1)
        }

        function toggleDay(day) {
            day.selected = !day.selected;
        }

        function save() {
            try {

                if ($scope.adjustment.AppliesToBooking) {
                    $scope.adjustment.DaysOfWeek = parseDaystoInt($scope.week);
                    $scope.adjustment.StartTime = parseTimeToInt($scope.adjustment.$StartTime);
                    $scope.adjustment.EndTime = parseTimeToInt($scope.adjustment.$EndTime);
                    $scope.adjustment.VehicleTypes = parseVehicleTypesToString($scope.adjustment.$VehicleTypes);
                } else {
                    $scope.adjustment.DaysOfWeek = null;
                    $scope.adjustment.StartTime = null;
                    $scope.adjustment.EndTime = null;
                    $scope.adjustment.VehicleTypes = null;
                }

                $scope.adjustment.$patch().then(function(response) {
                    swal({
                        title: "Adjustment Model Updated!",
                        text: "Changes have been updated.",
                        type: "success",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                    $modalInstance.close(response);
                }, function(err) {
                    swal({
                        title: "Some Error Occured.",
                        text: "Some error has occured.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                })
            } catch (exc) {
                swal({
                    title: "Some Error Occured.",
                    text: exc.message,
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            }
        }

        function formatAdjustment() {
            arrangeDays();
            $scope.adjustment.$StartTime = parseIntToTime($scope.adjustment.StartTime);
            $scope.adjustment.$EndTime = parseIntToTime($scope.adjustment.EndTime);
            $scope.adjustment.$VehicleTypes = [];
            if ($scope.adjustment.VehicleTypes) {
                var vehicleTypes = $scope.adjustment.VehicleTypes.split(",");
                $scope.unlinkedVehicleTypes.map(function(uVt) {
                    if (vehicleTypes.indexOf(uVt.Id) > -1) {
                        $scope.adjustment.$VehicleTypes.push(uVt);
                        uVt.$assigned = true;
                    }
                });

                $scope.unlinkedVehicleTypes = $scope.unlinkedVehicleTypes.filter(function(uVt) {
                    return !uVt.$assigned;
                })
            }
        }

        function arrangeDays() {
            if ($scope.adjustment.DaysOfWeek && $scope.adjustment.DaysOfWeek.length > 0) {
                $scope.week.map(function(day) {
                    if ($scope.adjustment.DaysOfWeek.indexOf(day.full) > -1) {
                        day.selected = true;
                    }
                });
            }
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

        function parseTimeToInt(timeStr) {
            if (timeStr && timeStr.length > 0) {
                if (timeStr.split(":").length == 2) {
                    return parseFloat(timeStr.split(":")[0] * 60) + parseFloat(timeStr.split(":")[1]);
                } else {
                    throw {
                        "message": "Time is not in correct format. Please check your input and try again."
                    }
                }
            } else {
                return null;
            }
        }

        function parseIntToTime(minutes) {
            if (minutes) {
                if (typeof minutes == "number") {
                    var hour = (Math.floor(minutes / 60) < 10) ? "0" + Math.floor(minutes / 60) : Math.floor(minutes / 60);
                    var minutes = ((minutes % 60) < 10) ? "0" + (minutes % 60) : (minutes % 60);
                    return hour + ":" + minutes;
                } else {
                    throw {
                        "message": "Time is not in correct format. Please check your input and try again."
                    }
                }
            } else {
                return null;
            }
        }

        function parseVehicleTypesToString(vehicleTypes) {
            if (vehicleTypes.length > 0) {
                var vtArr = vehicleTypes.map(function(vt) {
                    return vt.Id;
                });
                return vtArr.join(",");
            } else {
                return null;
            }
        }
    }
}(angular))