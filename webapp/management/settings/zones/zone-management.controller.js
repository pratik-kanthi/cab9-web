(function(angular) {
    var module = angular.module('cab9.settings');

    module.controller('ZoneManagementController', ZoneManagementController);

    ZoneManagementController.$inject = ['$scope', 'rZones', '$modal', 'Model', '$http', '$config', '$state'];

    function ZoneManagementController($scope, rZones, $modal, Model, $http, $config, $state) {
        $scope.zones = rZones;
        $scope.zonePolygons = [];
        $scope.map = null;
        $scope.selected = {
            current: null,
            mode: 'VIEW',
            merge: null
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
        var mergeResult = null;

        $scope.startEditingZone = startEditingZone;
        $scope.cancelEditingZone = cancelEditingZone;
        $scope.finishEditingZone = finishEditingZone;
        $scope.startAddingNewZone = startAddingNewZone;
        $scope.selectZone = selectZone;
        $scope.startMerge = startMerge;
        $scope.cancelMerge = cancelMerge;
        $scope.performMerge = performMerge;
        $scope.notSelectedFilter = notSelectedFilter;
        $scope.deleteZone = deleteZone;

        function startMerge() {
            $scope.selected.merge = {
                mode: 'nochange'
            };
            $scope.selected.mode = 'MERGE';
            for (var i = 0; i < $scope.zonePolygons.length; i++) {
                if ($scope.zonePolygons[i] === $scope.selected.current.$poly) {
                    $scope.zonePolygons[i].setOptions({
                        fillOpacity: 0.25,
                        strokeOpacity: 0.5,
                        //zIndex: 1000000
                    });
                } else {
                    $scope.zonePolygons[i].setOptions({
                        fillOpacity: 0.05,
                        strokeOpacity: 0.2,
                        //zIndex: 1000000 - $scope.zonePolygons[i].size
                    });
                    $scope.zonePolygons[i].setMap(null);
                }
            }
        }

        function notSelectedFilter(z) {
            return z.Id != $scope.selected.current.Id;
        }

        $scope.$watch('selected.merge.zone', function (newZone, oldZone) {
            if (newZone) {
                newZone.$poly.setMap($scope.map);

                $http.post($config.API_ENDPOINT + 'api/PricingModels/Zones/CheckForMerge', {
                    MasterId: $scope.selected.current.Id,
                    MasterPolygon: $scope.selected.current.OverviewPolyline,
                    ChildId: newZone.Id,
                    ChildPolygon: newZone.OverviewPolyline,
                    Mode: $scope.selected.merge.type
                }).then(function (response) {
                    $scope.selected.merge.check = response.data;
                    if (!$scope.selected.merge.check.overlaps && $scope.selected.merge.type != 'nochange') {
                        $scope.selected.merge.type = 'nochange';
                    }
                });

                if (oldZone) {
                    oldZone.$poly.setMap(null);
                }
            }
        });

        $scope.$watchGroup(['selected.merge.type', 'selected.merge.check'], function () {
            if ($scope.selected.merge && $scope.selected.merge.check) {
                if (!$scope.selected.merge.type || $scope.selected.merge.type == 'nochange') {
                    if (mergeResult != null) {
                        mergeResult.setMap(null);
                        mergeResult = null;
                    }
                } else  {
                    var check = $scope.selected.merge.check[$scope.selected.merge.type];
                    var path = google.maps.geometry.encoding.decodePath(check);
                    if (mergeResult != null) {
                        mergeResult.setPaths(path);
                    } else {
                        mergeResult = new google.maps.Polygon({
                            id: 0,
                            paths: path,
                            editable: false,
                            draggable: false,
                            clickable: false,
                            fillColor: 'black',
                            fillOpacity: 0.4,
                            strokeColor: 'black',
                            strokeOpacity: 0.5,
                            stokeWeight: 3,
                            zIndex: 1000000,
                            map: $scope.map
                        });
                    }
                }
            }
        });

        function deleteZone() {
            $scope.selected.current.$delete()
            .success(function () {
                var poly = $scope.zonePolygons.indexOf($scope.selected.current.$poly);
                $scope.zones.splice(poly, 1);
                var index = $scope.zones.indexOf($scope.selected.current);
                $scope.zones.splice(index, 1);

                $scope.selected.current.$poly.setMap(null);
                $scope.selected.current.$poly = null;
                $scope.selected.current = null;
                $scope.selected.mode = 'VIEW';
                for (var i = 0; i < $scope.zones.length; i++) {
                    $scope.zones[i].$poly.setOptions({
                        fillOpacity: 0.25,
                        strokeOpacity: 0.5,
                    });
                }
                $scope.map.panTo(new google.maps.LatLng($scope.COMPANY.BaseLatitude, $scope.COMPANY.BaseLongitude));
                $scope.map.setZoom(10);
                swal("Deleted", "Zone settings removed.", "success")
            })
            .error(function () {
                swal("Error!", "Error deleting zone settings.", "error")
            });
        }


        function cancelMerge() {
            $scope.selected.mode = 'VIEW';
            $scope.selected.merge = null;
            for (var i = 0; i < $scope.zonePolygons.length; i++) {
                $scope.zonePolygons[i].setOptions({
                    fillOpacity: 0.25,
                    strokeOpacity: 0.5,
                });
                $scope.zonePolygons[i].setMap($scope.map);
            }
            if (mergeResult) {
                mergeResult.setMap(null);
                mergeResult = null;
            }
            $scope.map.panTo(new google.maps.LatLng($scope.COMPANY.BaseLatitude, $scope.COMPANY.BaseLongitude));
            $scope.map.setZoom(10);
        }

        function performMerge() {
            $http.post($config.API_ENDPOINT + 'api/PricingModels/Zones/PerformMerge', {
                MasterId: $scope.selected.current.Id,
                MasterPolygon: $scope.selected.current.OverviewPolyline,
                ChildId: $scope.selected.merge.zone.Id,
                ChildPolygon: $scope.selected.merge.zone.OverviewPolyline,
                Mode: $scope.selected.merge.type
            }).then(function (response) {
                if (mergeResult) {
                    mergeResult.setMap(null);
                    mergeResult = null;
                }
                $state.go($state.current, {}, { reload: true });
            });
        }

        function selectZone(zone) {
            if ($scope.selected.mode == 'VIEW') {
                $scope.selected.current = zone;

                if (zone != null) {
                    var x = zone.MinLatitude + ((zone.MaxLatitude - zone.MinLatitude) / 2);
                    var y = zone.MinLongitude + ((zone.MaxLongitude - zone.MinLongitude) / 2);
                    $scope.map.panTo(new google.maps.LatLng(x, y));
                    $scope.map.setZoom(12);

                    for (var i = 0; i < $scope.zonePolygons.length; i++) {
                        if ($scope.zonePolygons[i] === $scope.selected.current.$poly) {
                            $scope.zonePolygons[i].setOptions({
                                fillOpacity: 0.25,
                                strokeOpacity: 0.5,
                                //zIndex: 1000000
                            });
                        } else {
                            $scope.zonePolygons[i].setOptions({
                                fillOpacity: 0.05,
                                strokeOpacity: 0.2,
                                //zIndex: 1000000 - $scope.zonePolygons[i].size
                            });
                        }
                    }
                } else {
                    for (var i = 0; i < $scope.zonePolygons.length; i++) {
                        $scope.zonePolygons[i].setOptions({
                            fillOpacity: 0.25,
                            strokeOpacity: 0.5,
                        });
                    }
                    $scope.map.panTo(new google.maps.LatLng($scope.COMPANY.BaseLatitude, $scope.COMPANY.BaseLongitude));
                    $scope.map.setZoom(10);
                }
            }
        }

        function startEditingZone() {
            $scope.selected.mode = 'EDIT';
            for (var i = 0; i < $scope.zonePolygons.length; i++) {
                if ($scope.zonePolygons[i] === $scope.selected.current.$poly) {
                    $scope.zonePolygons[i].setOptions({
                        editable: true,
                    });
                } else {
                    $scope.zonePolygons[i].setOptions({
                        fillOpacity: 0.05,
                        strokeOpacity: 0.2,
                    });
                }
            }
        }

        function cancelEditingZone() {
            if ($scope.selected.mode == 'NEW') {
                for (var i = 0; i < $scope.zones.length; i++) {
                    $scope.zones[i].$poly.setOptions({
                        fillOpacity: 0.25,
                        strokeOpacity: 0.5,
                    });
                }
                if ($scope.selected.current.$poly) {
                    $scope.selected.current.$poly.setMap(null);
                }
                $scope.selected.current = null;
                $scope.drawingManager.setDrawingMode(null);
            } else {
                for (var i = 0; i < $scope.zones.length; i++) {
                    if ($scope.zones[i] === $scope.selected.current) {
                        $scope.zones[i].$poly.setOptions({
                            editable: false,
                        });
                        var path = google.maps.geometry.encoding.decodePath($scope.zones[i].OverviewPolyline);
                        $scope.zones[i].$poly.setPaths(path);
                    } else {
                        $scope.zones[i].$poly.setOptions({
                            fillOpacity: 0.25,
                            strokeOpacity: 0.5,
                        });
                    }
                }
            }
            $scope.selected.mode = 'VIEW';
        }

        function finishEditingZone() {
            var poly = $scope.selected.current.$poly;
            $scope.selected.current.$poly = null;

            if (!poly) {
                return;
            }

            var path = poly.getPath().getArray();

            var minLat = path[0].lat();
            var maxLat = path[0].lat();
            var minLng = path[0].lng();
            var maxLng = path[0].lng();
            for (var i = 1; i < path.length; i++) {
                var p = path[i];
                if (p.lat() > maxLat) maxLat = p.lat();
                if (p.lat() < minLat) minLat = p.lat();
                if (p.lng() > maxLng) maxLng = p.lng();
                if (p.lng() < minLng) minLng = p.lng();
            }

            $scope.selected.current.MinLatitude = minLat;
            $scope.selected.current.MaxLatitude = maxLat;
            $scope.selected.current.MinLongitude = minLng;
            $scope.selected.current.MaxLongitude = maxLng;

            var size = google.maps.geometry.spherical.computeArea(path);
            $scope.selected.current.Size = size;

            $scope.selected.current.OverviewPolyline = google.maps.geometry.encoding.encodePath(path);

            var action = null;
            if ($scope.selected.mode == 'CREATE') {
                action = $scope.selected.current.$save();
                action.then(function() {
                    $scope.zones.push($scope.selected.current);
                    $scope.zonePolygons.push($scope.selected.current.$poly);
                });
            } else {
                action = $scope.selected.current.$patch();
            }
            action.then(function() {
                swal('Zone Saved', 'Changes to zone definition have been saved', 'success');
                $scope.selected.mode = 'VIEW';
                $scope.selected.current.$poly = poly;
                for (var i = 0; i < $scope.zones.length; i++) {
                    if ($scope.zones[i] === $scope.selected.current) {
                        $scope.zones[i].$poly.setOptions({
                            editable: false,
                        });
                    } else {
                        //$scope.zones[i].$poly.setOptions({
                        //    fillOpacity: 0.25,
                        //    strokeOpacity: 0.5,
                        //});
                    }
                }
            });
        }

        function startAddingNewZone() {
            $scope.selected.current = new Model.Zone();
            $scope.selected.mode = 'CREATE';
            for (var i = 0; i < $scope.zones.length; i++) {
                $scope.zones[i].$poly.setOptions({
                    fillOpacity: 0.1,
                    strokeOpacity: 0.2,
                });
            }
            $scope.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
        }

        angular.forEach($scope.zones, function(z) {
            var randomColor = Math.floor(Math.random() * 16777215).toString(16);

            var path = google.maps.geometry.encoding.decodePath(z.OverviewPolyline);
            var size = google.maps.geometry.spherical.computeArea(path);
            z._size = size;
            var polyDef = new google.maps.Polygon({
                id: z.Id,
                paths: path,
                editable: false,
                draggable: false,
                clickable: true,
                fillColor: '#' + randomColor,
                fillOpacity: 0.25,
                strokeColor: '#' + randomColor,
                strokeOpacity: 0.5,
                stokeWeight: 3,
                zIndex: 1000000 - size
            })

            polyDef.addListener('click', function(polygon) {
                if ($scope.selected.mode == 'EDIT') {

                } else {
                    selectZone($scope.zones.find(function(x) { return x.$poly === polyDef; }));
                    $scope.$apply();
                }
            });

            z.$poly = polyDef;
            $scope.zonePolygons.push(polyDef);
        });

        setTimeout(function() {
            setupMap();
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

            $scope.drawingManager = new google.maps.drawing.DrawingManager({
                drawingMode: null,
                map: $scope.map,
                drawingControlOptions: {
                    drawingModes: [],
                    position: 'BOTTOM_LEFT'
                }
            });

            $scope.drawingManager.addListener('polygoncomplete', function(polygon) {
                $scope.drawingManager.setDrawingMode(null);
                if ($scope.selected.current) {
                    $scope.selected.current.$poly = polygon;
                    polygon.setOptions({
                        editable: true,
                        clickable: true
                    });
                } else {
                    polygon.setMap(null);
                }
                $scope.$apply();
            });

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
            })

            for (var i = 0; i < $scope.zonePolygons.length; i++) {
                $scope.zonePolygons[i].setMap($scope.map);
            }

            var input = document.getElementById("myInput");
            var searchBox = new google.maps.places.SearchBox(input);
            $scope.map.addListener("bounds_changed", function() {
                searchBox.setBounds($scope.map.getBounds());
            });
            var markers = [];

            searchBox.addListener("places_changed", function() {
                var places = searchBox.getPlaces();

                if (places.length == 0) {
                    return;
                }
                markers.forEach(function(marker) {
                    marker.setMap(null);
                });
                markers = [];
                var bounds = new google.maps.LatLngBounds();
                places.forEach(function(place) {
                if (!place.geometry) {
                    console.log("Returned place contains no geometry");
                    return;
                }
                var icon = {
                    url: place.icon,
                    size: new google.maps.Size(71, 71),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(17, 34),
                    scaledSize: new google.maps.Size(25, 25),
                };
                markers.push(
                    new google.maps.Marker({
                    map: $scope.map,
                    icon: icon,
                    title: place.name,
                    position: place.geometry.location,
                    })
                );

                if (place.geometry.viewport) {
                    bounds.union(place.geometry.viewport);
                } else {
                    bounds.extend(place.geometry.location);
                }
                });
                $scope.map.fitBounds(bounds);
            });


            //var bounds = new google.maps.LatLngBounds();
            //for (i = 0; i < $scope.zonePolygons.length; i++) {
            //    var _zp = $scope.zonePolygons[i];
            //    for (j = 0; j < _zp.path.length; j++) {
            //        bounds.extend(new google.maps.LatLng(_zp.path[j].latitude, _zp.path[j].longitude));
            //    }
            //}
            //$scope.mapBounds = {
            //    northeast: {
            //        latitude: bounds.getNorthEast().lat(),
            //        longitude: bounds.getNorthEast().lng(),
            //    },
            //    southwest: {
            //        latitude: bounds.getSouthWest().lat(),
            //        longitude: bounds.getSouthWest().lng(),
            //    }
            //}
            $scope.mapSetup = true;

            $scope.$apply();
        }

        //$scope.viewItem = function (row) {
        //    $modal.open({
        //        templateUrl: '/webapp/management/settings/specialrequirements/modal.html',
        //        resolve: {
        //            rBReq: function () {
        //                return row;
        //            }
        //        },
        //        controller: ['$scope', '$modalInstance', 'rBReq', function ($scope, $modalInstance, rBReq) {
        //            $scope.requirement = rBReq;

        //            $scope.save = function () {
        //                $scope.requirement.$patch().then(function (res) {
        //                    swal("Success", "Requirement changed successfully.", "success")
        //                    $modalInstance.close();
        //                }, function (err) {
        //                    swal("Error", "Something didn't work, please check input and try again", "error");
        //                })
        //            }
        //        }]
        //    });
        //}

        //$scope.deleteItem = function (row) {
        //    swal({
        //        title: "Are you sure?",
        //        text: "This req. will be deleted permanentaly",
        //        type: "warning",
        //        showCancelButton: true,
        //        confirmButtonText: "Yes, delete it!",
        //        closeOnConfirm: true
        //    }, function () {
        //        row.$delete().success(function () {
        //            $state.go('root.settings.specialrequirements', null, {
        //                reload: true
        //            });
        //        });
        //    });
        //}
    }
}(angular))