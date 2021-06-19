(function (angular) {
    var module = angular.module('cab9.settings');
    module.controller('SettingsPricingModelsController', SettingsPricingModelsController);
    module.controller('SettingsPricingModelsCreateController', SettingsPricingModelsCreateController);
    module.controller('SettingsPricingModelsViewerController', SettingsPricingModelsViewerController);
    module.controller('SettingsPricingModelsZonesController', SettingsPricingModelsZonesController);
    module.controller('SettingsPricingModelsVehiclesController', SettingsPricingModelsVehiclesController);
    module.controller('SettingsPricingModelsTesterController', SettingsPricingModelsTesterController);

    SettingsPricingModelsController.$inject = ['$scope', '$state', 'rData', '$modal'];

    function SettingsPricingModelsController($scope, $state, rData, $modal) {
        $scope.pricingModels = rData;
        $scope.openPricingModelCreator = openPricingModelCreator;
        $scope.toggleSearch = toggleSearch;
        $scope.searchTerm = {};

        $scope.metricText = 'Price/Mile';
        if ($scope.COMPANY.UseMetric)
            $scope.metricText = 'Price/Km';

        function toggleSearch() {
            $scope.showSearch = !$scope.showSearch;
            if (!$scope.showSearch) {
                $scope.searchTerm.$ = '';
            } else {
                setTimeout(function () {
                    $('#searchTerm').focus()
                }, 500);
            }
        }

        function openPricingModelCreator() {
            $modal.open({
                templateUrl: '/webapp/management/settings/pricingmodels/pricing-models-create.modal.html',
                backdrop: 'static',
                controller: ['$scope', '$modalInstance', '$http', '$config', 'Model', 'rPrevious', function ($scope, $modalInstance, $http, $config, Model, rPrevious) {
                    $scope.item = new Model.PricingModel();
                    $scope.lockSave = false;
                    $scope.previous = rPrevious;
                    $scope.save = function () {
                        $scope.saving = true;
                        if ($scope.item.$previous) {
                            $http.post($config.API_ENDPOINT + 'api/pricing', $scope.item, {
                                params: {
                                    cloneFrom: $scope.item.$previous
                                }
                            }).success(function (item) {
                                $modalInstance.close(item);
                            }).error(function (item) {
                                swal('Error', 'An error occured.', 'error');
                                $scope.saving = false;
                            });
                        } else {
                            $scope.item.$save().success(function (item) {
                                $modalInstance.close(item);
                            });
                        }
                    }
                }],
                resolve: {
                    rPrevious: ['Model', function (Model) {
                        return Model.PricingModel.query().select('Id,Name,Description').execute();
                    }]
                }
            }).result.then(function (data) {
                $state.go('root.settings.pricingmodels.viewer.details', {
                    Id: data.Id
                });
            }, function () {

            })
        }
    }

    SettingsPricingModelsCreateController.$inject = ['$scope', 'rTabs', 'rData', 'rAccessors'];

    function SettingsPricingModelsCreateController($scope, rTabs, rData, rAccessors) {
        $scope.item = rData[0];
        $scope.accessors = rAccessors;
        $scope.tabDefs = rTabs;
        $scope.viewMode = 'CREATE';
    }

    SettingsPricingModelsViewerController.$inject = ['$scope', 'rTabs', 'rData', 'rAccessors', '$state', '$compile', 'Model', '$q', '$stateParams'];

    function SettingsPricingModelsViewerController($scope, rTabs, rData, rAccessors, $state, $compile, Model, $q, $stateParams) {
        $scope.item = rData[0];
        $scope.accessors = rAccessors;
        $scope.viewMode = 'VIEW';

        $scope.startEditing = startEditing;
        $scope.saveEdits = saveEdits;
        $scope.cancelEditing = cancelEditing;
        $scope.deleteModel = deleteModel;
        $scope.deleteCancellationRule = deleteCancellationRule;

        $scope.tabDefs = [];
        if (rTabs.length > 4) {
            for (var i = 0; i < 3; i++) {
                $scope.tabDefs.push(rTabs[i]);
            }
            setTimeout(function () {
                $(".module-item .module-item-nav-bar .tab-container ul.nav-tabs").append('<li class="has-dropdown"><a><span id="selected">More</span><i class="material-icons">arrow_drop_down</i></a><ul class="subnav"></ul></li>');
                for (var i = 3; i < rTabs.length; i++) {
                    if (rTabs[i].params) {
                        var key = Object.keys(rTabs[i].params)[0];
                    } else {
                        $(".subnav").append($compile('<li><a ui-sref="' + rTabs[i].route + '()">' + rTabs[i].heading + '</a></li>')($scope));
                    }
                }
                $('.subnav a').click(function () {
                    $('#selected').text($(this).text());
                });
            }, 0);
        } else
            $scope.tabDefs = rTabs;


        //$scope.test = {
        //    steps: '[{"max": 3, "fare": 1.65}, {"max": 10, "fare": 1.35}]'
        //};

        function startEditing() {
            $scope.viewMode = 'EDIT';
        }

        function saveEdits() {
            var promises = [];

            var cancellationRule = new Model.CancellationRule($scope.item.CancellationRule);

            if ($scope.item.CancellationRuleId) {
                promises.push(cancellationRule.$update());
                $scope.item.CancellationRule = null;
            }
            promises.push($scope.item.$patch());

            $q.all(promises).then(function () {
                $state.go($state.current, {
                    Id: $stateParams.Id
                }, {
                    reload: true
                })
            }, function () {
                alert('Error');
                console.log(arguments);
            });
        }

        function deleteCancellationRule() {
            swal({
                title: "Are you sure?",
                text: "Cancellation rule will be deleted",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: '#DD6B55',
                confirmButtonText: 'Yes, delete it!',
                closeOnConfirm: true
            },
                function () {
                    var promises = [];
                    var cancellationRule = new Model.CancellationRule($scope.item.CancellationRule);

                    $scope.item.CancellationRuleId = null;
                    $scope.item.CancellationRule = null;

                    $scope.item.$patch().then(function () {
                        cancellationRule.$delete().then(function () {
                            $state.go($state.current, {
                                Id: $stateParams.Id
                            }, {
                                reload: true
                            })
                        });
                    });

                },
                function (err) {
                    swal({
                        title: "Some Error Occured.",
                        text: "Some error has occured.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                })

        }

        function cancelEditing() {
            $scope.item.$rollback(true);
            $scope.viewMode = 'VIEW';
        }


        function deleteModel(item) {
            swal({
                title: "Are you sure?",
                text: "This Pricing model will be deleted permanentaly",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, delete it!",
                closeOnConfirm: true
            }, function () {
                item.$delete().then(function () {
                    swal("Success", "Pricing Model deleted.", "success")
                    $state.go('root.settings.pricingmodels', null, {
                        reload: true
                    });
                }, function (err) {
                    if (err.status == 409)
                        swal("Error", "Error on deleting pricing model as some clients might be associated with it. Please disassociate all clients and try again.", "error");
                    else
                        swal("Error", "Error on deleting pricing model.", "error");
                });
            });
        }
    }

    SettingsPricingModelsZonesController.$inject = ['$scope', '$q', 'Model', 'rZones', 'rAllZones'];

    function SettingsPricingModelsZonesController($scope, $q, Model, rZones, rAllZones) {
        var idCount = 100000;
        $scope.allZones = rAllZones;
        $scope.zones = rZones;
        $scope.zonePolygons = [];
        $scope.viewMode = 'VIEW';
        $scope.selected = {
            pricing: null
        };

        var mapStyles = [{
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{
                "color": "#e9e9e9"
            },
            {
                "lightness": 17
            }
            ]
        },
        {
            "featureType": "landscape",
            "elementType": "geometry",
            "stylers": [{
                "color": "#f5f5f5"
            },
            {
                "lightness": 20
            }
            ]
        },
        {
            "featureType": "road.highway",
            "elementType": "geometry.fill",
            "stylers": [{
                "color": "#ffffff"
            },
            {
                "lightness": 17
            }
            ]
        },
        {
            "featureType": "road.highway",
            "elementType": "geometry.stroke",
            "stylers": [{
                "color": "#ffffff"
            },
            {
                "lightness": 29
            },
            {
                "weight": 0.2
            }
            ]
        },
        {
            "featureType": "road.arterial",
            "elementType": "geometry",
            "stylers": [{
                "color": "#ffffff"
            },
            {
                "lightness": 18
            }
            ]
        },
        {
            "featureType": "road.local",
            "elementType": "geometry",
            "stylers": [{
                "color": "#ffffff"
            },
            {
                "lightness": 16
            }
            ]
        },
        {
            "featureType": "poi",
            "elementType": "geometry",
            "stylers": [{
                "color": "#f5f5f5"
            },
            {
                "lightness": 21
            }
            ]
        },
        {
            "featureType": "poi.park",
            "elementType": "geometry",
            "stylers": [{
                "color": "#dedede"
            },
            {
                "lightness": 21
            }
            ]
        },
        {
            "elementType": "labels.text.stroke",
            "stylers": [{
                "visibility": "on"
            },
            {
                "color": "#ffffff"
            },
            {
                "lightness": 16
            }
            ]
        },
        {
            "elementType": "labels.text.fill",
            "stylers": [{
                "saturation": 36
            },
            {
                "color": "#333333"
            },
            {
                "lightness": 40
            }
            ]
        },
        {
            "elementType": "labels.icon",
            "stylers": [{
                "visibility": "off"
            }]
        },
        {
            "featureType": "transit",
            "elementType": "geometry",
            "stylers": [{
                "color": "#f2f2f2"
            },
            {
                "lightness": 19
            }
            ]
        },
        {
            "featureType": "administrative",
            "elementType": "geometry.fill",
            "stylers": [{
                "color": "#fefefe"
            },
            {
                "lightness": 20
            }
            ]
        },
        {
            "featureType": "administrative",
            "elementType": "geometry.stroke",
            "stylers": [{
                "color": "#fefefe"
            },
            {
                "lightness": 17
            },
            {
                "weight": 1.2
            }
            ]
        }
        ]


        $scope.metricText = 'Price/Mile';
        if ($scope.COMPANY.UseMetric)
            $scope.metricText = 'Price/Km';

        angular.forEach($scope.allZones, function (z) {
            var inUse = $scope.zones.find(function (x) { return x.ZoneId == z.Id });
            if (!!inUse) {
                inUse.$zoneName = z.Name;
                inUse.$zoneDescription = z.Description;
            }
            z.$inUse = !!inUse;

            var randomColor = Math.floor(Math.random() * 16777215).toString(16);
            var path = google.maps.geometry.encoding.decodePath(z.OverviewPolyline);
            var size = google.maps.geometry.spherical.computeArea(path);

            var polyDef = new google.maps.Polygon({
                id: z.Id,
                paths: path,
                editable: false,
                draggable: false,
                clickable: true,
                fillColor: '#' + randomColor,
                fillOpacity: !!inUse ? 0.25 : 0.05,
                strokeColor: '#' + randomColor,
                strokeOpacity: !!inUse ? 0.5 : 0.1,
                stokeWeight: 3,
                zIndex: 1000000 - size
            });

            polyDef.addListener('click', function (polygon) {
            });

            z.$poly = polyDef;
            $scope.zonePolygons.push(polyDef);

        });

        $scope.map = {
            center: {
                latitude: $scope.COMPANY.BaseLatitude,
                longitude: $scope.COMPANY.BaseLongitude
            },
            zoom: 10,
            contol: {}
        };

        $scope.mapBounds = new google.maps.LatLngBounds();

        setTimeout(function () {
            if ($scope.zonePolygons.length > 0) {
                setupMap();
            } else {
                $scope.mapSetup = true;
                $scope.$apply();
            }
        }, 1000);

        function setupMap() {
            $scope.map = new google.maps.Map(document.getElementById('zone-map'), {
                center: {
                    lat: $scope.COMPANY.BaseLatitude,
                    lng: $scope.COMPANY.BaseLongitude
                },
                zoom: 10,
                styles: mapStyles,
            });

            //var bounds = new google.maps.LatLngBounds();
            //for (i = 0; i < $scope.zonePolygons.length; i++) {
            //    var _zp = $scope.zonePolygons[i];
            //    for (j = 0; j < _zp.path.length; j++) {
            //        bounds.extend(new google.maps.LatLng(_zp.path[j].latitude, _zp.path[j].longitude));
            //    }
            //}
            var companyMarker = new google.maps.Marker({
                map: $scope.map,
                position: {
                    lat: $scope.COMPANY.BaseLatitude,
                    lng: $scope.COMPANY.BaseLongitude
                },
                animation: google.maps.Animation.DROP,
                icon: {
                    url: '../../includes/images/marker.png',
                    scaledSize: new google.maps.Size(48, 48)
                }
            });

            for (var i = 0; i < $scope.allZones.length; i++) {
                $scope.allZones[i].$poly.setMap($scope.map);
            }

            $scope.mapSetup = true;
            $scope.$apply();
        }

        $scope.startNewZone = startNewZone;
        $scope.saveNewZone = saveNewZone;
        $scope.cancelNewZone = cancelNewZone;
        $scope.startEditZone = startEditZone;
        $scope.saveEditZone = saveEditZone;
        $scope.cancelEditZone = cancelEditZone;
        $scope.deleteEditZone = deleteEditZone;

        $scope.$watch('selected.pricing.ZoneId', function (newValue) {
            if (newValue) {
                angular.forEach($scope.allZones, function (z) {
                    if (z.Id == newValue) {
                        z.$poly.setMap($scope.map);
                        z.$poly.setOptions({
                            fillOpacity: 0.5,
                            strokeOpacity: 0.7
                        });
                        var x = z.MinLatitude + ((z.MaxLatitude - z.MinLatitude) / 2);
                        var y = z.MinLongitude + ((z.MaxLongitude - z.MinLongitude) / 2);
                        $scope.map.panTo(new google.maps.LatLng(x, y));
                        $scope.map.setZoom(12);
                    } else if (z.$inUse) {
                        z.$poly.setMap($scope.map);
                        z.$poly.setOptions({
                            fillOpacity: 0.05,
                            strokeOpacity: 0.2
                        });
                    } else {
                        z.$poly.setMap(null);
                    }
                });
            } else {
                if ($scope.mapSetup) {
                    angular.forEach($scope.allZones, function (z) {
                        z.$poly.setMap($scope.map);
                        z.$poly.setOptions({
                            fillOpacity: z.$inUse ? 0.25 : 0.05,
                            strokeOpacity: z.$inUse ? 0.5 : 0.1
                        });
                    });
                    $scope.map.panTo(new google.maps.LatLng($scope.COMPANY.BaseLatitude, $scope.COMPANY.BaseLongitude));
                    $scope.map.setZoom(10);
                }
            }
        });

        function startNewZone() {
            var newZone = new Model.ZoneInPricingModel();
            newZone.PricingModelId = $scope.item.Id;
            $scope.selected.pricing = newZone;
            $scope.viewMode = 'CREATE';
        }

        function saveNewZone() {
            $scope.selected.pricing.$save().success(function () {
                var found = $scope.allZones.find(function (z) { return z.Id == $scope.selected.pricing.ZoneId; });
                if (found) {
                    found.$inUse = true;
                    $scope.selected.pricing.$zoneName = found.Name;
                    $scope.selected.pricing.$zoneDescription = found.Description;
                }

                $scope.zones.push($scope.selected.pricing);
                $scope.selected.pricing = null;
                $scope.viewMode = 'VIEW';
                swal("Saved", "New zone pricing settings saved.", "success")
            }, function () {
                swal("Error!", "Error saving new zone pricing settings.", "error")
            });
        }

        function cancelNewZone() {
            $scope.selected.pricing = null;
            $scope.viewMode = 'VIEW';
        }

        function startEditZone(zone) {
            $scope.selected.pricing = zone;
            $scope.viewMode = 'EDIT';
        }

        function saveEditZone() {
            $scope.selected.pricing.$patch().then(function () {
                $scope.selected.pricing = null;
                $scope.viewMode = 'VIEW';
                swal("Saved", "Pricing zone settings updated.", "success")
            }, function () {
                swal("Error!", "Error updating pricing zone settings.", "error")
            });
        }

        function cancelEditZone() {
            $scope.selected.pricing.$rollback(true);
            $scope.selected.pricing = null;
            $scope.viewMode = 'VIEW';
        }

        function deleteEditZone() {
            $scope.selected.pricing.$delete()
                .success(function () {
                    var index = $scope.zones.indexOf($scope.selected.pricing);
                    $scope.zones.splice(index, 1);

                    var found = $scope.allZones.find(function (z) { return z.Id == $scope.selected.pricing.ZoneId; });
                    if (found) {
                        found.$inUse = false;
                    }

                    $scope.selected.pricing = null;
                    $scope.viewMode = 'VIEW';
                    swal("Deleted", "Pricing zone settings removed.", "success")
                })
                .error(function () {
                    swal("Error!", "Error deleting pricing zone settings.", "error")
                });
        }
    }


    SettingsPricingModelsVehiclesController.$inject = ['$scope', '$q', '$stateParams', 'Model', 'Localisation', 'rVehiclePricings', 'rVehicleTypes', '$state'];

    function SettingsPricingModelsVehiclesController($scope, $q, $stateParams, Model, Localisation, rVehiclePricings, rVehicleTypes, $state) {
        $scope.vehicleTypes = rVehicleTypes;
        $scope.vehiclePricings = rVehiclePricings;
        $scope.editing = null;
        $scope.currency = Localisation.currency().getCurrent();

        $scope.AddOverride = AddOverride;
        $scope.EditOverride = EditOverride;
        $scope.DeleteOverride = DeleteOverride;
        $scope.SaveOverride = SaveOverride;
        $scope.CancelOverride = CancelOverride;

        angular.forEach(rVehicleTypes, function (vt) {
            var found = rVehiclePricings.filter(function (vp) {
                return vp.VehicleTypeId == vt.Id
            })[0];
            if (found) {
                vt.$pricing = found;
            }
        });

        function AddOverride(vt) {
            vt.$pricing = new Model.PricingModelVehicleTypePricing();
            vt.$pricing.VehicleTypeId = vt.Id;
            vt.$pricing.PricingModelId = $scope.item.Id;
            $scope.editing = vt;
        }

        function EditOverride(vt) {
            if ($scope.editing) {
                CancelOverride(vt);
            }
            $scope.editing = vt;
        }

        function DeleteOverride(vt) {

            swal({
                title: "Are you sure?",
                text: "This Vehicle Override will be deleted permanentaly",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, delete it!",
                closeOnConfirm: false
            }, function () {
                vt.$pricing.$delete().then(function () {
                    delete vt.$pricing;
                    swal("Success", "Vehicle Override Deleted.", "success")
                }, function (err) {
                    swal("Error", "Error while deleting vehicle override.", "error");
                });
            });
        }

        function SaveOverride(vt) {
            if (vt.$pricing.Id) {
                action = vt.$pricing.$patch().then(function () {
                    swal("Success", "Vehicle Override Updated.", "success")
                    $scope.editing = null;
                });
            } else {
                action = vt.$pricing.$save().then(function () {
                    swal("Success", "Vehicle Override Added.", "success")
                    $scope.editing = null;
                    $state.go('root.settings.pricingmodels.viewer.vehicles', null, { reload: true });
                });
            }
        }

        function CancelOverride(vt) {
            if (vt.$pricing.Id) {
                vt.$pricing.$rollback(true);
            } else {
                delete vt.$pricing;
            }
            $scope.editing = null;
        }
    }

    SettingsPricingModelsTesterController.$inject = ['$scope', '$tenantConfig', '$http', '$config', 'Model', 'Google', 'Localisation', 'rVehicleTypes', 'rZones'];

    function SettingsPricingModelsTesterController($scope, $tenantConfig, $http, $config, Model, Google, Localisation, rVehicleTypes, rZones) {
        $scope.vehicleTypes = rVehicleTypes;
        $scope.zonePolygons = [];
        $scope.viewMode = 'EDIT';
        $scope.bookingStops = [];

        var infoWindow = new google.maps.InfoWindow({
            disableAutoPan: true,
            pixelOffset: new google.maps.Size(0, -10)
        });
        angular.forEach(rZones, function (z) {
            var polyDef = {
                id: z.Id,
                path: google.maps.geometry.encoding.decodePath(z.Zone.OverviewPolyline).map(function (p) {
                    return {
                        latitude: p.lat(),
                        longitude: p.lng()
                    };
                }),
                stroke: {
                    color: 'black',
                    weight: 5,
                    opacity: 0.8
                },
                $zone: z
            };
            z.$poly = polyDef;
            $scope.zonePolygons.push(polyDef);
        });

        setTimeout(function () {
            if ($scope.zonePolygons.length > 0) {
                setupMap();
            } else {
                $scope.mapSetup = true;
            }
        }, 1000);

        function setupMap() {
            var bounds = new google.maps.LatLngBounds();
            for (i = 0; i < $scope.zonePolygons.length; i++) {
                var _zp = $scope.zonePolygons[i];
                for (j = 0; j < _zp.path.length; j++) {
                    bounds.extend(new google.maps.LatLng(_zp.path[j].latitude, _zp.path[j].longitude));
                }
            }
            $scope.mapBounds = {
                northeast: {
                    latitude: bounds.getNorthEast().lat(),
                    longitude: bounds.getNorthEast().lng(),
                },
                southwest: {
                    latitude: bounds.getSouthWest().lat(),
                    longitude: bounds.getSouthWest().lng(),
                }
            }
            $scope.mapSetup = true;
            $scope.$apply();
        }

        var id = 1;
        var currentQuote = null;
        $scope.quote = null;
        $scope.segments = [];

        $scope.selectedBooking = new Model.Booking();
        $scope.selectedBooking.BookingStops.length = 0;
        $scope.selectedBooking.BookingStops.push(new Model.BookingStop());
        $scope.selectedBooking.BookingStops.push(new Model.BookingStop());

        $scope.selectedBooking.TaxId = $scope.COMPANY.DefaultTaxId;
        if ($scope.COMPANY.ChauffeurModeActive == true) {
            //$scope.selectedBooking.ChauffeurMode = true;
        }

        $scope.selectedBooking.VehicleTypeId = $tenantConfig.defaultVehicleType;
        $scope.selectedBooking.VehicleClassId = $tenantConfig.defaultVehicleClass;

        var dt = new moment.tz(Localisation.timeZone().getTimeZone());
        //dt.subtract(moment.tz.zone(Localisation.timeZone().getTimeZone()).offset(new Date()), 'minutes');
        $scope.selectedBooking.BookedDateTime = dt.toDate();
        $scope.selectedBooking.Time = dt.startOf('minute').add(15, 'minutes').toDate();

        $scope.directions = {
            renderer: null,
            current: null,
            currentRoute: null,
            currentStep: null,
            setRoute: function (route) {
                if (route != this.currentRoute) {
                    this.currentRoute = route;
                    this.currentStep = null;
                    this.renderer.setRouteIndex(this.current.routes.indexOf(route));
                }
            },
            viewStep: function (step) {
                this.currentStep = step;
                $scope.map.center.latitude = step.start_point.lat();
                $scope.map.center.longitude = step.start_point.lng();
            },
            setDirections: function (directions) {
                this.current = directions;
                this.currentStep = null;
                this.currentRoute = directions ? directions.routes[0] : null;
                this.options.directions = directions;
                if (this.renderer) {
                    this.renderer.setMap(null);
                }
                if (directions) {
                    $scope.selectedBooking.EncodedRoute = this.currentRoute.overview_polyline;
                } else {
                    this.current = null;
                    this.options.directions = null;
                }
                if (this.currentRoute && this.currentRoute.legs && this.currentRoute.legs[0]) {
                    $scope.selectedBooking.EstimatedDuration = Math.ceil(this.currentRoute.legs[0].duration.value / 600) * 10;
                    $scope.selectedBooking.EstimatedDistance = this.currentRoute.legs[0].distance.value;
                }
            },
            options: {
                suppressInfoWindows: true,
                suppressMarkers: false,
                directions: null,
                panel: document.getElementById('google-directions')
            }
        }

        $scope.map = {
            center: {
                latitude: $scope.COMPANY.BaseLatitude || 51.471507,
                longitude: $scope.COMPANY.BaseLongitude || -0.487904
            },
            disableDefaultUI: true,
            styles: $config.GMAPS_STYLE,
            zoom: $scope.COMPANY.BaseZoom || 7,
            traffic: {
                show: false,
                options: {

                }
            }
        };

        $scope.addStop = addStop;
        $scope.getQuote = getQuote;

        $scope.$watch('selectedBooking.BookingStops', function () {
            $scope.bookingStops = [];
            for (i = 0; i < $scope.selectedBooking.BookingStops.length; i++) {
                var b = $scope.selectedBooking.BookingStops[i];
                b.id = i;
                if (b.Latitude && b.Longitude) {
                    b.coords = {
                        latitude: b.Latitude,
                        longitude: b.Longitude
                    }
                    $scope.bookingStops.push(b);
                }
            }

            if ($scope.selectedBooking.AsDirected) {

            } else if ($scope.selectedBooking.BookingStops.length < 2) {
                $scope.selectedBooking.EstimatedCost = 0;
                $scope.selectedBooking.validStops = false;
                return;
            }
            var canQuote = true;
            angular.forEach($scope.selectedBooking.BookingStops, function (bs) {
                if (!bs.Latitude || !bs.Longitude) {
                    canQuote = false;
                }
            });
            if (canQuote) {
                $scope.selectedBooking.validStops = true;
                getRouteBetween($scope.selectedBooking.BookingStops.map(function (p) {
                    return new google.maps.LatLng(p.Latitude, p.Longitude);
                })).then(getQuote);
            } else {
                $scope.directions.setDirections(null);
                $scope.selectedBooking.EstimatedCost = 0;
                $scope.selectedBooking.EstimatedDistance = 0;
                $scope.selectedBooking.ActualCost = 0;
                $scope.selectedBooking.Discount = 0;
                $scope.selectedBooking.validStops = false;
                if ($scope.selectedBooking.BookingStops[0].Latitude && $scope.selectedBooking.BookingStops[0].Longitude) {
                    $scope.map.center.latitude = $scope.selectedBooking.BookingStops[0].Latitude;
                    $scope.map.center.longitude = $scope.selectedBooking.BookingStops[0].Longitude;
                    $scope.map.zoom = 15;
                }
            }
        }, true);

        $scope.$watchGroup(['selectedBooking.BookingStops.length', 'selectedBooking.VehicleTypeId', 'selectedBooking.ChauffeurMode', 'selectedBooking.EstimatedMins'], function () {
            if (currentQuote) {
                $timeout.cancel(currentQuote)
                currentQuote = null;
            }

            if ($scope.setupComplete == true) {
                currentQuote = $timeout(getQuote, 500);
            }
        });

        function getQuote() {
            $scope.selectedBooking.PricingModelId = $scope.item.Id;
            $scope.selectedBooking.Status = 'Incoming';
            $scope.selectedBooking.BookedDateTime = new moment.tz($scope.selectedBooking.Time, Localisation.timeZone().getTimeZone()).format();

            $http.post($config.API_ENDPOINT + '/api/quote?debug=true', $scope.selectedBooking)
                .success(function (result) {
                    $scope.quote = result;
                    if (result.Segments == null) {
                        if (!$scope.directions.renderer) {
                            $scope.directions.options.map = $scope.map.getGMap();
                            $scope.directions.renderer = new google.maps.DirectionsRenderer($scope.directions.options);
                        } else {
                            $scope.directions.renderer.setDirections($scope.directions.current);
                            $scope.directions.renderer.setMap($scope.map.getGMap());
                        }
                    } else {
                        if ($scope.directions.renderer) {
                            $scope.directions.renderer.setMap(null);
                        }
                    }
                    $scope.segments.length = 0;
                    var bounds = new google.maps.LatLngBounds;
                    $scope.quote.EstimatedDistance = 0;
                    angular.forEach(result.Segments, function (s, index) {
                        $scope.quote.EstimatedDistance += s.length;
                        s.id = id++;
                        s.step = index + 1;
                        s.stroke = {
                            weight: 5,
                            opacity: 0.8,
                            color: '#63C4E1'
                        };
                        s.events = {
                            mouseover: function (line, eventName, model, args) {
                                model.stroke.color = 'red';
                                infoWindow.open(line.getMap());
                                infoWindow.setPosition(new google.maps.LatLng(args[0].latLng.lat() + 0.0001, args[0].latLng.lng()));
                                infoWindow.setContent(
                                    "<b>Segment: " + index + "</b><br/>" +
                                    "<b>Mileage: " + s.length.toFixed(1) + " Miles</b><br/>" +
                                    "<b>Cost: £" + (s.fare + s.entry + s.pickup + s.dropoff).toFixed(2) + "</b><br/>" +
                                    "Entry: £" + s.entry.toFixed(2) + "<br/>" +
                                    "Pickup: £" + s.pickup.toFixed(2) + "<br/>" +
                                    "Dropoff: £" + s.dropoff.toFixed(2) + "<br/>" +
                                    "Fare: £" + s.fare.toFixed(2) + "<br/>");
                            },
                            mouseout: function (line, eventName, model, args) {
                                model.stroke.color = '#63C4E1';
                                infoWindow.close();
                            },
                            mousemove: function (line, eventName, model, args) {
                                infoWindow.setPosition(new google.maps.LatLng(args[0].latLng.lat() + 0.0001, args[0].latLng.lng()));
                            }
                        };
                        s.path = s.points.map(function (x) {
                            var point = new google.maps.LatLng(x.lat, x.lng);
                            bounds.extend(point);
                            return point;
                        });


                        $scope.segments.push(s);
                    });

                    $scope.map.getGMap().fitBounds(bounds);

                    console.log($scope.quote);
                    console.log($scope.segments);
                    result.FinalCost = Number(result.FinalCost.toFixed(2));
                    $scope.selectedBooking.EstimatedDistance = Number($scope.quote.EstimatedDistance.toFixed(1));
                    $scope.selectedBooking.EstimatedMins = Number($scope.quote.EstimatedMins.toFixed(0));
                    if ($scope.selectedBooking.CurrencyId != $scope.COMPANY.DefaultCurrencyId) {
                        //if ($scope.selectedBooking.EstimatedCost == $scope.selectedBooking.ActualCost) {
                        //    $scope.selectedBooking.ActualCost = $filter('Convert')(result.FinalCost);
                        //}
                        $scope.selectedBooking.EstimatedCost = result.FinalCost;
                        $scope.selectedBooking.ActualCost = result.FinalCost;
                        $scope.EstimatedCost = result.FinalCost;
                        $scope.ActualCost = result.FinalCost;
                    } else {
                        //if ($scope.selectedBooking.EstimatedCost == $scope.selectedBooking.ActualCost) {
                        //    $scope.selectedBooking.ActualCost = result.FinalCost;
                        //}

                        $scope.selectedBooking.EstimatedCost = result.FinalCost;
                        $scope.selectedBooking.ActualCost = result.FinalCost;
                        $scope.EstimatedCost = result.FinalCost;
                        $scope.ActualCost = result.FinalCost;
                    }
                }).error(function (error) {
                    console.log(error);
                });
        }

        function getRouteBetween(points) {
            return Google.Maps.Directions.route(points).then(function (result) {
                $scope.directions.setDirections(result);
            });
        }

        function addStop() {
            var stop = new Model.BookingStop();
            //stop.id = idCounter++;
            $scope.selectedBooking.BookingStops.push(stop);
        }
    }

    module.directive('addressMapSearch', [addressMapSearch]);

    function addressMapSearch() {
        return {
            restrict: 'E',
            template: '<div class="form-group"><input type="text" class="form-control google-address-text" /></div>',
            scope: {
                object: '='
            },
            link: function (scope, element, attrs) {
                var autocomplete = new google.maps.places.Autocomplete(element.find('input')[0], {
                    types: ['geocode']
                });
                autocomplete.addListener('place_changed', fillInAddress);

                function fillInAddress() {
                    var place = autocomplete.getPlace();
                    scope.object["latitude"] = place.geometry.location.lat();
                    scope.object["longitude"] = place.geometry.location.lng();
                    scope.$apply();
                    scope.$emit('address_changed', {
                        latitude: place.geometry.location.lat(),
                        longitude: place.geometry.location.lng()
                    });
                }
            }
        };
    }
}(angular))
