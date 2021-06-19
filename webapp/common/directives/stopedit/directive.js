(function (angular) {
    var module = angular.module('framework.directives.UI');

    module.directive('stopEdit', stopEdit);

    stopEdit.$inject = ['$parse', '$UI', '$http', '$config', '$modal', '$filter', '$timeout'];

    function stopEdit($parse, $UI, $http, $config, $modal, $filter, $timeout) {
        return {
            scope: true,
            templateUrl: '/webapp/common/directives/stopedit/template.html',
            link: function (scope, elem, attrs) {
                var getter = $parse(attrs['model']);
                var historicGetter = null;
                var knownGetter = null;
                scope.tI = parseInt(attrs['tabIndex']);
                scope.hideEdit = !!attrs['hideEdit'];
                if (attrs['external']) {
                    historicGetter = $parse(attrs['external']);
                }
                if (attrs['known']) {
                    knownGetter = $parse(attrs['known']);
                }
                var service = new google.maps.places.AutocompleteService();
                var placeService = new google.maps.places.PlacesService(document.getElementById('mapsDiv'));

                var existing = null;
                var e = getter(scope);
                if (e.StopSummary) {
                    existing = angular.copy(e || {});
                    existing.$source = 'Previous';
                    scope.fetchedLocations = [existing];
                } else {
                    scope.fetchedLocations = [];
                }
                scope.selected = {
                    value: existing
                };

                scope.locationSet = false;
                var skipSearch = false;

                var filterFn = $filter('filter');
                var limitFn = $filter('limitTo');

                scope.editStop = editStop;

                function editStop(index) {
                    var modalInstance = $modal.open({
                        templateUrl: '/webapp/common/modals/bookings/stop-address/modal.html',
                        controller: 'BookingStopEditModalController',
                        resolve: {
                            rStop: function () {
                                return angular.copy(getter(scope));

                            }
                        }
                    })
                    modalInstance.result.then(function (data) {
                            data.$source = null;
                            scope.selected.value = data;
                        },
                        function () {});
                }
                scope.searchLocations = searchLocations;

                scope.safeApply = function (fn) {
                    var phase = this.$root.$$phase;
                    if (phase == '$apply' || phase == '$digest') {
                        if (fn && (typeof (fn) === 'function')) {
                            fn();
                        }
                    } else {
                        this.$apply(fn);
                    }
                };

                var postcodeRegex = /^(([gG][iI][rR] {0,}0[aA]{2})|((([a-pr-uwyzA-PR-UWYZ][a-hk-yA-HK-Y]?[0-9][0-9]?)|(([a-pr-uwyzA-PR-UWYZ][0-9][a-hjkstuwA-HJKSTUW])|([a-pr-uwyzA-PR-UWYZ][a-hk-yA-HK-Y][0-9][abehmnprv-yABEHMNPRV-Y]))) {0,}[0-9][abd-hjlnp-uw-zABD-HJLNP-UW-Z]{2}))$/;
                var what3wordsRegex = /^(\/\/\/)?\w+[\s\.]\w+[\s\.]\w+$/;
                var searchTypeOrder = ['What3Words', 'Historic Locations', 'Known Locations', 'Postcode Search', 'Location Search', 'Google Search'];

                function orderFn(item) {
                    return searchTypeOrder.indexOf(item.$source);
                }

                function searchLocations(search) {
                    scope.fetchedLocations = [];
                    if (existing) {
                        scope.fetchedLocations.push(existing);
                    }
                    if (scope.viewMode != 'VIEW') {
                        if (historicGetter) {
                            var historic = historicGetter(scope);
                            var historicMatches = limitFn(filterFn(historic, search), 5);
                            angular.forEach(historicMatches, function (model) {
                                model.Id = null;
                                model.BookingId = null;
                                model.$source = 'Historic Locations';
                                if (!model.StopSummary) {
                                    var add = '';
                                    if (model.Address1 && model.Address1.length > 1) {
                                        add += model.Address1;
                                    }
                                    if (model.TownCity) {
                                        if (add.length > 0) {
                                            add += ', ';
                                        }
                                        add += model.TownCity;
                                    } else if (model.Area) {
                                        if (add.length > 0) {
                                            add += ', ';
                                        }
                                        add += model.Area;
                                    }
                                    if (model.Postcode) {
                                        if (add.length > 0) {
                                            add += ', ';
                                        }
                                        add += model.Postcode;
                                    }
                                    model.StopSummary = add;
                                }
                                scope.fetchedLocations.push(model);
                                scope.fetchedLocations = $filter('orderBy')(scope.fetchedLocations, orderFn);
                            });
                        }

                        if (knownGetter) {
                            var known = knownGetter(scope);
                            var knownMatches = limitFn(filterFn(known, search), 5);
                            angular.forEach(knownMatches, function (model) {
                                model.Id = null;
                                model.BookingId = null;
                                model.$source = 'Known Locations';
                                if (!model.StopSummary) {
                                    var add = '';
                                    if (model.Address1 && model.Address1.length > 1) {
                                        add += model.Address1;
                                    }
                                    if (model.TownCity) {
                                        if (add.length > 0) {
                                            add += ', ';
                                        }
                                        add += model.TownCity;
                                    } else if (model.Area) {
                                        if (add.length > 0) {
                                            add += ', ';
                                        }
                                        add += model.Area;
                                    }
                                    if (model.Postcode) {
                                        if (add.length > 0) {
                                            add += ', ';
                                        }
                                        add += model.Postcode;
                                    }
                                    model.StopSummary = add;
                                }
                                scope.fetchedLocations.push(model);
                                scope.fetchedLocations = $filter('orderBy')(scope.fetchedLocations, orderFn);
                            });
                        }

                        if (search && search.length > 3) {
                            if (what3wordsRegex.test(search)) {
                                $http.get($config.API_ENDPOINT + 'api/LocationSearch/what-3-words/suggestions', {
                                    params: {
                                        searchTerm: search
                                    }
                                }).then(function (res) {
                                    var matches = res.data.suggestions;
                                    angular.forEach(matches, function (model) {
                                        scope.fetchedLocations.push({
                                            StopSummary: '///' + model.words + ' (' + model.nearestPlace + ')',
                                            $source: 'What3Words',
                                            $w3w: model.words
                                        });
                                    });
                                    scope.fetchedLocations = $filter('orderBy')(scope.fetchedLocations, orderFn);
                                });
                            }

                            if (postcodeRegex.test(search)) {
                                //scope.postcodeMode = true;
                                var pcode = search;
                                $http.get($config.API_ENDPOINT + 'api/LocationSearch/postcodeSearch', {
                                    params: {
                                        postcode: search,
                                        //number: scope.house
                                    }
                                }).then(function (res) {
                                    var postcodeMatches = ((res.data.Addresses) ? res.data.Addresses : []);
                                    angular.forEach(postcodeMatches, function (model) {
                                        var ss = '';
                                        if (model[0]) {
                                            ss = model[0];
                                        }
                                        if (model[1]) {
                                            if (ss) {
                                                ss = ss + ', ' + model[1];
                                            } else {
                                                ss = model[1];
                                            }
                                        }
                                        if (model[2]) {
                                            if (ss) {
                                                ss = ss + ', ' + model[2];
                                            } else {
                                                ss = model[2];
                                            }
                                        }

                                        scope.fetchedLocations.push({
                                            Latitude: res.data.Latitude,
                                            Longitude: res.data.Longitude,
                                            StopSummary: ss + ', ' + pcode.toUpperCase(),
                                            Address1: model[0],
                                            Address2: model[1],
                                            Area: model[2],
                                            TownCity: model[3],
                                            Postcode: pcode.toUpperCase(),
                                            County: model[4],
                                            $source: 'Postcode Search'
                                        });
                                    });
                                    scope.fetchedLocations = $filter('orderBy')(scope.fetchedLocations, orderFn);
                                });
                            } else {
                                $http.get($config.API_ENDPOINT + 'api/LocationSearch', {
                                    params: {
                                        Id: {},
                                        SearchTerm: search
                                    }
                                }).then(function (res) {
                                    var locationMatches = (res.data) ? res.data : [];
                                    angular.forEach(locationMatches, function (model) {
                                        scope.fetchedLocations.push({
                                            Latitude: model.Latitude,
                                            Longitude: model.Longitude,
                                            Postcode: model.Postcode,
                                            StopSummary: model.Name,
                                            Address1: model.Name,
                                            $source: 'Location Search'
                                        });
                                    });
                                    scope.fetchedLocations = $filter('orderBy')(scope.fetchedLocations, orderFn);
                                });

                                service.getPlacePredictions({
                                    input: search,
                                    bounds: new google.maps.LatLngBounds({
                                        lat: 49.173624,
                                        lng: -11.184082
                                    }, {
                                        lat: 59.326885,
                                        lng: 2.790527
                                    })
                                }, function (pred, status) {
                                    var googleMatches = (pred || [])
                                    angular.forEach(googleMatches, function (model) {
                                        scope.fetchedLocations.push({
                                            StopSummary: model.description,
                                            description: model.description,
                                            place_id: model.place_id,
                                            $source: 'Google Search'
                                        });
                                    });
                                    scope.fetchedLocations = $filter('orderBy')(scope.fetchedLocations, orderFn);
                                    scope.$apply();
                                });
                            }
                        }
                    }
                }

                scope.$watch('selected.value', function (newValue) {
                    if (newValue && newValue.$source == 'Google Search') {
                        setFromGoogle(newValue);
                    } else if (newValue && newValue.$source == 'Previous') {
                        setFromStop(newValue);
                    } else if (newValue && newValue.$source == 'What3Words') {
                        clearOld();
                        setFromWhat3Words(newValue);
                    } else if (newValue) {
                        clearOld();
                        setFromStop(newValue);
                    } else {
                        clearOld();
                    }
                });

                //scope.$watch(function () {
                //    return getter(scope);
                //}, function (newvalue) {
                //    newvalue.$source = 'Previous';
                //    existing = newvalue;
                //});

                scope.$watch(function () {
                    return historicGetter && historicGetter(scope);
                }, function (newValue) {
                    var historicMatches = newValue;
                    scope.fetchedLocations = scope.fetchedLocations.filter(function (x) {
                        return x.$source != "Historic Locations";
                    });
                    angular.forEach(historicMatches, function (model) {
                        model.Id = null;
                        model.BookingId = null;
                        model.$source = 'Historic Locations';
                        if (!model.StopSummary) {
                            var add = '';
                            if (model.Address1 && model.Address1.length > 1) {
                                add += model.Address1;
                            }
                            if (model.Address2 && model.Address2.length > 1) {
                                add += ', ' + model.Address2;
                            }

                            if (model.TownCity) {
                                if (add.length > 0) {
                                    add += ', ';
                                }
                                add += model.TownCity;
                            } else if (model.Area) {
                                if (add.length > 0) {
                                    add += ', ';
                                }
                                add += model.Area;
                            }
                            if (model.Postcode) {
                                if (add.length > 0) {
                                    add += ', ';
                                }
                                add += model.Postcode;
                            }
                            model.StopSummary = add;
                        }
                        scope.fetchedLocations.push(model);
                    });
                }, true);

                scope.$watch(function () {
                    return knownGetter && knownGetter(scope);
                }, function (newValue) {
                    var knownMatches = newValue;
                    scope.fetchedLocations = scope.fetchedLocations.filter(function (x) {
                        return x.$source != "Known Locations";
                    });
                    angular.forEach(knownMatches, function (model) {
                        model.Id = null;
                        model.BookingId = null;
                        model.$source = 'Known Locations';
                        if (!model.StopSummary) {
                            var add = '';
                            if (model.Address1 && model.Address1.length > 1) {
                                add += model.Address1;
                            }
                            if (model.TownCity) {
                                if (add.length > 0) {
                                    add += ', ';
                                }
                                add += model.TownCity;
                            } else if (model.Area) {
                                if (add.length > 0) {
                                    add += ', ';
                                }
                                add += model.Area;
                            }
                            if (model.Postcode) {
                                if (add.length > 0) {
                                    add += ', ';
                                }
                                add += model.Postcode;
                            }
                            model.StopSummary = add;
                        }
                        scope.fetchedLocations.push(model);
                    });
                }, true);

                function setFromWhat3Words(item) {
                    scope.locationSet = true;
                    scope.showLocation = false;
                    skipSearch = true;
                    $http.get($config.API_ENDPOINT + 'api/LocationSearch/what-3-words/select', {
                        params: {
                            value: item.$w3w
                        }
                    }).then(function (res) {
                        var match = res.data;
                        var model = getter(scope);
                        model.Address1 = match.Address1;
                        model.Address2 = match.Address2;
                        if (!model.Address1 || model.Address1.length < 3) {
                            model.Address1 = (model.Address1 || "") + ' ' + model.Address2;
                            model.Address2 = "";
                        }
                        model.Area = match.Area;
                        model.TownCity = match.TownCity;
                        model.County = match.County;
                        model.Postcode = match.Postcode;
                        model.Country = match.Country;
                        model.Latitude = match.Latitude;
                        model.Longitude = match.Longitude;
                        model.StopSummary = item.StopSummary;
                    });
                }

                function setFromGoogle(item) {
                    clearOld();
                    scope.locationSet = true;
                    scope.showLocation = false;
                    skipSearch = true;
                    placeService.getDetails({
                        placeId: item.place_id
                    }, function (place, status) {
                        scope.value = item.description;

                        var model = getter(scope);
                        // model.id = idCounter++;
                        var street_number = place.address_components.filter(function (ac) {
                            return ac.types.indexOf('street_number') != -1;
                        });
                        var street_route = place.address_components.filter(function (ac) {
                            return ac.types.indexOf('route') != -1;
                        });
                        model.Address1 = ((street_number.length) ? (street_number[0].long_name + ' ') : '') + ((street_route.length) ? street_route[0].long_name : '');

                        if (!model.Address1) {
                            model.Address1 = place.name;
                        }

                        var area = place.address_components.filter(function (ac) {
                            return ac.types.indexOf('locality') != -1;
                        });
                        model.Area = (area.length) ? area[0].long_name : null;

                        var townCity = place.address_components.filter(function (ac) {
                            return ac.types.indexOf('postal_town') != -1;
                        });
                        model.TownCity = (townCity.length) ? townCity[0].long_name : null;

                        var county = place.address_components.filter(function (ac) {
                            return ac.types.indexOf('administrative_area_level_2') != -1;
                        });
                        model.County = (county.length) ? county[0].long_name : null;

                        var postcode = place.address_components.filter(function (ac) {
                            return ac.types.indexOf('postal_code') != -1;
                        });
                        model.Postcode = (postcode.length) ? postcode[0].long_name : null;

                        var country = place.address_components.filter(function (ac) {
                            return ac.types.indexOf('country') != -1;
                        });
                        model.Country = (country.length) ? country[0].long_name : null;
                        model.StopSummary = item.description;
                        model.Latitude = place.geometry && place.geometry.location ? place.geometry.location.lat() : null;
                        model.Longitude = place.geometry && place.geometry.location ? place.geometry.location.lng() : null;
                        scope.safeApply();
                    });
                }

                function setFromStop(item) {
                    scope.locationSet = true;
                    scope.showLocation = false;
                    skipSearch = true;
                    var model = getter(scope);
                    if (model) {
                        delete item.WaitTime;
                        delete item.WaitTimeChargable;
                        angular.extend(model, item);
                        var add = '';
                        if (!model.StopSummary) {
                            if (model.Address1 && model.Address1.length > 1) {
                                add += model.Address1;
                            }
                            if (model.TownCity) {
                                if (add.length > 0) {
                                    add += ', ';
                                }
                                add += model.TownCity;
                            } else if (model.Area) {
                                if (add.length > 0) {
                                    add += ', ';
                                }
                                add += model.Area;
                            }
                            if (model.Postcode) {
                                if (add.length > 0) {
                                    add += ', ';
                                }
                                add += model.Postcode;
                            }
                            model.StopSummary = add;
                        } else {
                            add = model.StopSummary;
                        }
                        scope.value = add;
                    }
                }

                function setFromLocation(item) {
                    clearOld();
                    scope.locationSet = true;
                    scope.showLocation = false;
                    skipSearch = true;
                    var model = getter(scope);
                    scope.value = item.Name;
                    model.Address1 = item.Name ? item.Name : '';
                    model.Postcode = item.Postcode;
                    model.StopSummary = item.Name ? item.Name : '';
                    model.Latitude = item.Latitude ? item.Latitude : null;
                    model.Longitude = item.Longitude ? item.Longitude : null;
                }

                function setFromPostcode(item) {
                    clearOld();
                    scope.locationSet = true;
                    scope.showLocation = false;
                    skipSearch = true;
                    var model = getter(scope);

                    scope.value = item.Name;
                    model.Address1 = item.Name ? item.Name : '';
                    model.Postcode = item.Postcode;
                    model.StopSummary = item.Name ? item.Name : '';
                    model.Latitude = item.Latitude ? item.Latitude : null;
                    model.Longitude = item.Longitude ? item.Longitude : null;
                }

                function setFromExternal(item) {
                    //clearOld();
                    scope.postcodeMode = false;
                    scope.locationSet = true;
                    scope.showLocation = false;

                    if (model) {

                        angular.extend(model, item);
                        var add = '';
                        if (!model.StopSummary) {
                            if (model.Address1 && model.Address1.length > 1) {
                                add += model.Address1;
                            }
                            if (model.TownCity) {
                                if (add.length > 0) {
                                    add += ', ';
                                }
                                add += model.TownCity;
                            } else if (model.Area) {
                                if (add.length > 0) {
                                    add += ', ';
                                }
                                add += model.Area;
                            }
                            if (model.Postcode) {
                                if (add.length > 0) {
                                    add += ', ';
                                }
                                add += model.Postcode;
                            }
                        } else {
                            add = model.StopSummary;
                        }
                        scope.value = add;
                        if (add) {
                            skipSearch = true;
                        }
                    }
                }

                function clearOld() {
                    scope.postcodeMode = false;
                    var model = getter(scope);
                    if (model) {
                        model.Address1 = null;
                        model.Address2 = null;
                        model.TownCity = null;
                        model.Area = null;
                        model.Postcode = null;
                        model.County = null;
                        model.Country = null;
                        model.StopSummary = null;
                        model.Latitude = null;
                        model.Longitude = null;
                    }
                }
            }
        };
    }
})(angular);