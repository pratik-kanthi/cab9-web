(function(angular) {
    var module = angular.module('cab9.settings');

    module.controller('AppSettingsController', appSettingsController);

    appSettingsController.$inject = ['$scope', '$http', '$config', 'rAppConfigs', '$modal', '$state', '$q', 'Model'];

    function appSettingsController($scope, $http, $config, rAppConfigs, $modal, $state, $q, Model) {

        //list of app config for the tenant
        $scope.AppConfigs = rAppConfigs || [];
        $scope.showList = true;
        $scope.viewMode = 'EDIT';
        $scope.configPolygons = [];
        //required to assign polydefs id above mentioned number
        var idCount = 100000;

        //List of the methods used.
        $scope.addNewAppConfig = addNewAppConfig;
        $scope.saveNewAppConfig = saveNewAppConfig;
        $scope.cancelNewAppConfig = cancelNewAppConfig;
        $scope.startEditAppConfig = startEditAppConfig;
        $scope.editAppConfig = editAppConfig;
        $scope.cancelEditAppConfigs = cancelEditAppConfigs;
        $scope.deleteEditAppConfig = deleteEditAppConfig;
        //Initialize map on the right

        $scope.drawingManager = {
            control: {},
            instance: null,
            options: {
                drawingMode: null,
                drawingControl: false,
                drawingControlOptions: {
                    drawingModes: [
                        google.maps.drawing.OverlayType.RECTANGLE,
                        google.maps.drawing.OverlayType.CIRCLE,
                        google.maps.drawing.OverlayType.POLYGON
                    ]
                }
            }
        };

        $scope.mapBounds = new google.maps.LatLngBounds();

        setTimeout(function() {
            setupMap();
        });

        //initialize company marker on the map.
        $scope.companyMarker = {
            coords: {
                latitude: $scope.COMPANY.BaseLatitude,
                longitude: $scope.COMPANY.BaseLongitude
            },
            options: {
                animation: google.maps.Animation.DROP,
                icon: {
                    url: '../../includes/images/marker.png',
                    scaledSize: new google.maps.Size(48, 48)
                }
            }
        };

        //replace by for loop
        for (i = 0; i < $scope.AppConfigs.length; i++) {
            var polyDef = {
                id: $scope.AppConfigs[i].Id,
                path: google.maps.geometry.encoding.decodePath($scope.AppConfigs[i].EncodedPath).map(function(p) {
                    return {
                        latitude: p.lat(),
                        longitude: p.lng()
                    };
                }),
                editable: false,
                draggable: false,
                stroke: {
                    color: 'black',
                    weight: 5,
                    opacity: 0.8,
                    zIndex: 100000
                },
                zIndex: 100000,
                fit: false,
                $zone: $scope.AppConfigs[i]
            };
            $scope.AppConfigs[i].$poly = polyDef;
            $scope.configPolygons.push(polyDef);
        }

        function setupMap() {
            var bounds = new google.maps.LatLngBounds();
            if ($scope.configPolygons.length > 0) {
                for (i = 0; i < $scope.configPolygons.length; i++) {
                    var _zp = $scope.configPolygons[i];
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
            }
            $scope.map = {
                center: {
                    latitude: $scope.COMPANY.BaseLatitude,
                    longitude: $scope.COMPANY.BaseLongitude
                },
                zoom: 10,
                contol: {}
            };
            $scope.mapSetup = true;
            $scope.$apply();
        }

        $scope.$watch(function() {
            return !!$scope.drawingManager.control.getDrawingManager;
        }, function(newvalue) {
            if (newvalue) {
                $scope.drawingManager.instance = $scope.drawingManager.control.getDrawingManager();
            }
        })

        //Function to save New App Config
        function saveNewAppConfig() {
            $scope.selectedAppConfig.EncodedPath = google.maps.geometry.encoding.encodePath($scope.selectedAppConfig.$poly.path.map(function(p) {
                return new google.maps.LatLng(p.latitude, p.longitude);
            }));
            $scope.selectedAppConfig.$commit();
            $http.post($config.API_ENDPOINT + 'api/appconfig', $scope.selectedAppConfig.$$originalValues).then(function (response) {
                var newItem = new Model.AppConfig(response.data);
                newItem.$poly = $scope.selectedAppConfig.$poly;

                $scope.showList = true;
                $scope.AppConfigs.push(newItem);
                setupPolyLine('black', false, false)
                $scope.selectedAppConfig = null;
                $scope.selectedAppConfigMode = null;
                swal('Success', 'The App Config saved successfully', 'success');
            }, function() {
                swal('Error', 'The App Config failed to save.', 'error');
            });
        }

        //Function to cancel adding new app config
        function cancelNewAppConfig() {
            var index = $scope.configPolygons.indexOf($scope.selectedAppConfig.$poly);
            if (index != -1) {
                $scope.configPolygons.splice(index, 1);
            }
            $scope.selectedAppConfig = null;
            $scope.selectedAppConfigMode = null;
            $scope.drawingManager.options.drawingMode = null;
            $scope.drawingManager.instance.setDrawingMode(null);
            $scope.currentCompleteHandler.remove();
            $scope.showList = true;
        }

        //Function to add new app config(open up panel)
        function addNewAppConfig() {
            var newAppConfig = new Model.AppConfig();
            $scope.selectedAppConfig = newAppConfig;

            $scope.selectedAppConfigMode = 'CREATE';
            $scope.drawingManager.options.drawingMode = google.maps.drawing.OverlayType.POLYGON;
            $scope.drawingManager.instance.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
            $scope.currentCompleteHandler = google.maps.event.addListener($scope.drawingManager.instance, 'overlaycomplete', function(event) {
                if (event.type == google.maps.drawing.OverlayType.POLYGON) {
                    event.overlay.setMap(null);

                    $scope.selectedAppConfig.EncodedPath = google.maps.geometry.encoding.encodePath(event.overlay.getPath())
                    console.log($scope.selectedAppConfig.EncodedPath);
                    var polyDef = {
                        id: idCount++,
                        path: google.maps.geometry.encoding.decodePath($scope.selectedAppConfig.EncodedPath).map(function(p) {
                            return {
                                latitude: p.lat(),
                                longitude: p.lng()
                            };
                        }),
                        editable: true,
                        draggable: true,
                        stroke: {
                            color: '#63C4E1',
                            weight: 5,
                            opacity: 0.8
                        },
                        $CoverageArea: $scope.selectedAppConfig
                    };
                    $scope.selectedAppConfig.$poly = polyDef;
                    $scope.configPolygons.push(polyDef);

                    $scope.drawingManager.options.drawingMode = null;
                    $scope.drawingManager.instance.setDrawingMode(null);
                    $scope.currentCompleteHandler.remove();

                    $scope.$apply();
                }
            });
        }

        //Function to edit AppConfig
        function editAppConfig() {
            $scope.selectedAppConfig.EncodedPath = google.maps.geometry.encoding.encodePath($scope.selectedAppConfig.$poly.path.map(function(p) {
                return new google.maps.LatLng(p.latitude, p.longitude);
            }));
            $scope.selectedAppConfig.$commit();
            $http.patch($config.API_ENDPOINT + 'api/appconfig', $scope.selectedAppConfig.$$originalValues).then(function(response) {
                $scope.showList = true;
                setupPolyLine('black', false, false)
                $scope.selectedAppConfig = null;
                $scope.selectedAppConfigMode = null;
                swal('Success', 'The App Config saved successfully', 'success');
            }, function() {
                setupPolyLine('black', false, false)
                swal('Error', 'The App Config failed to save.', 'error');
            });
        }

        //Function to cancel adding updated app config
        function cancelEditAppConfigs() {
            $scope.selectedAppConfig.$rollback(true);
            $scope.selectedAppConfig.$poly.path.length = 0;
            [].push.apply($scope.selectedAppConfig.$poly.path, google.maps.geometry.encoding.decodePath($scope.selectedAppConfig.EncodedPath).map(function(p) {
                return {
                    latitude: p.lat(),
                    longitude: p.lng()
                };
            }));
            setupPolyLine('black', true, false)
            $scope.selectedAppConfig = null;
        }

        //Function to open up screen to edit app configs
        function startEditAppConfig(AppConfig) {
            $scope.selectedAppConfig = AppConfig;
            $scope.selectedAppConfigMode = 'EDIT';
            setupPolyLine('green', true, true)
            $scope.showList = false;
        }

        //Function to set poly line
        function setupPolyLine(color, fit, editable) {
            $scope.selectedAppConfig.$poly.stroke.color = color;
            $scope.selectedAppConfig.$poly.fit = fit;
            $scope.selectedAppConfig.$poly.editable = editable;
        }

        //function to delete existing poly line
        function deleteEditAppConfig() {
            swal({
                title: "Are you sure?",
                text: "You want to delete this App Config section.",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, delete!",
                closeOnConfirm: true
            }, function(response) {
                if (response) {
                    $http.delete($config.API_ENDPOINT + 'api/appconfig?AppConfigId=' + $scope.selectedAppConfig.Id).then(function(response) {
                        var index = $scope.AppConfigs.indexOf($scope.selectedAppConfig);
                        $scope.AppConfigs.splice(index, 1);
                        index = $scope.configPolygons.indexOf($scope.selectedAppConfig.$poly);
                        $scope.configPolygons.splice(index, 1);
                        $scope.selectedAppConfig = null;
                        $scope.selectedAppConfigMode = null;
                        $scope.showList = true;
                        swal('Success', 'The App Config deleted successfully', 'success');
                    }, function() {
                        swal('Error', 'The App Config failed to delete.', 'error');
                    });
                }
            })
        }
    }
}(angular))