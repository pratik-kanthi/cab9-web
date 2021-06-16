(function() {
    var module = angular.module('cab9.settings');
    module.controller('SettingsDispatchController', SettingsDispatchController);
    module.controller('SettingsDispatchTesterController', SettingsDispatchTesterController);
    module.controller('SettingsDispatchLiveController', SettingsDispatchLiveController);
    module.controller('SettingsDispatchDetailsController', SettingsDispatchDetailsController);


    SettingsDispatchController.$inject = ['$scope', 'rData', 'rAccessors', 'rTabs', '$http', '$config'];

    function SettingsDispatchController($scope, rData, rAccessors, rTabs, $http, $config) {
        $scope.accessors = rAccessors;
        $scope.tabDefs = rTabs;
    }

    SettingsDispatchTesterController.$inject = ['$scope', 'rData', 'Model', '$timeout', 'rCompany', '$http', '$config', 'rClients'];

    function SettingsDispatchTesterController($scope, rData, Model, $timeout, rCompany, $http, $config, rClients) {
        $scope.company = rCompany[0];
        $scope.clients = rClients;
        $scope.map = {
            center: {
                latitude: $scope.company.BaseLatitude || 52,
                longitude: $scope.company.BaseLongitude || 0
            },
            zoom: 12,
            events: {
                click: mapClick
            }
        };
        $scope.show = {
            advanced: false,
            settings: true,
            bookings: true,
            drivers: true
        }
        $scope.selected = {
            B: null
        };
        $scope.settings = rData[0] || new Model.DispatchSettings();

        $scope.adding = null;
        $scope.markerOptions = {
            animation: google.maps.Animation.DROP,
            coords: {
                latitude: $scope.company.BaseLatitude || 52,
                longitude: $scope.company.BaseLongitude || 0
            },
            icon: {
                url: '/includes/images/marker.png',
                scaledSize: new google.maps.Size(48, 48)
            },
        }

        $scope.pairedLines = [];
        $scope.drivers = [];
        $scope.bookings = [];
        $scope.runDispatch = runDispatch;
        $scope.onMouseEnter = onMouseEnter;
        $scope.onMouseLeave = onMouseLeave;
        $scope.saveSetup = saveSetup;
        $scope.revertSetup = revertSetup;

        function saveSetup() {
            if ($scope.settings.Id) {
                $scope.settings.$patch().success(function(result) {
                    swal('Saved!', 'Dispatch Settings Saved', 'success')
                }).error(function() {
                    swal('Error!', 'Dispatch Settings could not be Saved', 'error');
                })
            } else {
                $scope.settings.$save().success(function(result) {
                    $scope.settings.Id = result.Id;
                    swal('Saved!', 'Dispatch Settings Created', 'success')
                }).error(function() {
                    swal('Error!', 'Dispatch Settings could not be Saved', 'error');
                })
            }
        }

        function revertSetup() {
            $scope.settings.$rollback();
        }

        function onMouseEnter(b, d) {
            //$timeout(function () {
            if (b) {
                b.options.labelStyle.color = 'white';
                b.options.labelStyle['background-color'] = 'black';
                $scope.selected.B = b.lines;
                if (b.$driver) {
                    b.$driver.options.labelStyle.color = 'white';
                    b.$driver.options.labelStyle['background-color'] = 'black';
                }
            }
            if (d) {
                d.options.labelStyle.color = 'white';
                d.options.labelStyle['background-color'] = 'black';
                if (d.$booking) {
                    d.$booking.options.labelStyle.color = 'white';
                    d.$booking.options.labelStyle['background-color'] = 'black';
                }
            }
            //}, 50);
        }

        function onMouseLeave(b, d) {
            if (b) {
                b.options.labelStyle.color = 'black';
                b.options.labelStyle['background-color'] = 'white';
                $scope.selected.B = $scope.pairedLines;
                if (b.$driver) {
                    b.$driver.options.labelStyle.color = 'black';
                    b.$driver.options.labelStyle['background-color'] = 'white';
                }
            }
            if (d) {
                d.options.labelStyle.color = 'black';
                d.options.labelStyle['background-color'] = 'white';
                if (d.$booking) {
                    d.$booking.options.labelStyle.color = 'black';
                    d.$booking.options.labelStyle['background-color'] = 'white';
                }
            }
        }

        function mapClick(map, eventName, args) {
            if ($scope.adding == 'DRIVERS') {
                $scope.drivers.push({
                    id: $scope.drivers.length + 1,
                    coords: {
                        latitude: args[0].latLng.lat(),
                        longitude: args[0].latLng.lng(),
                    },
                    options: {
                        labelContent: $scope.drivers.length + 1,
                        labelAnchor: '11 35',
                        labelClass: 'marker-label',
                        labelInBackground: true,
                        labelStyle: {
                            'font-size': '12px',
                            'color': 'black',
                            'width': '22px',
                            'height': '22px',
                            'background-color': 'rgba(255,255,255,1)',
                            'text-align': 'center',
                            'border-top-left-radius': '11px',
                            'border-top-right-radius': '11px',
                            'border-bottom-left-radius': '11px',
                            'border-bottom-right-radius': '11px',
                            'line-height': '22px'
                        },
                        //animation: google.maps.Animation.DROP,
                        icon: {
                            url: '/includes/images/car1.png',
                            scaledSize: new google.maps.Size(30, 41),
                        }
                    },
                    pax: 4,
                    corating: 100,
                    bookings: 100,
                    hours: 1,
                    rating: 3
                });
            }
            if ($scope.adding == 'BOOKINGS') {
                $scope.bookings.push({
                    id: $scope.bookings.length + 1,
                    coords: {
                        latitude: args[0].latLng.lat(),
                        longitude: args[0].latLng.lng(),
                    },
                    options: {
                        labelContent: $scope.bookings.length + 1,
                        labelAnchor: '11 37',
                        labelClass: 'marker-label',
                        labelInBackground: true,
                        labelStyle: {
                            'font-size': '12px',
                            'color': 'black',
                            'width': '22px',
                            'height': '22px',
                            'background-color': 'rgba(255,255,255,1)',
                            'text-align': 'center',
                            'border-top-left-radius': '11px',
                            'border-top-right-radius': '11px',
                            'border-bottom-left-radius': '11px',
                            'border-bottom-right-radius': '11px',
                            'line-height': '22px'
                        },
                        //animation: google.maps.Animation.DROP,
                        icon: '/includes/images/user.png'
                    },
                    dispatchInfo: null,
                    pax: 1,
                    priority: 1,
                    clientId: null
                });
            }
            $scope.$apply()
        }

        function runDispatch() {
            $scope.dispatchStarted = true;
            var driversformatted = $scope.drivers.map(function(d) { return { id: d.id, latitude: d.coords.latitude, longitude: d.coords.longitude, pax: d.pax, corating: d.corating, bookings: d.bookings, hours: d.hours, rating: d.rating } });
            var bookingsformatted = $scope.bookings.map(function(d) { return { id: d.id, latitude: d.coords.latitude, longitude: d.coords.longitude, pax: d.pax, priority: d.priority, clientId: d.clientId } });
            angular.forEach($scope.bookings, function(b) {
                b.dispatchInfo = null;
                b.$driver = null;
                b.$details = false;
            });
            angular.forEach($scope.drivers, function(b) {
                b.dispatchInfo = null;
                b.$booking = null;
                b.$details = false;
            });
            $scope.pairedLines = [];
            $http.post($config.API_ENDPOINT + "api/dispatch", {
                Drivers: driversformatted,
                Bookings: bookingsformatted,
                Settings: $scope.settings
            }).success(function(response) {
                console.log(response);
                if (!response.results) {
                    response.results = response.Bookings;
                }
                $scope.idToDriverMapping = response.idToDriverMapping;
                $scope.idToBookingMapping = response.idToBookingMapping;
                var id = 1;
                angular.forEach(response.results, function(result) {
                    var local = response.idToBookingMapping[result.BookingId];
                    var foundB = $scope.bookings.filter(function(b) { return b.id == local; })[0]
                    if (foundB) {
                        foundB.dispatchInfo = result;
                        foundB.lines = [];
                        angular.forEach(result.Pairings, function(x) {
                            //TODO: remove before release
                            x.Eligable = true;
                            foundB.lines.push({
                                id: id++,
                                static: false,
                                path: [
                                    new google.maps.LatLng(foundB.coords.latitude, foundB.coords.longitude),
                                    new google.maps.LatLng(x.Driver.LastKnownLatitude, x.Driver.LastKnownLongitude)
                                ],
                                stroke: {
                                    color: (x.TotalScore > 0.8) ? '#008800' : ((x.TotalScore == 0.5) ? '#FFFF00' : ((x.TotalScore == 0.25) ? '#DD0000' : '#000000')),
                                    weight: 3,
                                    opacity: 0.8
                                },

                            })
                        });

                        if (result.ChoosenPairing) {
                            $scope.pairedLines.push({
                                id: id++,
                                static: false,
                                path: [
                                    new google.maps.LatLng(foundB.coords.latitude, foundB.coords.longitude),
                                    new google.maps.LatLng(result.ChoosenPairing.Driver.LastKnownLatitude, result.ChoosenPairing.Driver.LastKnownLongitude)
                                ],
                                stroke: {
                                    color: (result.ChoosenPairing.TotalScore > 0.8) ? '#008800' : ((result.ChoosenPairing.TotalScore == 0.5) ? '#FFFF00' : ((result.ChoosenPairing.TotalScore == 0.25) ? '#DD0000' : '#000000')),
                                    weight: 3,
                                    opacity: 0.8
                                }
                            })
                            var localD = response.idToDriverMapping[result.ChoosenPairing.DriverId];
                            var foundD = $scope.drivers.filter(function(b) { return b.id == localD; })[0]
                            if (foundD) {
                                foundD.dispatchInfo = result;
                                foundB.$driver = foundD
                                foundD.$booking = foundB
                            }

                        }
                    }
                    $scope.dispatchStarted = false;
                });
                $scope.selected.B = $scope.pairedLines;
            }).error(function(response) {
                console.log(response)
                $scope.dispatchStarted = false;
            })
        }
    }

    SettingsDispatchLiveController.$inject = ['$scope', 'rData', 'Model', '$interval', 'rCompany', '$http', '$config', 'rClients'];

    function SettingsDispatchLiveController($scope, rData, Model, $interval, rCompany, $http, $config, rClients) {
        $scope.company = rCompany[0];
        $scope.clients = rClients;
        $scope.map = {
            center: {
                latitude: $scope.company.BaseLatitude || 52,
                longitude: $scope.company.BaseLongitude || 0
            },
            zoom: 12,
            events: {
                click: mapClick
            }
        };
        $scope.show = {
            advanced: false,
            settings: true,
            bookings: true,
            drivers: true
        }
        $scope.selected = {
            B: null
        };

        $scope.pairedLines = [];
        fetchNow();

        $scope.markerOptions = {
            animation: google.maps.Animation.DROP,
            coords: {
                latitude: $scope.company.BaseLatitude || 52,
                longitude: $scope.company.BaseLongitude || 0
            },
            icon: {
                url: '/includes/images/marker.png',
                scaledSize: new google.maps.Size(48, 48)
            },
        }

        $scope.paused = false;
        $scope.pause = function() {
            $scope.paused = true;
        }
        $scope.unpause = function() {
            $scope.paused = false;
        }

        $interval(function() {
            if (!$scope.paused) {
                fetchNow();
            }
        }, 10000);

        var id = 0;

        $scope.onMouseEnter = onMouseEnter;
        $scope.onMouseLeave = onMouseLeave;

        function fetchNow() {
            $scope.pairedLines.length = 0;
            $http.get($config.API_ENDPOINT + '/api/test/result').then(function(response) {
                $scope.data = response.data;
                var data = response.data;

                for (var i = 0; i < data.Drivers.length; i++) {
                    data.Drivers[i].id = 'D:' + i;
                    data.Drivers[i].coords = {
                        latitude: data.Drivers[i].LastKnownLatitude,
                        longitude: data.Drivers[i].LastKnownLongitude
                    };
                    data.Drivers[i].options = {
                        labelContent: data.Drivers[i].DriverCallsign,
                        labelAnchor: '11 35',
                        labelClass: 'marker-label',
                        labelInBackground: true,
                        labelStyle: {
                            'font-size': '12px',
                            'color': 'black',
                            'width': '22px',
                            'height': '22px',
                            'background-color': 'rgba(255,255,255,1)',
                            'text-align': 'center',
                            'border-top-left-radius': '11px',
                            'border-top-right-radius': '11px',
                            'border-bottom-left-radius': '11px',
                            'border-bottom-right-radius': '11px',
                            'line-height': '22px'
                        },
                        //animation: google.maps.Animation.DROP,
                        icon: {
                            url: '/includes/images/car1.png',
                            scaledSize: new google.maps.Size(30, 41),
                        }
                    };
                }


                for (var i = 0; i < data.Bookings.length; i++) {
                    data.Bookings[i].id = 'B:' + i;
                    data.Bookings[i].coords = {
                        latitude: data.Bookings[i].PickupLatitude,
                        longitude: data.Bookings[i].PickupLongitude
                    };
                    data.Bookings[i].options = {
                        labelAnchor: '11 37',
                        labelClass: 'marker-label',
                        labelInBackground: true,
                        labelStyle: {
                            'font-size': '12px',
                            'color': 'black',
                            'width': '22px',
                            'height': '22px',
                            'background-color': 'rgba(255,255,255,1)',
                            'text-align': 'center',
                            'border-top-left-radius': '11px',
                            'border-top-right-radius': '11px',
                            'border-bottom-left-radius': '11px',
                            'border-bottom-right-radius': '11px',
                            'line-height': '22px'
                        },
                        //animation: google.maps.Animation.DROP,
                        icon: '/includes/images/user.png'
                    };

                    data.Bookings[i].lines = [];
                    angular.forEach(data.Bookings[i].Pairings, function(x) {
                        data.Bookings[i].lines.push({
                            id: id++,
                            static: false,
                            path: [
                                new google.maps.LatLng(data.Bookings[i].PickupLatitude, data.Bookings[i].PickupLongitude),
                                new google.maps.LatLng(x.Driver.LastKnownLatitude, x.Driver.LastKnownLongitude)
                            ],
                            stroke: {
                                color: (x.TotalScore >= 0.8) ? '#008800' : ((x.TotalScore >= 0.5) ? '#FFFF00' : ((x.TotalScore >= 0.25) ? '#DD0000' : '#000000')),
                                weight: 3,
                                opacity: 0.8
                            },

                        })
                    });

                    if (data.Bookings[i].ChoosenPairing) {
                        $scope.pairedLines.push({
                            id: id++,
                            static: false,
                            path: [
                                new google.maps.LatLng(data.Bookings[i].PickupLatitude, data.Bookings[i].PickupLongitude),
                                new google.maps.LatLng(data.Bookings[i].ChoosenPairing.Driver.LastKnownLatitude, data.Bookings[i].ChoosenPairing.Driver.LastKnownLongitude)
                            ],
                            stroke: {
                                color: (data.Bookings[i].ChoosenPairing.TotalScore > 0.8) ? '#008800' : ((data.Bookings[i].ChoosenPairing.TotalScore >= 0.5) ? '#FFFF00' : ((data.Bookings[i].ChoosenPairing.TotalScore >= 0.25) ? '#DD0000' : '#000000')),
                                weight: 3,
                                opacity: 0.8
                            }
                        })
                    }
                }
            });
        }

        function onMouseEnter(b, d) {
            //$timeout(function () {
            if (b) {
                b.options.labelStyle.color = 'white';
                b.options.labelStyle['background-color'] = 'black';
                $scope.selected.B = b.lines;
                if (b.$driver) {
                    b.$driver.options.labelStyle.color = 'white';
                    b.$driver.options.labelStyle['background-color'] = 'black';
                }
            }
            if (d) {
                d.options.labelStyle.color = 'white';
                d.options.labelStyle['background-color'] = 'black';
                if (d.$booking) {
                    d.$booking.options.labelStyle.color = 'white';
                    d.$booking.options.labelStyle['background-color'] = 'black';
                }
            }
            //}, 50);
        }

        function onMouseLeave(b, d) {
            if (b) {
                b.options.labelStyle.color = 'black';
                b.options.labelStyle['background-color'] = 'white';
                $scope.selected.B = $scope.pairedLines;
                if (b.$driver) {
                    b.$driver.options.labelStyle.color = 'black';
                    b.$driver.options.labelStyle['background-color'] = 'white';
                }
            }
            if (d) {
                d.options.labelStyle.color = 'black';
                d.options.labelStyle['background-color'] = 'white';
                if (d.$booking) {
                    d.$booking.options.labelStyle.color = 'black';
                    d.$booking.options.labelStyle['background-color'] = 'white';
                }
            }
        }

        function mapClick(map, eventName, args) {
            if ($scope.adding == 'DRIVERS') {
                $scope.drivers.push({
                    id: $scope.drivers.length + 1,
                    coords: {
                        latitude: args[0].latLng.lat(),
                        longitude: args[0].latLng.lng(),
                    },
                    options: {
                        labelContent: $scope.drivers.length + 1,
                        labelAnchor: '11 35',
                        labelClass: 'marker-label',
                        labelInBackground: true,
                        labelStyle: {
                            'font-size': '12px',
                            'color': 'black',
                            'width': '22px',
                            'height': '22px',
                            'background-color': 'rgba(255,255,255,1)',
                            'text-align': 'center',
                            'border-top-left-radius': '11px',
                            'border-top-right-radius': '11px',
                            'border-bottom-left-radius': '11px',
                            'border-bottom-right-radius': '11px',
                            'line-height': '22px'
                        },
                        //animation: google.maps.Animation.DROP,
                        icon: {
                            url: '/includes/images/car1.png',
                            scaledSize: new google.maps.Size(30, 41),
                        }
                    },
                    pax: 4,
                    corating: 100,
                    bookings: 100,
                    hours: 1,
                    rating: 3
                });
            }
            if ($scope.adding == 'BOOKINGS') {
                $scope.bookings.push({
                    id: $scope.bookings.length + 1,
                    coords: {
                        latitude: args[0].latLng.lat(),
                        longitude: args[0].latLng.lng(),
                    },
                    options: {
                        labelContent: $scope.bookings.length + 1,
                        labelAnchor: '11 37',
                        labelClass: 'marker-label',
                        labelInBackground: true,
                        labelStyle: {
                            'font-size': '12px',
                            'color': 'black',
                            'width': '22px',
                            'height': '22px',
                            'background-color': 'rgba(255,255,255,1)',
                            'text-align': 'center',
                            'border-top-left-radius': '11px',
                            'border-top-right-radius': '11px',
                            'border-bottom-left-radius': '11px',
                            'border-bottom-right-radius': '11px',
                            'line-height': '22px'
                        },
                        //animation: google.maps.Animation.DROP,
                        icon: '/includes/images/user.png'
                    },
                    dispatchInfo: null,
                    pax: 1,
                    priority: 1,
                    clientId: null
                });
            }
            $scope.$apply()
        }

        function runDispatch() {
            $scope.dispatchStarted = true;
            var driversformatted = $scope.drivers.map(function(d) { return { id: d.id, latitude: d.coords.latitude, longitude: d.coords.longitude, pax: d.pax, corating: d.corating, bookings: d.bookings, hours: d.hours, rating: d.rating } });
            var bookingsformatted = $scope.bookings.map(function(d) { return { id: d.id, latitude: d.coords.latitude, longitude: d.coords.longitude, pax: d.pax, priority: d.priority, clientId: d.clientId } });
            angular.forEach($scope.bookings, function(b) {
                b.dispatchInfo = null;
                b.$driver = null;
                b.$details = false;
            });
            angular.forEach($scope.drivers, function(b) {
                b.dispatchInfo = null;
                b.$booking = null;
                b.$details = false;
            });
            $scope.pairedLines = [];
            $http.post($config.API_ENDPOINT + "api/dispatch", {
                Drivers: driversformatted,
                Bookings: bookingsformatted,
                Settings: $scope.settings
            }).success(function(response) {
                console.log(response);
                if (!response.results) {
                    response.results = response.Bookings;
                }
                $scope.idToDriverMapping = response.idToDriverMapping;
                $scope.idToBookingMapping = response.idToBookingMapping;
                var id = 1;
                angular.forEach(response.results, function(result) {
                    var local = response.idToBookingMapping[result.BookingId];
                    var foundB = $scope.bookings.filter(function(b) { return b.id == local; })[0]
                    if (foundB) {
                        foundB.dispatchInfo = result;
                        foundB.lines = [];
                        angular.forEach(result.Pairings, function(x) {
                            //TODO: remove before release
                            x.Eligable = true;
                            foundB.lines.push({
                                id: id++,
                                static: false,
                                path: [
                                    new google.maps.LatLng(foundB.coords.latitude, foundB.coords.longitude),
                                    new google.maps.LatLng(x.Driver.LastKnownLatitude, x.Driver.LastKnownLongitude)
                                ],
                                stroke: {
                                    color: (x.TotalScore > 0.8) ? '#008800' : ((x.TotalScore == 0.5) ? '#FFFF00' : ((x.TotalScore == 0.25) ? '#DD0000' : '#000000')),
                                    weight: 3,
                                    opacity: 0.8
                                },

                            })
                        });

                        if (result.ChoosenPairing) {
                            $scope.pairedLines.push({
                                id: id++,
                                static: false,
                                path: [
                                    new google.maps.LatLng(foundB.coords.latitude, foundB.coords.longitude),
                                    new google.maps.LatLng(result.ChoosenPairing.Driver.LastKnownLatitude, result.ChoosenPairing.Driver.LastKnownLongitude)
                                ],
                                stroke: {
                                    color: (result.ChoosenPairing.TotalScore > 0.8) ? '#008800' : ((result.ChoosenPairing.TotalScore == 0.5) ? '#FFFF00' : ((result.ChoosenPairing.TotalScore == 0.25) ? '#DD0000' : '#000000')),
                                    weight: 3,
                                    opacity: 0.8
                                }
                            })
                            var localD = response.idToDriverMapping[result.ChoosenPairing.DriverId];
                            var foundD = $scope.drivers.filter(function(b) { return b.id == localD; })[0]
                            if (foundD) {
                                foundD.dispatchInfo = result;
                                foundB.$driver = foundD
                                foundD.$booking = foundB
                            }

                        }
                    }
                    $scope.dispatchStarted = false;
                });
                $scope.selected.B = $scope.pairedLines;
            }).error(function(response) {
                console.log(response)
                $scope.dispatchStarted = false;
            })
        }
    }


    SettingsDispatchDetailsController.$inject = ['$scope', '$state', '$q', '$UI', '$modal', 'rData', 'Model', 'rOverrides'];

    function SettingsDispatchDetailsController($scope, $state, $q, $UI, $modal, rData, Model, rOverrides) {
        $scope.item = rData[0] || new Model.DispatchSettings();
        $scope.overrides = rOverrides.filter(function(x) { return !x.IsRank; });
        $scope.ranks = rOverrides.filter(function(x) { return x.IsRank; });

        $scope.item.$profile = determineProfile($scope.item);
        $scope.show = { advanced: false };
        $scope.verticalSlider = {
            TimeWeighting: buildSliderOptions('TimeWeighting', $scope.item),
            GreenWeighting: buildSliderOptions('GreenWeighting', $scope.item),
            FairnessWeighting: buildSliderOptions('FairnessWeighting', $scope.item),
            EmptyWeighting: buildSliderOptions('EmptyWeighting', $scope.item),
            RatingWeighting: buildSliderOptions('RatingWeighting', $scope.item)
        }

        function buildSliderOptions(id, item) {
            var ident = id;
            return {
                options: {
                    id: ident,
                    floor: 0,
                    step: 0.1,
                    precision: 1,
                    ceil: 1,
                    translate: function(value) {
                        return value;
                    },
                    onEnd: function (id) {
                        $scope.item.$profile = 'Custom';
                        var sum = item.TimeWeighting + item.RatingWeighting + item.FairnessWeighting + item.GreenWeighting + item.EmptyWeighting;
                        if (sum > 1) {
                            item[id] = Math.max(item[id] - (sum - 1), 0);
                        }
                    }
                }
            }
        }

        $scope.profiles = {
            NearestFirst: [1, 0, 0, 0, 0],
            EmptyLongest: [0.3, 0, 0, 0, 0.7],
            BalanceEarnings: [0.3, 0, 0.5, 0, 0.2],
            Balanced: [0.5, 0, 0.2, 0.1, 0.2],
            BestDriver: [0.3, 0, 0.1, 0.4, 0.2],
            LowEmissions: [0.6, 0.4, 0, 0, 0],
            Custom: [0, 0, 0, 0, 0]
        }



        for (var i = 0; i < $scope.overrides.length; i++) {
            $scope.overrides[i].$profile = determineProfile($scope.overrides[i]);
        }

        function determineProfile(settings) {
            var result = 'Custom';
            for (var profileName in $scope.profiles) {
                var mappings = $scope.profiles[profileName];
                if (
                    mappings[0] == settings.TimeWeighting &&
                    mappings[1] == settings.GreenWeighting &&
                    mappings[2] == settings.FairnessWeighting &&
                    mappings[3] == settings.RatingWeighting &&
                    mappings[4] == settings.EmptyWeighting
                ) {
                    result = profileName;
                }
            }
            return result;
        }

        $scope.viewMode = "VIEW";
        $scope.reset = reset;
        $scope.startEdit = startEdit;
        $scope.saveEdits = saveEdits;

        $scope.addOverride = addOverride;
        $scope.editOverride = editOverride;

        $scope.addRank = addRank;
        $scope.removeRank = removeRank;

        $scope.$watch('item.$profile', function(newvalue) {
            if (!!newvalue) {
                if (newvalue != 'Custom') {
                    var profile = $scope.profiles[newvalue];
                    $scope.item.TimeWeighting = profile[0];
                    $scope.item.GreenWeighting = profile[1];
                    $scope.item.FairnessWeighting = profile[2];
                    $scope.item.RatingWeighting = profile[3];
                    $scope.item.EmptyWeighting = profile[4];
                }
            }
        });

        function startEdit() {
            $scope.viewMode = "EDIT";
        }

        function addOverride() {
            var existing = $scope.overrides;
            var om = $scope.item.OverrideMode;
            var profiles = $scope.profiles;
            $modal.open({
                size: 'lg',
                templateUrl: '/webapp/management/settings/dispatch/override.modal.html',
                controller: ['$scope', '$modalInstance', 'rOverride', 'rClients', '$filter', function($scope, $modalInstance, rOverride, rClients, $filter) {
                    $scope.item = rOverride;
                    $scope.item.$profile = 'NearestFirst';
                    $scope.clients = rClients;
                    $scope.fetchedClients = [];
                    $scope.overrideMode = om;
                    $scope.profiles = profiles;
                    $scope.week = [{
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
                    }, {
                        day: "Su",
                        value: 1,
                        selected: false,
                        full: "Sunday"
                    }];

                    $scope.verticalSlider = {
                        TimeWeighting: buildSliderOptions('TimeWeighting', $scope.item),
                        GreenWeighting: buildSliderOptions('GreenWeighting', $scope.item),
                        FairnessWeighting: buildSliderOptions('FairnessWeighting', $scope.item),
                        EmptyWeighting: buildSliderOptions('EmptyWeighting', $scope.item),
                        RatingWeighting: buildSliderOptions('RatingWeighting', $scope.item)
                    }


                    $scope.save = save;
                    $scope.cancel = cancel;
                    $scope.searchClients = searchClients;

                    $scope.$watch('item.$profile', function(newvalue) {
                        if (!!newvalue) {
                            if (newvalue != 'Custom') {
                                var profile = $scope.profiles[newvalue];
                                $scope.item.TimeWeighting = profile[0];
                                $scope.item.GreenWeighting = profile[1];
                                $scope.item.FairnessWeighting = profile[2];
                                $scope.item.RatingWeighting = profile[3];
                                $scope.item.EmptyWeighting = profile[4];
                            }
                        }
                    });

                    function save() {
                        if ($scope.week.filter(function(day) {
                                return day.selected == true
                            }).length > 0) {
                            $scope.item.DaysOfWeek = $scope.week.reduce(function(prev, day) {
                                if (day.selected) {
                                    return prev + day.value;
                                } else {
                                    return prev;
                                }
                            }, 0);
                        } else {
                            $scope.item.DaysOfWeek = null;
                        }

                        if ($scope.item.PaymentType == 'All') {
                            $scope.item.PaymentType = null;
                        }
                        var today = moment.utc().startOf('day');
                        if ($scope.item.$startTime && $scope.item.$endTime) {
                            var start = moment.utc($scope.item.$startTime);
                            var end = moment.utc($scope.item.$endTime);

                            $scope.item.StartTime = 0 + (start.hours() * 60)  + start.minutes();
                            $scope.item.EndTime = 0 + (end.hours() * 60)  + end.minutes();

                            if ($scope.item.EndTime === 0) {
                                $scope.item.EndTime = 1440;
                            }

                            if($scope.item.EndTime < $scope.item.StartTime) {
                                $scope.item.EndTime = $scope.item.EndTime + 1440;
                            }
                        }

                        $scope.item.$save().then(function(d) {
                            swal('Success', 'Dispatch Override Saved', 'success');
                            existing.push($scope.item);
                            if ($scope.item.ClientId) {
                                $scope.item.Client = $scope.clients.find(function(x) { return x.Id == $scope.item.ClientId });
                            }
                            $scope.item.DaysOfWeek = d.data.DaysOfWeek;
                            $modalInstance.dismiss();
                        });
                    }

                    function cancel() {
                        $modalInstance.dismiss();
                    }

                    function searchClients(searchText) {
                        if (searchText && searchText.length > 2) {
                            $scope.fetchedClients = $filter('filter')($scope.clients, {
                                Name: searchText
                            });
                        } else {
                            $scope.fetchedClients = [];
                        }
                    }
                }],
                resolve: {
                    rOverride: function() {
                        return new Model.DispatchOverrides({
                            Strength: 10,
                            PaymentType: 'All',
                            TimeWeighting: 1,
                            GreenWeighting: 0,
                            FairnessWeighting: 0,
                            RatingWeighting: 0,
                            EmptyWeighting: 0
                        });
                    },
                    rClients: ['Model', function(Model) {
                        return Model.Client.query().select('Id,Name').execute();
                    }]
                }
            })
        }

        function editOverride(o) {
            var existing = $scope.overrides;
            var om = $scope.item.OverrideMode;
            var profiles = $scope.profiles;

            $modal.open({
                size: 'lg',
                templateUrl: '/webapp/management/settings/dispatch/override.modal.html',
                controller: ['$scope', '$modalInstance', 'rOverride', 'rClients', '$filter', function($scope, $modalInstance, rOverride, rClients, $filter) {
                    $scope.item = rOverride;

                    if (!$scope.item.PaymentType) {
                        $scope.item.PaymentType = 'All';
                    }

                    if ($scope.item.StartTime) {
                        $scope.item.$startTime = moment.utc().startOf('day').add($scope.item.StartTime, 'minutes').toDate();
                    }

                    if ($scope.item.EndTime) {
                        $scope.item.$endTime = moment.utc().startOf('day').add($scope.item.EndTime, 'minutes').toDate();
                    }

                    $scope.clients = rClients;
                    $scope.fetchedClients = rClients;
                    $scope.overrideMode = om;
                    $scope.profiles = profiles;
                    $scope.verticalSlider = {
                        TimeWeighting: buildSliderOptions('TimeWeighting', $scope.item),
                        GreenWeighting: buildSliderOptions('GreenWeighting', $scope.item),
                        FairnessWeighting: buildSliderOptions('FairnessWeighting', $scope.item),
                        EmptyWeighting: buildSliderOptions('EmptyWeighting', $scope.item),
                        RatingWeighting: buildSliderOptions('RatingWeighting', $scope.item)
                    }

                    $scope.week = [{
                            day: "Mo",
                            value: 2,
                            selected: $scope.item.DaysOfWeek && $scope.item.DaysOfWeek.indexOf('Monday') != -1,
                            full: "Monday"
                        }, {
                            day: "Tu",
                            value: 4,
                            selected: $scope.item.DaysOfWeek && $scope.item.DaysOfWeek.indexOf('Tuesday') != -1,
                            full: "Tuesday"
                        }, {
                            day: "We",
                            value: 8,
                            selected: $scope.item.DaysOfWeek && $scope.item.DaysOfWeek.indexOf('Wednesday') != -1,
                            full: "Wednesday"
                        }, {
                            day: "Th",
                            value: 16,
                            selected: $scope.item.DaysOfWeek && $scope.item.DaysOfWeek.indexOf('Thursday') != -1,
                            full: "Thursday"
                        }, {
                            day: "Fr",
                            value: 32,
                            selected: $scope.item.DaysOfWeek && $scope.item.DaysOfWeek.indexOf('Friday') != -1,
                            full: "Friday"
                        }, {
                            day: "Sa",
                            value: 64,
                            selected: $scope.item.DaysOfWeek && $scope.item.DaysOfWeek.indexOf('Saturday') != -1,
                            full: "Saturday"
                        },
                        {
                            day: "Su",
                            value: 1,
                            selected: $scope.item.DaysOfWeek && $scope.item.DaysOfWeek.indexOf('Sunday') != -1,
                            full: "Sunday"
                        }
                    ];

                    $scope.save = save;
                    $scope.cancel = cancel;
                    $scope.deleteOverride = deleteOverride;
                    $scope.searchClients = searchClients;

                    $scope.$watch('item.$profile', function(newvalue) {
                        if (!!newvalue) {
                            if (newvalue != 'Custom') {
                                var profile = $scope.profiles[newvalue];
                                $scope.item.TimeWeighting = profile[0];
                                $scope.item.GreenWeighting = profile[1];
                                $scope.item.FairnessWeighting = profile[2];
                                $scope.item.RatingWeighting = profile[3];
                                $scope.item.EmptyWeighting = profile[4];
                            }
                        }
                    });

                    function save() {
                        if ($scope.week.filter(function(day) {
                                return day.selected == true
                            }).length > 0) {
                            $scope.item.DaysOfWeek = $scope.week.reduce(function(prev, day) {
                                if (day.selected) {
                                    return prev + day.value;
                                } else {
                                    return prev;
                                }
                            }, 0);
                        } else {
                            $scope.item.DaysOfWeek = null;
                        }

                        if ($scope.item.PaymentType == 'All') {
                            $scope.item.PaymentType = null;
                        }

                        if ($scope.item.$startTime && $scope.item.$endTime) {
                            var start = moment.utc($scope.item.$startTime);
                            var end = moment.utc($scope.item.$endTime);

                            $scope.item.StartTime = 0 + (start.hours() * 60)  + start.minutes();
                            $scope.item.EndTime = 0 + (end.hours() * 60)  + end.minutes();

                            if ($scope.item.EndTime === 0) {
                                $scope.item.EndTime = 1440;
                            }

                            if($scope.item.EndTime < $scope.item.StartTime) {
                                $scope.item.EndTime = $scope.item.EndTime + 1440;
                            }
                        }

                        $scope.item.$patch().then(function(d) {
                            swal('Success', 'Dispatch Override Saved', 'success');
                            if ($scope.item.ClientId) {
                                $scope.item.Client = $scope.clients.find(function(x) { return x.Id == $scope.item.ClientId });
                            }
                            $scope.item.DaysOfWeek = d.data.DaysOfWeek;
                            $modalInstance.dismiss();
                        });
                    }

                    function cancel() {
                        $scope.item.$rollback();
                        $modalInstance.dismiss();
                    }

                    function searchClients(searchText) {
                        if (searchText && searchText.length > 2) {
                            $scope.fetchedClients = $filter('filter')($scope.clients, {
                                Name: searchText
                            });
                        } else {
                            $scope.fetchedClients = [];
                        }
                    }

                    function deleteOverride() {
                        $scope.item.$delete().then(function() {
                            swal('Success', 'Dispatch Override Deleted', 'success');
                            var index = existing.indexOf($scope.item);
                            existing.splice(index, 1);
                            $modalInstance.dismiss();
                        });
                    }
                }],
                resolve: {
                    rOverride: function() {
                        return o;
                    },
                    rClients: ['Model', function(Model) {
                        return Model.Client.query().select('Id,Name').execute();
                    }]
                }
            })
        }

        function addRank() {
            var existing = $scope.ranks;
            $modal.open({
                size: 'lg',
                templateUrl: '/webapp/management/settings/dispatch/rank.modal.html',
                controller: ['$scope', '$modalInstance', 'rOverride', 'rZones', function($scope, $modalInstance, rOverride, rZones) {
                    $scope.item = rOverride;
                    $scope.zones = rZones;

                    $scope.save = save;
                    $scope.cancel = cancel;

                    $scope.week = [{
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
                    }, {
                        day: "Su",
                        value: 1,
                        selected: false,
                        full: "Sunday"
                    }];

                    function save() {
                        if ($scope.week.filter(function(day) {
                                return day.selected == true
                            }).length > 0) {
                            $scope.item.DaysOfWeek = $scope.week.reduce(function(prev, day) {
                                if (day.selected) {
                                    return prev + day.value;
                                } else {
                                    return prev;
                                }
                            }, 0);
                        } else {
                            $scope.item.DaysOfWeek = null;
                        }

                        if ($scope.item.$startTime && $scope.item.$endTime) {
                            var start = moment.utc($scope.item.$startTime);
                            var end = moment.utc($scope.item.$endTime);

                            $scope.item.StartTime = 0 + (start.hours() * 60)  + start.minutes();
                            $scope.item.EndTime = 0 + (end.hours() * 60)  + end.minutes();

                            if ($scope.item.EndTime === 0) {
                                $scope.item.EndTime = 1440;
                            }

                            if($scope.item.EndTime < $scope.item.StartTime) {
                                $scope.item.EndTime = $scope.item.EndTime + 1440;
                            }
                        }

                        $scope.item.$save().then(function(d) {
                            swal('Success', 'Rank Saved', 'success');
                            $scope.item.Zone = $scope.zones.find(function(x) { return x.Id == $scope.item.ZoneId; });
                            existing.push($scope.item);
                            $scope.item.DaysOfWeek = d.data.DaysOfWeek;
                            $modalInstance.dismiss();
                        });
                    }

                    function cancel() {
                        $modalInstance.dismiss();
                    }
                }],
                resolve: {
                    rOverride: function() {
                        return new Model.DispatchOverrides({
                            IsRank: true
                        });
                    },
                    rZones: ['Model', function(Model) {
                        return Model.Zone.query().select('Id,Name,Description').execute();
                    }]
                }
            })
        }

        function removeRank(o) {
            o.$delete().then(function() {
                swal('Deleted', 'Rank removed', 'success');
                var index = $scope.ranks.indexOf(o);
                $scope.ranks.splice(index, 1);
            })
        }

        function saveEdits(item) {
            if (item.Id) {
                item.$patch().success(function(result) {
                    swal('Saved!', 'Dispatch Settings Saved', 'success');
                    $scope.viewMode = 'VIEW';
                }).error(function() {
                    swal('Error!', 'Dispatch Settings could not be Saved', 'error');
                })
            } else {
                item.$save().success(function(result) {
                    item.Id = result.Id;
                    swal('Saved!', 'Dispatch Settings Created', 'success');
                    $scope.viewMode = 'VIEW';
                }).error(function() {
                    swal('Error!', 'Dispatch Settings could not be Saved', 'error');
                })
            }
        }

        function reset(item) {
            item.$rollback();
            $scope.viewMode = "VIEW";
        }
    }
})()