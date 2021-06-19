(function (angular) {
    var module = angular.module('cab9.workshare');
    module.controller('WorksharePartnerDetailsController', WorksharePartnerDetailsController);

    WorksharePartnerDetailsController.$inject = ['$scope', 'rCompanyProfile'];

    function WorksharePartnerDetailsController($scope, rCompanyProfile) {
        $scope.companyProfile = rCompanyProfile;
        if ($scope.companyProfile.CoverageArea) {
            $scope.coverageAreas = $scope.companyProfile.CoverageArea.split(',');
        }

        $scope.configPolygons = [];
        var idCount = 100000;

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
                    latitude: $scope.companyProfile.BaseLatitude || 51.471507,
                    longitude: $scope.companyProfile.BaseLongitude || -0.487904
                },
                zoom: 8,
                contol: {}
            };
            $scope.mapSetup = true;
            $scope.$apply();
        }
    }
}(angular));