(function (angular) {
    var module = angular.module('cab9.dispatch');

    module.controller('DispatchDriversController', DispatchDriversController);

    DispatchDriversController.$inject = ['$scope', '$timeout', 'Model', '$http', '$config', '$modal'];

    function DispatchDriversController($scope, $timeout, Model, $http, $config, $modal) {
        $scope.dispatchObj.drivers.items = [];
        $scope.dispatchObj.drivers.byStatus = [];
        $scope.dispatchObj.drivers.plotRoute = plotRoute;
        $scope.dispatchObj.drivers.selectDriver = selectDriver;
        $scope.dispatchObj.drivers.refetchDrivers = refetchDrivers;

        $scope.dispatchObj.drivers.nudgeDriverOnShift = nudgeDriverOnShift;
        $scope.dispatchObj.drivers.openNotesModal = openNotesModal;
        $scope.dispatchObj.drivers.endShift = endShift;
        $scope.dispatchObj.drivers.toggleAutoDispatch = toggleAutoDispatch;
        $scope.dispatchObj.drivers.toggleGoingHome = toggleGoingHome;
        $scope.dispatchObj.drivers.setLocation = setLocation;

        $scope.dispatchObj.drivers.selectedDriverId = null;
        $scope.formatImage = formatImage;
        $scope.$on('SIGNALR_updateDriverShifts', onUpdateDriverShifts);

        $scope.dispatchObj.drivers.routedDriver = null;
        var currentRoute = null;

        refetchDrivers();

        function onUpdateDriverShifts(event, args) {
            var data = args[0];

            $scope.dispatchObj.drivers.items.length = 0; //needed to clear one time bindings
            var byStatus = {
                Available: [],
                Clearing: [],
                OnJob: [],
                OnBreak: []
            };

            $timeout(function () {
                $scope.dispatchObj.drivers.items = data; //set new data

                angular.forEach(data, function (d) {
                    byStatus[d.DriverStatus].push(d);
                });

                $scope.dispatchObj.drivers.byStatus.length = 0;

                if (byStatus.Available.length > 0) {
                    $scope
                        .dispatchObj
                        .drivers
                        .byStatus
                        .push({status: 'Available', display: 'Available', drivers: byStatus.Available})
                }
                if (byStatus.Clearing.length > 0) {
                    $scope
                        .dispatchObj
                        .drivers
                        .byStatus
                        .push({status: 'Clearing', display: 'Clearing', drivers: byStatus.Clearing})
                }
                if (byStatus.OnJob.length > 0) {
                    $scope
                        .dispatchObj
                        .drivers
                        .byStatus
                        .push({status: 'OnJob', display: 'On Job', drivers: byStatus.OnJob})
                }
                if (byStatus.OnBreak.length > 0) {
                    $scope
                        .dispatchObj
                        .drivers
                        .byStatus
                        .push({status: 'OnBreak', display: 'On Break', drivers: byStatus.OnBreak})
                }

                $scope
                    .dispatchObj
                    .map
                    .updateDriverMarkers();
                $scope
                    .dispatchObj
                    .map
                    .updateFocus();
            }, 0);

            $scope.dispatchObj.drivers.reload = $scope.dispatchObj.drivers.reload + 1;
        }

        function selectDriver(driver) {
            if ($scope.dispatchObj.map.selected.driverId != driver.DriverId) {
                $scope
                    .dispatchObj
                    .map
                    .select(null, driver);
            } else {
                $scope
                    .dispatchObj
                    .map
                    .select(null, null);
            }
        }

        function plotRoute(driver) {
            $scope.dispatchObj.drivers.routedDriver = null;
            if (currentRoute) {
                currentRoute.setMap(null);
                currentRoute = null;
            }
            if (driver && driver.$marker && driver.EncodedRoute) {
                $scope.dispatchObj.drivers.routedDriver = driver;
                var path = google
                    .maps
                    .geometry
                    .encoding
                    .decodePath(driver.EncodedRoute);
                currentRoute = new google
                    .maps
                    .Polyline({path: path, clickable: false, map: $scope.dispatchObj.map.mapObject});
                var bounds = new google
                    .maps
                    .LatLngBounds();
                for (var i = 0; i < path.length; i++) {
                    bounds.extend(path[i]);
                }
                $scope
                    .dispatchObj
                    .map
                    .mapObject
                    .fitBounds(bounds);
            }
        }

        $scope
            .$watch('SIGNALR.status', function (newvalue, oldvalue) {
                if (newvalue == 4 && newvalue != oldvalue) {
                    refetchDrivers();
                }
            });

        function refetchDrivers() {
            $http
                .get($config.API_ENDPOINT + 'api/drivershift/ShiftBreakdown')
                .success(function (data) {
                    $scope.dispatchObj.drivers.items.length = 0; //needed to clear one time bindings
                    var byStatus = {
                        Available: [],
                        Clearing: [],
                        OnJob: [],
                        OnBreak: []
                    };

                    $timeout(function () {
                        $scope.dispatchObj.drivers.items = data;

                        angular.forEach(data, function (d) {
                            byStatus[d.DriverStatus].push(d);
                        });


                        $scope.dispatchObj.drivers.byStatus.length = 0;

                        if (byStatus.Available.length > 0) {
                            $scope
                                .dispatchObj
                                .drivers
                                .byStatus
                                .push({status: 'Available', display: 'Available', drivers: byStatus.Available})
                        }
                        if (byStatus.Clearing.length > 0) {
                            $scope
                                .dispatchObj
                                .drivers
                                .byStatus
                                .push({status: 'Clearing', display: 'Clearing', drivers: byStatus.Clearing})
                        }
                        if (byStatus.OnJob.length > 0) {
                            $scope
                                .dispatchObj
                                .drivers
                                .byStatus
                                .push({status: 'OnJob', display: 'On Job', drivers: byStatus.OnJob})
                        }
                        if (byStatus.OnBreak.length > 0) {
                            $scope
                                .dispatchObj
                                .drivers
                                .byStatus
                                .push({status: 'OnBreak', display: 'On Break', drivers: byStatus.OnBreak})
                        }

                        $scope
                            .dispatchObj
                            .map
                            .updateDriverMarkers();

                        $scope.dispatchObj.drivers.reload = $scope.dispatchObj.drivers.reload + 1;
                    }, 0);
                });
        }

        function nudgeDriverOnShift(shift) {
            shift.$activity = true;
            $scope.dispatchObj.drivers.reload = $scope.dispatchObj.drivers.reload + 1;
            $http({
                    method: 'GET',
                    url: $config.API_ENDPOINT + 'api/DriverShift/NudgeDriveronShift?shiftId=' + shift.DriverShiftId
                }).then(function successCallback(response) {
                    shift.$activity = false;
                    $scope.dispatchObj.drivers.reload = $scope.dispatchObj.drivers.reload + 1;
                }, function errorCallback(response) {
                    // called asynchronously if an error occurs or server returns response with an
                    // error status.
                });
        }

        function openNotesModal(shift) {
            $modal.open({
                templateUrl: '/webapp/management/dispatch/modals/shiftnotes/partial.html',
                controller: 'DispatchDriverNotesController',
                resolve: {
                    rShiftId: function() {
                        return shift.DriverShiftId
                    },
                    rShiftNotes: function() {
                        return shift.Notes
                    }
                },
                size: 'sm'
            }).result.then(function(notes) {
                refetchDrivers();
            });
        }

        function endShift(shift) {
            swal({
                title: "Are you sure?",
                text: "Driver shift will be ended and a notification will be sent for the same.",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes"
            }, function () {
                    shift.$activity = true;
                     $scope.dispatchObj.drivers.reload = $scope.dispatchObj.drivers.reload + 1;
                $http({
                    method: 'GET',
                    url: $config.API_ENDPOINT + 'api/DriverShift/EndShiftsForDriver?driverId=' + shift.DriverId
                    }).then(function successCallback(response) {
                        shift.$activity = false;
                        $scope.dispatchObj.drivers.reload = $scope.dispatchObj.drivers.reload + 1;
                }, function errorCallback(response) {
                    // called asynchronously if an error occurs or server returns response with an
                    // error status.
                });
            });
        }

        function toggleAutoDispatch(shift, on) {
            swal({
                title: "Are you sure?",
                text: on ? "Driver will be eligable for AutoDispatch for this shift." : "Driver will no longer be eligable for AutoDispatch during this shift.",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes"
            }, function () {
                    shift.$activity = true;
                    $scope.dispatchObj.drivers.reload = $scope.dispatchObj.drivers.reload + 1;
                $http({
                    method: 'GET',
                    url: $config.API_ENDPOINT + 'api/DriverShift/ToggleAutoDispatch?shiftId=' + shift.DriverShiftId + '&on=' + on,
                }).then(function successCallback(response) {
                    shift.$activity = false;
                    shift.AutoDispatch = on;
                    $scope.dispatchObj.drivers.reload = $scope.dispatchObj.drivers.reload + 1;
                }, function errorCallback(response) {
                    // called asynchronously if an error occurs or server returns response with an
                    // error status.
                });
            });
        }

        function toggleGoingHome(shift, on) {
            swal({
                title: "Are you sure?",
                text: on ? "Driver will only be eligable for bookings that take them closer to home." : "Driver will no longer be restricted to bookings closer to home.",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes"
            }, function () {
                shift.$activity = true;
                $scope.dispatchObj.drivers.reload = $scope.dispatchObj.drivers.reload + 1;
                $http({
                    method: 'GET',
                    url: $config.API_ENDPOINT + 'api/DriverShift/ToggleGoingHome?shiftId=' + shift.DriverShiftId + '&on=' + on,
                }).then(function successCallback(response) {
                    shift.$activity = false;
                    shift.GoingHome = on;
                    $scope.dispatchObj.drivers.reload = $scope.dispatchObj.drivers.reload + 1;
                }, function errorCallback(response) {
                    // called asynchronously if an error occurs or server returns response with an
                    // error status.
                });
            });
        }

        function setLocation(shift, on) {
            shift.$activity = true;
            $scope.dispatchObj.drivers.reload = $scope.dispatchObj.drivers.reload + 1;

            var listener = $scope.dispatchObj.map.mapObject.addListener('click', function (e) {
                google.maps.event.removeListener(listener);
                var marker = $scope.dispatchObj.map.driverMarkers[shift.DriverId];
                marker.setPosition(e.latLng);
                shift.LastKnownLatitude = e.latLng.lat();
                shift.LastKnownLongitude = e.latLng.lng();

                $http({
                    method: 'GET',
                    url: $config.API_ENDPOINT + 'api/DriverShift/DebugDriverLocation?shiftId=' + shift.DriverShiftId + '&lat=' + e.latLng.lat() + '&lon=' + e.latLng.lng(),
                }).then(function() {
                    shift.$activity = false;
                    $scope.dispatchObj.drivers.reload = $scope.dispatchObj.drivers.reload + 1;
                    $scope.$apply();
                });
            })
        }

        function formatImage(driver) {
            if (driver.DriverImageUrl) {
                if (driver.DriverImageUrl.slice(0, 4) == 'http') {
                    return driver.DriverImageUrl;
                } else {
                    return window.resourceEndpoint + driver.DriverImageUrl;
                }
            } else {
                return window.endpoint + 'api/imagegen?text=' + (driver.DriverCallsign || '').replace(/ /g, "+");
            }
        }
    }
})(angular);
