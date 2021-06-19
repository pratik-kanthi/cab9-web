(function (angular) {
    var module = angular.module('cab9.workshare');
    module.controller('WorkshareCompanyCoverageAreaController', WorkshareCompanyCoverageAreaController);

    WorkshareCompanyCoverageAreaController.$inject = ['$scope', 'Model', '$http', '$UI', '$config', 'rCompany', 'rCompanyProfile', 'Notification'];

    function WorkshareCompanyCoverageAreaController($scope, Model, $http, $UI, $config, rCompany, rCompanyProfile, Notification) {
        $scope.company = rCompany[0];
        $scope.companyProfile = rCompanyProfile;
        var hoveredCoverageArea = null;
        if ($scope.companyProfile && $scope.companyProfile.CoverageArea) {
            $scope.coverageAreas = $scope.companyProfile.CoverageArea.split(',');
        }
        if (!$scope.coverageAreas)
            $scope.coverageAreas = []

        var idCount = 100000;

        $scope.configPolygons = [];

        $scope.viewMode = 'VIEW';
        $scope.startEditCoverageArea = startEditCoverageArea;
        $scope.highlightCoverageArea = highlightCoverageArea;
        $scope.cancelEditCoverageArea = cancelEditCoverageArea;
        $scope.removeHighlightCoverageArea = removeHighlightCoverageArea;
        $scope.updateCoverageArea = updateCoverageArea;
        $scope.deleteCoverageArea = deleteCoverageArea;
        $scope.addNewCoverageArea = addNewCoverageArea;

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

        setTimeout(function () {
            setupMap();
        });

        function setupMap() {
            var bounds = new google.maps.LatLngBounds();
            $scope.configPolygons = [];
            if ($scope.coverageAreas && $scope.coverageAreas.length > 0) {
                for (i = 0; i < $scope.coverageAreas.length; i++) {
                    var polyDef = {
                        id: idCount++,
                        path: google.maps.geometry.encoding.decodePath($scope.coverageAreas[i]).map(function (p) {
                            return {
                                latitude: p.lat(),
                                longitude: p.lng()
                            };
                        }),
                        rawPath: $scope.coverageAreas[i],
                        editable: false,
                        draggable: false,
                        stroke: {
                            color: 'black',
                            weight: 5,
                            opacity: 0.8,
                            zIndex: 100000
                        },
                        zIndex: 100000,
                        fit: false
                    };
                    $scope.configPolygons.push(polyDef);
                }
            }

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
                    latitude: $scope.COMPANY.BaseLatitude || 51.471507,
                    longitude: $scope.COMPANY.BaseLongitude || -0.487904
                },
                zoom: 9,
                contol: {}
            };
            $scope.mapSetup = true;
            $scope.$apply();
        }

        $scope.$watch(function () {
            return !!$scope.drawingManager.control.getDrawingManager;
        }, function (newvalue) {
            if (newvalue) {
                $scope.drawingManager.instance = $scope.drawingManager.control.getDrawingManager();
            }
        })

        function removeHighlightCoverageArea($index) {
            if ($scope.selectedCoverageArea)
                return
            if (hoveredCoverageArea) {
                hoveredCoverageArea.stroke.color = 'black';
                hoveredCoverageArea.fit = false;
                hoveredCoverageArea.editable = false;
                hoveredCoverageArea.index = $index;
            }
        }

        function highlightCoverageArea($index) {
            if ($scope.selectedCoverageArea)
                return
            if (hoveredCoverageArea) {
                hoveredCoverageArea.stroke.color = 'black';
                hoveredCoverageArea.fit = false;
                hoveredCoverageArea.editable = false;
                hoveredCoverageArea.index = $index;
            }
            hoveredCoverageArea = $scope.configPolygons[$index];
            hoveredCoverageArea.stroke.color = 'green';
            hoveredCoverageArea.fit = false;
            hoveredCoverageArea.editable = true;
            hoveredCoverageArea.index = $index;
        }

        function startEditCoverageArea($index) {
            $scope.selectedCoverageArea = $scope.configPolygons[$index];
            var bounds = new google.maps.LatLngBounds();
            for (j = 0; j < $scope.selectedCoverageArea.path.length; j++) {
                bounds.extend(new google.maps.LatLng($scope.selectedCoverageArea.path[j].latitude, $scope.selectedCoverageArea.path[j].longitude));
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
            };
            $scope.selectedCoverageAreaMode = 'EDIT';
            setupPolyLine('green', true, true, $index);
        }

        function cancelEditCoverageArea() {
            if ($scope.currentCompleteHandler)
                $scope.currentCompleteHandler.remove();
            if ($scope.configPolygons && $scope.configPolygons.length > 0) {
                $scope.configPolygons.length = 0;
            }
            $scope.selectedCoverageArea = null;
            $scope.selectedCoverageAreaMode = null;
            $scope.drawingManager.options.drawingMode = null;
            $scope.drawingManager.instance.setDrawingMode(null);

            setTimeout(function () {
                setupMap();
            });
        }

        function updateCoverageArea() {
            $scope.coverageAreas[$scope.selectedCoverageArea.index] = google.maps.geometry.encoding.encodePath($scope.selectedCoverageArea.path.map(function (p) {
                return new google.maps.LatLng(p.latitude, p.longitude);
            }));
            $scope.selectedCoverageAreaMode = 'VIEW';
            setupPolyLine('black', false, false);
            $scope.companyProfile.CoverageArea = $scope.coverageAreas.join();
            $http.put($config.API_ENDPOINT + 'api/partners/profile?profileId=' + $scope.companyProfile.Id, $scope.companyProfile)
                .success(function (data) {
                    $scope.selectedCoverageArea = null;
                    Notification.success('Coverage Area Modified');
                    setTimeout(function () {
                        setupMap();
                    });
                })
                .error(function (res) {
                    swal({
                        title: "Error updating coverage area",
                        text: "Some error has occurred.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                });
        }

        function deleteCoverageArea(index) {
            swal({
                title: "Are you sure?",
                text: "Coverage Area will be deleted",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: $UI.COLOURS.brandPrimary,
                confirmButtonText: "Confirm",
                closeOnConfirm: true
            }, function () {
                $scope.coverageAreas.splice(index, 1);
                $scope.configPolygons.splice(index, 1);
                setupMap();
                $scope.companyProfile.CoverageArea = $scope.coverageAreas.join();
                $http.put($config.API_ENDPOINT + 'api/partners/profile?profileId=' + $scope.companyProfile.Id, $scope.companyProfile)
                    .success(function (data) {
                        Notification.success('Coverage Area Deleted');
                    })
                    .error(function (res) {
                        swal({
                            title: "Error deleting coverage area",
                            text: "Some error has occurred.",
                            type: "error",
                            confirmButtonColor: $UI.COLOURS.brandSecondary
                        });
                    });
            });
        }

        function addNewCoverageArea() {
            $scope.selectedCoverageAreaMode = 'CREATE';
            $scope.drawingManager.options.drawingMode = google.maps.drawing.OverlayType.POLYGON;
            $scope.drawingManager.instance.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
            $scope.currentCompleteHandler = google.maps.event.addListener($scope.drawingManager.instance, 'overlaycomplete', function (event) {
                if (event.type == google.maps.drawing.OverlayType.POLYGON) {
                    event.overlay.setMap(null);

                    var encodedPath = google.maps.geometry.encoding.encodePath(event.overlay.getPath())
                    var polyDef = {
                        id: idCount++,
                        path: google.maps.geometry.encoding.decodePath(encodedPath).map(function (p) {
                            return {
                                latitude: p.lat(),
                                longitude: p.lng()
                            };
                        }),
                        rawPath: encodedPath,
                        editable: false,
                        draggable: true,
                        stroke: {
                            color: 'black',
                            weight: 5,
                            opacity: 0.8
                        },
                        $CoverageArea: $scope.selectedCoverageArea
                    };
                    $scope.selectedCoverageArea = polyDef;
                    $scope.configPolygons.push(polyDef);

                    $scope.drawingManager.options.drawingMode = null;
                    $scope.drawingManager.instance.setDrawingMode(null);
                    $scope.currentCompleteHandler.remove();
                    $scope.coverageAreas.push(encodedPath);
                    $scope.selectedCoverageAreaMode = 'VIEW';
                    $scope.$apply();
                    if ($scope.coverageAreas.length > 0) {
                        $scope.companyProfile.CoverageArea = $scope.coverageAreas.join();
                    }
                    $http.put($config.API_ENDPOINT + 'api/partners/profile?profileId=' + $scope.companyProfile.Id, $scope.companyProfile)
                        .success(function (data) {
                            $scope.selectedCoverageArea = null;
                            polyDef = null;
                            Notification.success('Coverage Area Added');
                        })
                        .error(function (res) {
                            swal({
                                title: "Error adding coverage area",
                                text: "Some error has occurred.",
                                type: "error",
                                confirmButtonColor: $UI.COLOURS.brandSecondary
                            });
                        });
                }
            });
        }

        function setupPolyLine(color, fit, editable, index) {
            $scope.selectedCoverageArea.stroke.color = color;
            $scope.selectedCoverageArea.fit = fit;
            $scope.selectedCoverageArea.editable = editable;
            $scope.selectedCoverageArea.index = index;
        }
    }
}(angular));